import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug, isActive: true, isPublic: true },
    include: { category: true, images: true },
  });

  if (!project) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{project.category?.name}</p>
        <h1 className="text-4xl font-bold mt-2">{project.name}</h1>
        {project.location && <p className="text-muted-foreground mt-2">{project.location}</p>}
      </div>

      {project.coverImage && (
        <div className="aspect-video rounded-lg overflow-hidden mb-8">
          <img src={project.coverImage} alt={project.name} className="object-cover w-full h-full" />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8 text-sm">
        <div className="border rounded p-4">
          <p className="text-muted-foreground">Status</p>
          <p className="font-semibold">{project.status.replace(/_/g, " ")}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-muted-foreground">Start Date</p>
          <p className="font-semibold">{project.startDate ? formatDate(project.startDate) : "N/A"}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-muted-foreground">Budget</p>
          <p className="font-semibold">{project.budget ? formatCurrency(Number(project.budget)) : "N/A"}</p>
        </div>
      </div>

      {project.description && (
        <div className="prose mb-8">
          <h2>Project Overview</h2>
          <p>{project.description}</p>
        </div>
      )}

      {project.materialsUsed && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Materials Used</h2>
          <p className="text-muted-foreground">{project.materialsUsed}</p>
        </div>
      )}

      {project.servicesPerformed && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Services Performed</h2>
          <p className="text-muted-foreground">{project.servicesPerformed}</p>
        </div>
      )}

      {project.images.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Project Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {project.images.map((img: typeof project.images[0]) => (
              <div key={img.id} className="aspect-square bg-muted rounded overflow-hidden">
                <img src={img.url} alt={img.altText ?? project.name} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
