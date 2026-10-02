import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true, isPublic: true },
    include: { category: true, images: true },
  });

  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {product.images[0] ? (
              <img src={product.images[0].url} alt={product.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
            )}
          </div>
        </div>
        <div>
          <Badge variant="outline">{product.category?.name ?? "General"}</Badge>
          <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
          {product.showPrice && (
            <>
              <p className="text-2xl font-bold text-primary mt-4">
                {formatCurrency(Number(product.discountedPrice ?? product.price))}
              </p>
              {product.discountedPrice && (
                <p className="text-lg text-muted-foreground line-through">{formatCurrency(Number(product.price))}</p>
              )}
            </>
          )}
          <p className="text-muted-foreground mt-4">{product.description}</p>

          <div className="mt-6 space-y-2 text-sm">
            {product.dimensions && <p><strong>Dimensions:</strong> {product.dimensions}</p>}
            {product.materials && <p><strong>Materials:</strong> {product.materials}</p>}
            {product.color && <p><strong>Color:</strong> {product.color}</p>}
            {product.availability && <p><strong>Availability:</strong> {product.availability}</p>}
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href={`/quote?product=${product.slug}`}
              className="px-6 py-3 bg-primary text-white rounded-md hover:opacity-90 font-medium"
            >
              Request Quote
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 border rounded-md hover:bg-muted font-medium"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {product.images.length > 1 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.images.slice(1).map((img: typeof product.images[0]) => (
              <div key={img.id} className="aspect-square bg-muted rounded overflow-hidden">
                <img src={img.url} alt={img.altText ?? product.name} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
