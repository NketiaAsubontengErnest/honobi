"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { jobSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { generateNumber } from "@/lib/utils";

export async function createJob(formData: FormData) {
  await requirePermissionServer("jobs:create");
  const data = Object.fromEntries(formData.entries());
  const validated = jobSchema.parse(data);
  const jobNumber = generateNumber("JOB");

  const job = await prisma.job.create({
    data: {
      jobNumber,
      customerId: validated.customerId,
      title: validated.title,
      description: validated.description || null,
      projectId: validated.projectId || null,
      assignedTo: validated.assignedTo || null,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      expectedCompletion: validated.expectedCompletion ? new Date(validated.expectedCompletion) : null,
      estimatedCost: validated.estimatedCost ? String(validated.estimatedCost) : null,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/dashboard/jobs");
  return { success: true, job };
}

export async function updateJob(id: string, formData: FormData) {
  await requirePermissionServer("jobs:edit");
  const data = Object.fromEntries(formData.entries());
  const validated = jobSchema.parse(data);

  await prisma.job.update({
    where: { id },
    data: {
      customerId: validated.customerId,
      title: validated.title,
      description: validated.description || null,
      projectId: validated.projectId || null,
      assignedTo: validated.assignedTo || null,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      expectedCompletion: validated.expectedCompletion ? new Date(validated.expectedCompletion) : null,
      estimatedCost: validated.estimatedCost ? String(validated.estimatedCost) : null,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/dashboard/jobs");
  return { success: true };
}

export async function updateJobStatus(id: string, status: string) {
  await requirePermissionServer("jobs:edit");
  await prisma.job.update({ where: { id }, data: { status: status as never } });
  revalidatePath("/dashboard/jobs");
  return { success: true };
}

export async function deleteJob(id: string) {
  await requirePermissionServer("jobs:delete");
  await prisma.job.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/jobs");
  return { success: true };
}

export async function getJobs(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  await requirePermissionServer("jobs:view");
  const { page = 1, limit = 20, search = "", status = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { jobNumber: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        employee: { select: { name: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
}
