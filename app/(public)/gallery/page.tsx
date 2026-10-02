import { prisma } from "@/lib/db/prisma";
import { GalleryGrid } from "@/components/public/gallery-grid";

export const dynamic = "force-dynamic";

// Media-library folders whose images appear on the public gallery
const GALLERY_FOLDERS = ["gallery", "uploads", "projects"];

export default async function GalleryPage() {
  const [projects, media] = await Promise.all([
    prisma.project.findMany({
      where: { isActive: true, isPublic: true },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.media.findMany({
      where: { isActive: true, mimeType: { startsWith: "image/" }, folder: { in: GALLERY_FOLDERS } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const seen = new Set<string>();
  const allImages: { id: string; url: string; altText: string; project: string }[] = [];
  const push = (id: string, url: string, altText: string, project: string) => {
    if (seen.has(url)) return;
    seen.add(url);
    allImages.push({ id, url, altText, project });
  };

  // Newest uploads first, then the project photos
  for (const m of media) {
    if (m.folder === "projects") continue; // shown below with their project name
    push(m.id, m.url, m.altText ?? m.filename, m.altText ?? "");
  }
  for (const p of projects) {
    for (const img of p.images) push(img.id, img.url, img.altText ?? p.name, p.name);
  }

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
