import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProductEditForm } from "./product-edit-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id, isActive: true } });

  if (!product) notFound();

  return (
    <ProductEditForm
      productId={product.id}
      initialData={{
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        price: String(product.price),
        discountedPrice: product.discountedPrice ? String(product.discountedPrice) : "",
        sku: product.sku ?? "",
        dimensions: product.dimensions ?? "",
        materials: product.materials ?? "",
        color: product.color ?? "",
        availability: product.availability ?? "",
        status: product.status,
        isFeatured: product.isFeatured,
        isPublic: product.isPublic,
        showPrice: product.showPrice,
      }}
    />
  );
}
