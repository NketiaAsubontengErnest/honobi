// One-off: point existing product/project/service records at the local photos in /public/images.
// Only image URL fields are touched. Run with: npx tsx scripts/apply-images.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products: Record<string, string> = {
  "3-seater-wooden-sofa": "/images/products/sofa.jpg",
  "kitchen-cabinet-set": "/images/products/cabinet.jpg",
  "queen-size-bed-frame": "/images/products/bed.jpg",
  "office-desk-executive": "/images/products/desk.jpg",
  "wardrobe-4-door": "/images/products/wardrobe.jpg",
  "tv-console-modern": "/images/products/tv-console.jpg",
  "dining-table-set-6": "/images/products/dining.jpg",
  "bookshelf-5-tier": "/images/products/bookshelf.jpg",
};

const projects: Record<string, { cover: string; gallery: string[] }> = {};

const services: Record<string, string> = {
  "custom-furniture-design": "/images/services/workshop.jpg",
  "kitchen-cabinets": "/images/products/cabinet.jpg",
  "wardrobes-storage": "/images/projects/wardrobe.jpg",
  "office-furniture": "/images/projects/office.jpg",
  "doors-windows": "/images/services/carpentry.jpg",
  "interior-woodwork": "/images/services/carpentry.jpg",
  "furniture-repair": "/images/services/carpentry.jpg",
  renovation: "/images/projects/kitchen.jpg",
};

async function main() {
  for (const [slug, url] of Object.entries(products)) {
    const p = await prisma.product.findUnique({ where: { slug } });
    if (!p) continue;
    await prisma.productImage.deleteMany({ where: { productId: p.id } });
    await prisma.productImage.create({ data: { productId: p.id, url, altText: p.name, order: 0 } });
    console.log("product", slug);
  }

  // Projects: map by the old svg name found in the existing cover image
  const byOld: Record<string, string> = {
    "kitchen.svg": "/images/projects/kitchen.jpg",
    "office.svg": "/images/projects/office.jpg",
    "wardrobe.svg": "/images/projects/wardrobe.jpg",
  };
  const allProjects = await prisma.project.findMany();
  for (const pr of allProjects) {
    const key = (pr.coverImage ?? "").split("/").pop() ?? "";
    const cover = byOld[key];
    if (!cover) continue;
    const gallery = cover.includes("kitchen")
      ? [cover, "/images/products/cabinet.jpg", "/images/products/dining.jpg"]
      : cover.includes("office")
        ? [cover, "/images/projects/living-room.jpg"]
        : [cover, "/images/products/bed.jpg"];
    await prisma.project.update({ where: { id: pr.id }, data: { coverImage: cover } });
    await prisma.projectImage.deleteMany({ where: { projectId: pr.id } });
    await prisma.projectImage.createMany({
      data: gallery.map((url, i) => ({ projectId: pr.id, url, altText: pr.name, order: i })),
    });
    console.log("project", pr.slug);
  }
  void projects;

  for (const [slug, image] of Object.entries(services)) {
    await prisma.service.updateMany({ where: { slug }, data: { image } });
    console.log("service", slug);
  }
}

main().finally(() => prisma.$disconnect());
