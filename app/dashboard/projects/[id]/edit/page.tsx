import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProjectEditForm } from "./project-edit-form";

function toDateString(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id, isActive: true } });

  if (!project) notFound();

  return (
    <ProjectEditForm
      projectId={project.id}
      initialData={{
        name: project.name,
        slug: project.slug,
        description: project.description ?? "",
        customerName: project.customerName ?? "",
        location: project.location ?? "",
        startDate: toDateString(project.startDate),
        completionDate: toDateString(project.completionDate),
        budget: project.budget ? String(project.budget) : "",
        status: project.status,
        coverImage: project.coverImage ?? "",
        materialsUsed: project.materialsUsed ?? "",
        servicesPerformed: project.servicesPerformed ?? "",
        isFeatured: project.isFeatured,
        isPublic: project.isPublic,
      }}
    />
  );
}
