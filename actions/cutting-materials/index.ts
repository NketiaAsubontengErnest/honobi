"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermissionServer } from "@/lib/auth/guard";

const MATERIAL_TYPES = ["MDF", "PLYWOOD", "HARDWOOD", "SOFTWOOD", "MELAMINE", "CHIPBOARD", "VENEER", "LAMINATED", "CUSTOM"] as const;

const materialSchema = z.object({
  name: z.string().trim().min(2, "Material name is required").max(120),
  materialType: z.enum(MATERIAL_TYPES).default("MDF"),
  length: z.coerce.number().positive("Length must be positive"),
  width: z.coerce.number().positive("Width must be positive"),
  thickness: z.coerce.number().positive().optional().nullable(),
  unit: z.enum(["mm", "cm", "in"]).default("mm"),
  quantity: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  price: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type MaterialInput = z.input<typeof materialSchema>;

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function serialize(m: {
  id: string; name: string; materialType: string; length: unknown; width: unknown; thickness: unknown;
  unit: string; quantity: number; price: unknown; notes: string | null; isActive: boolean;
}) {
  return {
    id: m.id,
    name: m.name,
    materialType: m.materialType,
    length: Number(m.length),
    width: Number(m.width),
    thickness: num(m.thickness),
    unit: m.unit,
    quantity: m.quantity,
    price: num(m.price),
    notes: m.notes,
    isActive: m.isActive,
  };
}

export type CuttingMaterialRow = ReturnType<typeof serialize>;

export async function getCuttingMaterials(): Promise<CuttingMaterialRow[]> {
  await requirePermissionServer("cuttingPlans:view");
  const rows = await prisma.cuttingMaterial.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return rows.map(serialize);
}

export async function createCuttingMaterial(input: MaterialInput) {
  await requirePermissionServer("cuttingPlans:create");
  const d = materialSchema.parse(input);
  const row = await prisma.cuttingMaterial.create({
    data: { ...d, thickness: d.thickness ?? null, price: d.price ?? null, notes: d.notes?.trim() || null },
  });
  revalidatePath("/dashboard/cutting-plans/materials");
  return serialize(row);
}

export async function updateCuttingMaterial(id: string, input: MaterialInput) {
  await requirePermissionServer("cuttingPlans:edit");
  const d = materialSchema.parse(input);
  const row = await prisma.cuttingMaterial.update({
    where: { id },
    data: { ...d, thickness: d.thickness ?? null, price: d.price ?? null, notes: d.notes?.trim() || null },
  });
  revalidatePath("/dashboard/cutting-plans/materials");
  return serialize(row);
}

/** Add (positive) or remove (negative) sheets from stock. */
export async function adjustMaterialStock(id: string, change: number) {
  await requirePermissionServer("cuttingPlans:edit");
  const delta = Math.trunc(Number(change));
  if (!Number.isFinite(delta) || delta === 0) throw new Error("Enter a whole number other than zero");
  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.cuttingMaterial.findUnique({ where: { id } });
    if (!current) throw new Error("Material not found");
    if (current.quantity + delta < 0) throw new Error(`Only ${current.quantity} in stock; cannot remove ${Math.abs(delta)}`);
    return tx.cuttingMaterial.update({ where: { id }, data: { quantity: { increment: delta } } });
  });
  revalidatePath("/dashboard/cutting-plans/materials");
  return serialize(row);
}

export async function deleteCuttingMaterial(id: string) {
  await requirePermissionServer("cuttingPlans:delete");
  await prisma.cuttingMaterial.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/cutting-plans/materials");
  return { success: true };
}
