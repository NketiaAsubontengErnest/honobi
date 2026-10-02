import { prisma } from "@/lib/db/prisma";
import { GalleryGrid } from "@/components/public/gallery-grid";

export default async function GalleryPage() {
  const projects = await prisma.project.findMany({
    where: { isActive: true, isPublic: true },
    include: { images: true },
  });

  const allImages = projects.flatMap((p: typeof projects[0]) =>
    p.images.map((img: typeof p.images[0]) => ({
      id: img.id,
      url: img.url,
      altText: img.altText ?? p.name,
      project: p.name,
    }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Project Gallery</h1>
        <p className="text-xl text-muted-foreground">
          A visual showcase of our carpentry work and completed projects.
        </p>
      </div>

      <GalleryGrid images={allImages} />

      {allImages.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No gallery images yet.</p>
      )}
    </div>
  );
}
