"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { productSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

export async function createProduct(formData: FormData) {
  await requirePermissionServer("products:create");
  const data = Object.fromEntries(formData.entries());
  const validated = productSchema.parse({
    ...data,
    slug: data.slug || slugify(String(data.name)),
    isFeatured: data.isFeatured === "on",
    isPublic: data.isPublic === "on" || data.isPublic === undefined,
    showPrice: data.showPrice === "on",
  });

  const product = await prisma.product.create({
    data: {
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
      price: validated.price.toString(),
      discountedPrice: validated.discountedPrice ? String(validated.discountedPrice) : null,
      sku: validated.sku || null,
      dimensions: validated.dimensions || null,
      materials: validated.materials || null,
      color: validated.color || null,
      availability: validated.availability || null,
      status: validated.status,
      isFeatured: validated.isFeatured,
      isPublic: validated.isPublic,
      showPrice: validated.showPrice,
      categoryId: validated.categoryId || null,
    },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  return { success: true, product };
}

export async function updateProduct(id: string, formData: FormData) {
  await requirePermissionServer("products:edit");
  const data = Object.fromEntries(formData.entries());
  const validated = productSchema.parse({
    ...data,
    slug: data.slug || slugify(String(data.name)),
    isFeatured: data.isFeatured === "on",
    isPublic: data.isPublic === "on" || data.isPublic === undefined,
    showPrice: data.showPrice === "on",
  });

  await prisma.product.update({
    where: { id },
    data: {
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
      price: validated.price.toString(),
      discountedPrice: validated.discountedPrice ? String(validated.discountedPrice) : null,
      sku: validated.sku || null,
      dimensions: validated.dimensions || null,
      materials: validated.materials || null,
      color: validated.color || null,
      availability: validated.availability || null,
      status: validated.status,
      isFeatured: validated.isFeatured,
      isPublic: validated.isPublic,
      showPrice: validated.showPrice,
      categoryId: validated.categoryId || null,
    },
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await requirePermissionServer("products:delete");
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function getProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
}) {
  await requirePermissionServer("products:view");
  const { page = 1, limit = 20, search = "", status = "", categoryId = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status }),
    ...(categoryId && { categoryId }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { category: true, images: { take: 1 } },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
}
