"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";

export async function getServices(options?: { search?: string; categoryId?: string }) {
  await requirePermissionServer("services:view");
  const where: any = { isActive: true };
  if (options?.search) {
    where.name = { contains: options.search, mode: "insensitive" };
  }
  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }
  return prisma.service.findMany({
    where,
    include: { category: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
}

export async function getServiceById(id: string) {
  await requirePermissionServer("services:view");
  return prisma.service.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function createService(data: {
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  isFeatured?: boolean;
  isPublic?: boolean;
  order?: number;
  categoryId?: string;
}) {
  await requirePermissionServer("services:create");
  const slug = slugify(data.name);
  return prisma.service.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      image: data.image,
      icon: data.icon,
      isFeatured: data.isFeatured ?? false,
      isPublic: data.isPublic ?? true,
      order: data.order ?? 0,
      categoryId: data.categoryId || null,
    },
  });
}

export async function updateService(
  id: string,
  data: {
    name?: string;
    description?: string;
    image?: string;
    icon?: string;
    isFeatured?: boolean;
    isPublic?: boolean;
    order?: number;
    categoryId?: string;
  }
) {
  await requirePermissionServer("services:edit");
  const { name, description, image, icon, isFeatured, isPublic, order, categoryId } = data;
  const updateData = {
    name, description, image, icon, isFeatured, isPublic, order,
    ...(categoryId !== undefined && { categoryId: categoryId || null }),
    ...(name && { slug: slugify(name) }),
  };
  return prisma.service.update({ where: { id }, data: updateData });
}

export async function deleteService(id: string) {
  await requirePermissionServer("services:delete");
  return prisma.service.update({ where: { id }, data: { isActive: false } });
}

export async function getServiceCategories() {
  await requirePermissionServer("services:view");
  return prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: { services: { where: { isActive: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createServiceCategory(data: { name: string; description?: string; image?: string }) {
  await requirePermissionServer("services:create");
  const slug = slugify(data.name);
  return prisma.serviceCategory.create({
    data: { name: data.name, slug, description: data.description, image: data.image },
  });
}
