import { requireAuth } from "@/lib/auth/session";
import { getProducts } from "@/actions/products";
import { ProductsClient } from "./products-client";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;

  const { products, total, page, limit, totalPages } = await getProducts({
    page: Number(params.page) || 1,
    limit: 20,
    search: params.search || "",
    status: params.status || "",
  });

  return <ProductsClient products={JSON.parse(JSON.stringify(products))} total={total} page={page} limit={limit} totalPages={totalPages} />;
}
