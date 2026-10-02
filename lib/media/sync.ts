import { prisma } from "@/lib/db/prisma";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function mimeFromUrl(url: string): string | null {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? null;
}

/**
 * Registers every image already used on the website (project photos, product photos,
 * service photos) in the media library, so the library shows what the public pages show.
 * Database-only (works on Vercel) and idempotent; images removed from the library stay removed.
 */
export async function syncUsedImagesToMedia() {
  const [projectImages, projects, productImages, services, existing] = await Promise.all([
    prisma.projectImage.findMany({ select: { url: true, altText: true } }),
    prisma.project.findMany({ where: { coverImage: { not: null } }, select: { coverImage: true, name: true } }),
    prisma.productImage.findMany({ select: { url: true, altText: true } }),
    prisma.service.findMany({ where: { image: { not: null } }, select: { image: true, name: true } }),
    prisma.media.findMany({ select: { url: true } }),
  ]);

  const known = new Set(existing.map((m) => m.url));
  const wanted = new Map<string, { folder: string; alt: string | null }>();
  const add = (url: string | null | undefined, folder: string, alt: string | null) => {
    if (url && !known.has(url) && !wanted.has(url) && mimeFromUrl(url)) wanted.set(url, { folder, alt });
  };

  projectImages.forEach((i) => add(i.url, "projects", i.altText));
  projects.forEach((p) => add(p.coverImage, "projects", p.name));
  productImages.forEach((i) => add(i.url, "products", i.altText));
  services.forEach((s) => add(s.image, "services", s.name));

  if (wanted.size === 0) return { added: 0 };

  await prisma.media.createMany({
    data: Array.from(wanted.entries()).map(([url, { folder, alt }]) => ({
      url,
      filename: decodeURIComponent(url.split("?")[0].split("/").pop() || "image"),
      mimeType: mimeFromUrl(url)!,
      folder,
      altText: alt,
    })),
  });
  return { added: wanted.size };
}
