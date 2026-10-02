"use server";

import { prisma } from "@/lib/db/prisma";
import { requirePermissionServer } from "@/lib/auth/guard";
import { generateNumber } from "@/lib/utils";
import { payrollConfigSchema, payrollRunSchema } from "@/lib/validation/schemas";
import { computePayrollAmounts, type PayrollCycle } from "@/lib/payroll/compute";
import { Prisma } from "@prisma/client";

export type { PayrollCycle };

// ---------- serializers (Decimal -> number for the client boundary) ----------

function serializeConfig(c: any) {
  return {
    ...c,
    baseRate: Number(c.baseRate),
    allowance: c.allowance != null ? Number(c.allowance) : null,
    deduction: c.deduction != null ? Number(c.deduction) : null,
    effectiveFrom: c.effectiveFrom instanceof Date ? c.effectiveFrom.toISOString() : c.effectiveFrom,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

function serializeRun(r: any) {
  return {
    ...r,
    daysWorked: Number(r.daysWorked),
    baseAmount: Number(r.baseAmount),
    allowance: Number(r.allowance),
    deduction: Number(r.deduction),
    netAmount: Number(r.netAmount),
    periodStart: r.periodStart instanceof Date ? r.periodStart.toISOString() : r.periodStart,
    periodEnd: r.periodEnd instanceof Date ? r.periodEnd.toISOString() : r.periodEnd,
    paidDate: r.paidDate instanceof Date ? r.paidDate.toISOString() : r.paidDate,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

// ---------- payroll configs ----------

export async function getPayrollConfigs() {
  await requirePermissionServer("payroll:view");
  const configs = await prisma.payrollConfig.findMany({
    where: { isActive: true },
    include: { employee: { select: { id: true, employeeId: true, name: true, position: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return configs.map(serializeConfig);
}

export async function upsertPayrollConfig(input: {
  employeeId: string;
  cycle: PayrollCycle;
  baseRate: number | string;
  allowance?: number | string | null;
  deduction?: number | string | null;
  effectiveFrom?: string | null;
  notes?: string | null;
}) {
  const data = payrollConfigSchema.parse(input);
  const existing = await prisma.payrollConfig.findUnique({ where: { employeeId: data.employeeId } });
  if (existing) {
    await requirePermissionServer("payroll:edit");
  } else {
    await requirePermissionServer("payroll:create");
  }

  const config = await prisma.payrollConfig.upsert({
    where: { employeeId: data.employeeId },
    update: {
      cycle: data.cycle as never,
      baseRate: new Prisma.Decimal(data.baseRate),
      allowance: data.allowance != null ? new Prisma.Decimal(Number(data.allowance)) : null,
      deduction: data.deduction != null ? new Prisma.Decimal(Number(data.deduction)) : null,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      notes: data.notes || null,
      isActive: true,
    },
    create: {
      employeeId: data.employeeId,
      cycle: data.cycle as never,
      baseRate: new Prisma.Decimal(data.baseRate),
      allowance: data.allowance != null ? new Prisma.Decimal(Number(data.allowance)) : null,
      deduction: data.deduction != null ? new Prisma.Decimal(Number(data.deduction)) : null,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      notes: data.notes || null,
    },
  });

  // Keep the employee's stored salary roughly in sync (store the per-cycle base).
  await prisma.employee.update({
    where: { id: data.employeeId },
    data: { salary: new Prisma.Decimal(data.baseRate) },
  });

  return serializeConfig(config);
}

export async function deletePayrollConfig(id: string) {
  await requirePermissionServer("payroll:delete");
  return prisma.payrollConfig.update({ where: { id }, data: { isActive: false } });
}

// ---------- payroll runs ----------

export async function getPayrollRuns(filters?: { status?: string; cycle?: string }) {
  await requirePermissionServer("payroll:view");
  const runs = await prisma.payrollRun.findMany({
    where: {
      isActive: true,
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.cycle ? { cycle: filters.cycle as never } : {}),
    },
    include: {
      employee: { select: { id: true, employeeId: true, name: true, position: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return runs.map(serializeRun);
}

export async function createPayrollRun(input: {
  employeeId: string;
  cycle: PayrollCycle;
  periodStart: string;
  periodEnd: string;
  daysWorked?: number | string;
  allowance?: number | string;
  deduction?: number | string;
  notes?: string | null;
  baseRateOverride?: number | string | null;
}) {
  const user = await requirePermissionServer("payroll:create");
  const data = payrollRunSchema.parse(input);

  const config = await prisma.payrollConfig.findUnique({ where: { employeeId: data.employeeId } });
  const baseRate =
    input.baseRateOverride != null && Number(input.baseRateOverride) > 0
      ? Number(input.baseRateOverride)
      : config
        ? Number(config.baseRate)
        : 0;
  if (!(baseRate > 0)) throw new Error("No pay rate found — set a payroll configuration for this employee first");

  const { baseAmount, netAmount } = computePayrollAmounts({
    cycle: data.cycle,
    baseRate,
    daysWorked: Number(data.daysWorked) || 0,
    allowance: Number(data.allowance) || 0,
    deduction: Number(data.deduction) || 0,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
  });

  const run = await prisma.payrollRun.create({
    data: {
      runNumber: generateNumber("PAY"),
      employeeId: data.employeeId,
      cycle: data.cycle as never,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      daysWorked: new Prisma.Decimal(Number(data.daysWorked) || 0),
      baseAmount: new Prisma.Decimal(baseAmount),
      allowance: new Prisma.Decimal(Number(data.allowance) || 0),
      deduction: new Prisma.Decimal(Number(data.deduction) || 0),
      netAmount: new Prisma.Decimal(netAmount),
      status: "PENDING",
      notes: data.notes || null,
      createdById: user.id,
    },
    include: { employee: { select: { id: true, employeeId: true, name: true, position: true } } },
  });

  return serializeRun(run);
}

export async function markPayrollRunPaid(id: string, opts?: { recordExpense?: boolean }) {
  const user = await requirePermissionServer("payroll:edit");
  const run = await prisma.payrollRun.findUnique({ where: { id }, include: { employee: true } });
  if (!run) throw new Error("Payroll run not found");
  if (run.status === "PAID") throw new Error("This payroll run is already paid");
  if (run.status === "CANCELLED") throw new Error("Cancelled payroll runs cannot be paid");

  const period = `${run.periodStart.toISOString().slice(0, 10)} → ${run.periodEnd.toISOString().slice(0, 10)}`;

  // Record the salary payment against the employee
  const payment = await prisma.salaryPayment.create({
    data: {
      employeeId: run.employeeId,
      amount: run.netAmount,
      date: new Date(),
      type: "salary",
      period,
      notes: `Payroll run ${run.runNumber}`,
    },
  });

  // Optionally book it as a SALARIES expense so the finance totals stay in sync
  let expenseId: string | null = null;
  if (opts?.recordExpense) {
    const expense = await prisma.expense.create({
      data: {
        expenseNumber: generateNumber("EXP"),
        date: new Date(),
        amount: run.netAmount,
        category: "SALARIES" as never,
        paymentMethod: "CASH" as never,
        description: `Payroll ${run.runNumber} — ${run.employee.name} (${period})`,
      },
    });
    expenseId = expense.id;
  }

  const updated = await prisma.payrollRun.update({
    where: { id },
    data: { status: "PAID", paidDate: new Date(), paymentId: payment.id },
    include: { employee: { select: { id: true, employeeId: true, name: true, position: true } } },
  });

  void user;
  void expenseId;
  return serializeRun(updated);
}

export async function cancelPayrollRun(id: string) {
  await requirePermissionServer("payroll:edit");
  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) throw new Error("Payroll run not found");
  if (run.status === "PAID") throw new Error("Paid payroll runs cannot be cancelled");
  const updated = await prisma.payrollRun.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: { employee: { select: { id: true, employeeId: true, name: true, position: true } } },
  });
  return serializeRun(updated);
}

export async function deletePayrollRun(id: string) {
  await requirePermissionServer("payroll:delete");
  return prisma.payrollRun.update({ where: { id }, data: { isActive: false } });
}

// ---------- dashboard summary ----------

export async function getPayrollSummary() {
  await requirePermissionServer("payroll:view");
  const [pending, paidThisMonth, configs] = await Promise.all([
    prisma.payrollRun.aggregate({
      _sum: { netAmount: true },
      _count: true,
      where: { isActive: true, status: "PENDING" },
    }),
    prisma.payrollRun.aggregate({
      _sum: { netAmount: true },
      where: {
        isActive: true,
        status: "PAID",
        paidDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.payrollConfig.groupBy({ by: ["cycle"], _count: true, where: { isActive: true } }),
  ]);
  return {
    pendingCount: pending._count,
    pendingTotal: Number(pending._sum.netAmount || 0),
    paidThisMonthTotal: Number(paidThisMonth._sum.netAmount || 0),
    byCycle: configs.map((c: any) => ({ cycle: c.cycle, count: c._count })),
  };
}
