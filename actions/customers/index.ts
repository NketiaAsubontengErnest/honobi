"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { customerSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  await requirePermissionServer("customers:create");
  const data = Object.fromEntries(formData.entries());
  const validated = customerSchema.parse(data);

  const customer = await prisma.customer.create({
    data: {
      name: validated.name,
      phone: validated.phone,
      altPhone: validated.altPhone || null,
      email: validated.email || null,
      address: validated.address || null,
      city: validated.city || null,
      region: validated.region || null,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/dashboard/customers");
  return { success: true, customer };
}

export async function updateCustomer(id: string, formData: FormData) {
  await requirePermissionServer("customers:edit");
  const data = Object.fromEntries(formData.entries());
  const validated = customerSchema.parse(data);

  await prisma.customer.update({
    where: { id },
    data: {
      name: validated.name,
      phone: validated.phone,
      altPhone: validated.altPhone || null,
      email: validated.email || null,
      address: validated.address || null,
      city: validated.city || null,
      region: validated.region || null,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/dashboard/customers");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await requirePermissionServer("customers:delete");
  await prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/dashboard/customers");
  return { success: true };
}

export async function getCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
}) {
  await requirePermissionServer("customers:view");
  const { page = 1, limit = 20, search = "", region = "" } = params;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(region && { region }),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { jobs: true, invoices: true, quotes: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCustomerById(id: string) {
  await requirePermissionServer("customers:view");
  return prisma.customer.findUnique({
    where: { id },
    include: {
      jobs: { orderBy: { createdAt: "desc" }, take: 10 },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      quotes: { orderBy: { createdAt: "desc" }, take: 10 },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}
