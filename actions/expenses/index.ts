"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { expenseSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { generateNumber } from "@/lib/utils";

export async function createExpense(formData: FormData) {
  await requirePermissionServer("expenses:create");
  const data = Object.fromEntries(formData.entries());
  const validated = expenseSchema.parse(data);

  const expenseNumber = generateNumber("EXP");

  const expense = await prisma.expense.create({
    data: {
      expenseNumber,
      date: new Date(validated.date),
      amount: validated.amount.toString(),
      category: validated.category,
      supplierId: validated.supplierId || null,
      description: validated.description || null,
      paymentMethod: validated.paymentMethod,
      reference: validated.reference || null,
    },
  });

  revalidatePath("/dashboard/expenses");
  return { success: true, expense };
}

export async function updateExpense(id: string, formData: FormData) {
  await requirePermissionServer("expenses:edit");
  const data = Object.fromEntries(formData.entries());
  const validated = expenseSchema.parse(data);

  await prisma.expense.update({
    where: { id },
    data: {
      date: new Date(validated.date),
      amount: validated.amount.toString(),
      category: validated.category,
      supplierId: validated.supplierId || null,
      description: validated.description || null,
      paymentMethod: validated.paymentMethod,
      reference: validated.reference || null,
    },
  });

  revalidatePath("/dashboard/expenses");
  return { success: true };
}

export async function deleteExpense(id: string) {
  await requirePermissionServer("expenses:delete");
  await prisma.expense.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/expenses");
  return { success: true };
}

export async function getExpenses(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  await requirePermissionServer("expenses:view");
  const { page = 1, limit = 20, search = "", category = "", startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    ...(search && {
      OR: [
        { description: { contains: search, mode: "insensitive" as const } },
        { expenseNumber: { contains: search, mode: "insensitive" as const } },
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

  const [expenses, total, sumResult] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: { supplier: true },
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return {
    expenses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalAmount: Number(sumResult._sum?.amount ?? 0),
  };
}
