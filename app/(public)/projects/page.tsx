import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function PublicProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { isActive: true, isPublic: true },
    include: { category: true, images: { take: 1 } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Projects</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore our portfolio of completed carpentry and woodworking projects.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project: typeof projects[0]) => (
          <Link key={project.id} href={`/projects/${project.slug}`} className="group">
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted overflow-hidden">
                {project.coverImage ? (
                  <img src={project.coverImage} alt={project.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{project.category?.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">{project.status}</span>
                </div>
                <h3 className="font-semibold text-lg mt-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{project.location}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
