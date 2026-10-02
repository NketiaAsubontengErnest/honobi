"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { projectSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

export async function createProject(formData: FormData) {
  await requirePermissionServer("projects:create");
  const data = Object.fromEntries(formData.entries());
  const validated = projectSchema.parse({
    ...data,
    slug: data.slug || slugify(String(data.name)),
    isFeatured: data.isFeatured === "on",
    isPublic: data.isPublic === "on" || data.isPublic === undefined,
  });

  const project = await prisma.project.create({
    data: {
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
      customerName: validated.customerName || null,
      location: validated.location || null,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      completionDate: validated.completionDate ? new Date(validated.completionDate) : null,
      budget: validated.budget ? String(validated.budget) : null,
      status: validated.status,
      coverImage: validated.coverImage || null,
      materialsUsed: validated.materialsUsed || null,
      servicesPerformed: validated.servicesPerformed || null,
      isFeatured: validated.isFeatured,
      isPublic: validated.isPublic,
      categoryId: validated.categoryId || null,
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath("/projects");
  return { success: true, project };
}

export async function updateProject(id: string, formData: FormData) {
  await requirePermissionServer("projects:edit");
  const data = Object.fromEntries(formData.entries());
  const validated = projectSchema.parse({
    ...data,
    slug: data.slug || slugify(String(data.name)),
    isFeatured: data.isFeatured === "on",
    isPublic: data.isPublic === "on" || data.isPublic === undefined,
  });

  await prisma.project.update({
    where: { id },
    data: {
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
      customerName: validated.customerName || null,
      location: validated.location || null,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      completionDate: validated.completionDate ? new Date(validated.completionDate) : null,
      budget: validated.budget ? String(validated.budget) : null,
      status: validated.status,
      coverImage: validated.coverImage || null,
      materialsUsed: validated.materialsUsed || null,
      servicesPerformed: validated.servicesPerformed || null,
      isFeatured: validated.isFeatured,
      isPublic: validated.isPublic,
      categoryId: validated.categoryId || null,
    },
  });

  revalidatePath("/dashboard/projects");
  return { success: true };
}

export async function deleteProject(id: string) {
  await requirePermissionServer("projects:delete");
  await prisma.project.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/projects");
  return { success: true };
}

export async function getProjects(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  await requirePermissionServer("projects:view");
  const { page = 1, limit = 20, search = "", status = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status }),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { category: true, images: { take: 1 } },
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total, page, limit, totalPages: Math.ceil(total / limit) };
}
