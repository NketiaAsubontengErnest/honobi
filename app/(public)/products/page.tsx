import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function PublicProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isPublic: true },
    include: { category: true, images: { take: 1 } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Products</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Browse our collection of handcrafted furniture and woodwork pieces.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: typeof products[0]) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group">
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                {product.images[0] ? (
                  <img src={product.images[0].url} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.category?.name}</p>
                <h3 className="font-semibold text-lg mt-1">{product.name}</h3>
                {product.showPrice && <p className="text-primary font-bold mt-1">{formatCurrency(Number(product.price))}</p>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
