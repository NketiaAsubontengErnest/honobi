"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { incomeSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { generateNumber } from "@/lib/utils";

export async function createIncome(formData: FormData) {
  await requirePermissionServer("income:create");
  const data = Object.fromEntries(formData.entries());
  const validated = incomeSchema.parse(data);
  const incomeNumber = generateNumber("INC");

  const income = await prisma.income.create({
    data: {
      incomeNumber,
      date: new Date(validated.date),
      amount: validated.amount.toString(),
      customerId: validated.customerId || null,
      paymentMethod: validated.paymentMethod,
      category: validated.category,
      description: validated.description || null,
      reference: validated.reference || null,
    },
  });

  revalidatePath("/dashboard/income");
  return { success: true, income };
}

export async function updateIncome(id: string, formData: FormData) {
  await requirePermissionServer("income:edit");
  const data = Object.fromEntries(formData.entries());
  const validated = incomeSchema.parse(data);

  await prisma.income.update({
    where: { id },
    data: {
      date: new Date(validated.date),
      amount: validated.amount.toString(),
      customerId: validated.customerId || null,
      paymentMethod: validated.paymentMethod,
      category: validated.category,
      description: validated.description || null,
      reference: validated.reference || null,
    },
  });

  revalidatePath("/dashboard/income");
  return { success: true };
}

export async function deleteIncome(id: string) {
  await requirePermissionServer("income:delete");
  await prisma.income.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/income");
  return { success: true };
}

export async function getIncomeRecords(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  await requirePermissionServer("income:view");
  const { page = 1, limit = 20, search = "", category = "", startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    ...(search && {
      OR: [
        { description: { contains: search, mode: "insensitive" as const } },
        { incomeNumber: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category }),
    ...(startDate || endDate ? {
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    } : {}),
  };

  const [records, total, sumResult] = await Promise.all([
    prisma.income.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: { customer: true },
    }),
    prisma.income.count({ where }),
    prisma.income.aggregate({ where, _sum: { amount: true } }),
  ]);

  return {
    records,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalAmount: Number(sumResult._sum?.amount ?? 0),
  };
}
