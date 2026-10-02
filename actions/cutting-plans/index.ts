"use server";

import { prisma } from "@/lib/db/prisma";
import { generateNumber } from "@/lib/utils";
import { cuttingPlanSchema, boardPresetSchema } from "@/lib/validation/schemas";
import { requirePermissionServer } from "@/lib/auth/guard";
import { optimizeCuttingPlan, type OptimizerResult } from "@/lib/cutting-optimizer";

// ---------- serialization helpers ----------
const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

function serializePlan(plan: any) {
  return {
    ...plan,
    boardLength: num(plan.boardLength),
    boardWidth: num(plan.boardWidth),
    boardThickness: num(plan.boardThickness),
    boardPrice: num(plan.boardPrice),
    kerf: num(plan.kerf),
    trimTop: num(plan.trimTop),
    trimBottom: num(plan.trimBottom),
    trimLeft: num(plan.trimLeft),
    trimRight: num(plan.trimRight),
    totalPieceArea: num(plan.totalPieceArea),
    totalBoardArea: num(plan.totalBoardArea),
    wasteArea: num(plan.wasteArea),
    efficiency: num(plan.efficiency),
    pieces: (plan.pieces ?? []).map((p: any) => ({
      ...p,
      length: num(p.length),
      width: num(p.width),
      thickness: num(p.thickness),
    })),
  };
}

// ---------- queries ----------

export async function getCuttingPlans(filters?: {
  search?: string;
  status?: string;
  projectId?: string;
  jobId?: string;
  from?: string;
  to?: string;
}) {
  await requirePermissionServer("cuttingPlans:view");

  const where: any = { isActive: true };
  if (filters?.status && filters.status !== "ALL") where.status = filters.status;
  if (filters?.projectId) where.projectId = filters.projectId;
  if (filters?.jobId) where.jobId = filters.jobId;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { planNumber: { contains: filters.search, mode: "insensitive" } },
      { materialName: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(`${filters.to}T23:59:59`);
  }

  const plans = await prisma.cuttingPlan.findMany({
    where,
    include: {
      pieces: true,
      project: { select: { id: true, name: true } },
      job: { select: { id: true, jobNumber: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { plans: plans.map(serializePlan) };
}

export async function getCuttingPlanById(id: string) {
  await requirePermissionServer("cuttingPlans:view");
  const plan = await prisma.cuttingPlan.findFirst({
    where: { id, isActive: true },
    include: {
      pieces: { orderBy: { order: "asc" } },
      project: { select: { id: true, name: true } },
      job: { select: { id: true, jobNumber: true, title: true } },
      supplier: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  return plan ? serializePlan(plan) : null;
}

// ---------- mutations ----------

type PlanInput = {
  name: string;
  projectId?: string | null;
  jobId?: string | null;
  supplierId?: string | null;
  customerName?: string | null;
  materialName: string;
  materialType: string;
  boardLength: number;
  boardWidth: number;
  boardThickness?: number | null;
  boardQuantity: number;
  unit?: string;
  boardPrice?: number | null;
  notes?: string | null;
  kerf: number;
  trimTop: number;
  trimBottom: number;
  trimLeft: number;
  trimRight: number;
  direction: string;
  allowRotation: boolean;
  grainStrategy: string;
  strategy: string;
  pieces: {
    name: string;
    length: number;
    width: number;
    quantity: number;
    thickness?: number | null;
    grain: string;
    allowRotation: boolean;
    notes?: string | null;
    edgeTop?: string | null;
    edgeBottom?: string | null;
    edgeLeft?: string | null;
    edgeRight?: string | null;
  }[];
  result?: OptimizerResult | null;
};

function buildData(input: PlanInput, layout?: OptimizerResult | null): Record<string, unknown> {
  const validated = cuttingPlanSchema.parse(input);
  const res = layout ?? null;
  return {
    name: validated.name,
    projectId: validated.projectId || null,
    jobId: validated.jobId || null,
    supplierId: validated.supplierId || null,
    customerName: validated.customerName || null,
    materialName: validated.materialName,
    materialType: validated.materialType as never,
    boardLength: validated.boardLength,
    boardWidth: validated.boardWidth,
    boardThickness: validated.boardThickness ?? null,
    boardQuantity: validated.boardQuantity,
    unit: validated.unit,
    boardPrice: validated.boardPrice ?? null,
    notes: validated.notes || null,
    kerf: validated.kerf,
    trimTop: validated.trimTop,
    trimBottom: validated.trimBottom,
    trimLeft: validated.trimLeft,
    trimRight: validated.trimRight,
    direction: validated.direction as never,
    allowRotation: validated.allowRotation,
    grainStrategy: validated.grainStrategy as never,
    strategy: validated.strategy as never,
    pieces: {
      create: validated.pieces.map((p, i) => ({
        name: p.name,
        length: p.length,
        width: p.width,
        quantity: p.quantity,
        thickness: p.thickness ?? null,
        grain: p.grain as never,
        allowRotation: p.allowRotation,
        notes: p.notes || null,
        edgeTop: p.edgeTop?.trim() || null,
        edgeBottom: p.edgeBottom?.trim() || null,
        edgeLeft: p.edgeLeft?.trim() || null,
        edgeRight: p.edgeRight?.trim() || null,
        order: i,
      })),
    },
    ...(res
      ? {
          status: "GENERATED" as never,
          boardsUsed: res.boardsUsed,
          totalPieceArea: res.totalPieceArea,
          totalBoardArea: res.totalBoardArea,
          wasteArea: res.wasteArea,
          efficiency: res.efficiency,
          layout: res as never,
          cutSequence: res.boards.map((b) => ({ boardIndex: b.boardIndex, cuts: b.cuts })) as never,
          unplacedPieces: res.unplaced as never,
          generatedAt: new Date(),
        }
      : {}),
  };
}

export async function createCuttingPlan(input: PlanInput) {
  const user = await requirePermissionServer("cuttingPlans:create");
  const data = buildData(input, input.result ?? null);
  return prisma.cuttingPlan.create({
    data: {
      ...data,
      planNumber: generateNumber("CUT"),
      createdById: user.id,
    } as never,
    select: { id: true, planNumber: true },
  });
}

export async function updateCuttingPlan(id: string, input: PlanInput) {
  await requirePermissionServer("cuttingPlans:edit");
  const data = buildData(input, input.result ?? null);
  const { pieces, ...rest } = data;
  await prisma.cuttingPiece.deleteMany({ where: { planId: id } });
  return prisma.cuttingPlan.update({
    where: { id },
    data: { ...rest, pieces } as never,
    select: { id: true, planNumber: true },
  });
}

export async function generateCuttingPlan(id: string): Promise<OptimizerResult> {
  await requirePermissionServer("cuttingPlans:edit");
  const plan = await prisma.cuttingPlan.findUnique({ where: { id }, include: { pieces: true } });
  if (!plan) throw new Error("Cutting plan not found");

  const result = optimizeCuttingPlan(
    plan.pieces.map((p: any) => ({
      ref: p.id,
      name: p.name,
      length: Number(p.length),
      width: Number(p.width),
      quantity: p.quantity,
      grain: p.grain as "NONE" | "LENGTH" | "WIDTH",
      allowRotation: p.allowRotation,
    })),
    {
      boardLength: Number(plan.boardLength),
      boardWidth: Number(plan.boardWidth),
      boardQuantity: plan.boardQuantity,
      kerf: Number(plan.kerf),
      trimTop: Number(plan.trimTop),
      trimBottom: Number(plan.trimBottom),
      trimLeft: Number(plan.trimLeft),
      trimRight: Number(plan.trimRight),
      direction: plan.direction as "HORIZONTAL" | "VERTICAL" | "AUTOMATIC",
      allowRotation: plan.allowRotation,
      grainStrategy: plan.grainStrategy as "NONE" | "LENGTH" | "WIDTH",
    }
  );

  await prisma.cuttingPlan.update({
    where: { id },
    data: {
      status: "GENERATED",
      boardsUsed: result.boardsUsed,
      totalPieceArea: result.totalPieceArea,
      totalBoardArea: result.totalBoardArea,
      wasteArea: result.wasteArea,
      efficiency: result.efficiency,
      layout: result as never,
      cutSequence: result.boards.map((b) => ({ boardIndex: b.boardIndex, cuts: b.cuts })) as never,
      unplacedPieces: result.unplaced as never,
      generatedAt: new Date(),
    },
  });

  return result;
}

export async function updateCuttingPlanStatus(id: string, status: string) {
  if (status === "APPROVED") {
    await requirePermissionServer("cuttingPlans:approve");
  } else {
    await requirePermissionServer("cuttingPlans:edit");
  }
  return prisma.cuttingPlan.update({
    where: { id },
    data: { status: status as never },
    select: { id: true, status: true },
  });
}

export async function duplicateCuttingPlan(id: string) {
  const user = await requirePermissionServer("cuttingPlans:create");
  const plan = await prisma.cuttingPlan.findUnique({ where: { id }, include: { pieces: true } });
  if (!plan) throw new Error("Cutting plan not found");

  const { id: _id, planNumber: _pn, createdAt: _c, updatedAt: _u, pieces, ...rest } = plan;
  const copy = await prisma.cuttingPlan.create({
    data: {
      ...rest,
      layout: rest.layout ?? undefined,
      name: `${plan.name} (Copy)`,
      status: "DRAFT",
      planNumber: generateNumber("CUT"),
      createdById: user.id,
      pieces: {
        create: pieces.map((p: any) => {
          const { id: _pid, planId: _plid, createdAt: _pc, updatedAt: _pu, ...piece } = p;
          return piece;
        }),
      },
    } as never,
  });
  return copy;
}

export async function deleteCuttingPlan(id: string) {
  await requirePermissionServer("cuttingPlans:delete");
  return prisma.cuttingPlan.update({
    where: { id },
    data: { isActive: false, status: "ARCHIVED" },
    select: { id: true },
  });
}

// ---------- board presets ----------

export async function getBoardPresets() {
  const presets = await prisma.boardPreset.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return presets.map((p: any) => ({
    ...p,
    length: Number(p.length),
    width: Number(p.width),
    thickness: p.thickness === null ? null : Number(p.thickness),
  }));
}

export async function createBoardPreset(input: {
  name: string;
  materialType: string;
  length: number;
  width: number;
  thickness?: number | null;
  unit?: string;
}) {
  const user = await requirePermissionServer("cuttingPlans:create");
  const validated = boardPresetSchema.parse(input);
  return prisma.boardPreset.upsert({
    where: { name: validated.name },
    update: {},
    create: {
      name: validated.name,
      materialType: validated.materialType as never,
      length: validated.length,
      width: validated.width,
      thickness: validated.thickness ?? null,
      unit: validated.unit,
      createdById: user.id,
    },
    select: { id: true, name: true },
  });
}

export async function deleteBoardPreset(id: string) {
  await requirePermissionServer("cuttingPlans:delete");
  return prisma.boardPreset.update({ where: { id }, data: { isActive: false } });
}
