"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { supplierSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

export async function createSupplier(formData: FormData) {
  await requirePermissionServer("suppliers:create");
  const data = Object.fromEntries(formData.entries());
  const validated = supplierSchema.parse(data);

  const supplier = await prisma.supplier.create({
    data: {
      name: validated.name,
      contactPerson: validated.contactPerson || null,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      materials: validated.materials || null,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/dashboard/suppliers");
  return { success: true, supplier };
}

export async function updateSupplier(id: string, formData: FormData) {
  await requirePermissionServer("suppliers:edit");
  const data = Object.fromEntries(formData.entries());
  const validated = supplierSchema.parse(data);

  await prisma.supplier.update({
    where: { id },
    data: {
      name: validated.name,
      contactPerson: validated.contactPerson || null,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      materials: validated.materials || null,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/dashboard/suppliers");
  return { success: true };
}

export async function deleteSupplier(id: string) {
  await requirePermissionServer("suppliers:delete");
  await prisma.supplier.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/suppliers");
  return { success: true };
}

export async function getSuppliers(params: { page?: number; limit?: number; search?: string }) {
  await requirePermissionServer("suppliers:view");
  const { page = 1, limit = 20, search = "" } = params;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { contactPerson: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
    prisma.supplier.count({ where }),
  ]);

  return { suppliers, total, page, limit, totalPages: Math.ceil(total / limit) };
}
