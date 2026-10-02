"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  status: string;
  sku: string | null;
  isFeatured: boolean;
  category: { name: string } | null;
  images: { url: string }[];
}

export function ProductsClient({ products, total, page, limit, totalPages }: {
  products: Product[]; total: number; page: number; limit: number; totalPages: number;
}) {
  const router = useRouter();

  const statusVariant = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "success";
      case "OUT_OF_STOCK": return "destructive";
      case "MADE_TO_ORDER": return "warning";
      case "DISCONTINUED": return "secondary";
      default: return "default";
    }
  };

  const columns = [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU", render: (p: Product) => p.sku || "-" },
    { key: "category", label: "Category", render: (p: Product) => p.category?.name || "-" },
    { key: "price", label: "Price", render: (p: Product) => formatCurrency(Number(p.price)) },
    { key: "status", label: "Status", render: (p: Product) => <Badge variant={statusVariant(p.status) as never}>{p.status.replace("_", " ")}</Badge> },
    { key: "isFeatured", label: "Featured", render: (p: Product) => p.isFeatured ? <Badge>Yes</Badge> : "-" },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      total={total}
      page={page}
      limit={limit}
      totalPages={totalPages}
      title="Products"
      createHref="/dashboard/products/new"
      searchPlaceholder="Search products..."
      onSearch={(value) => router.push(`/dashboard/products?search=${encodeURIComponent(value)}`)}
      onPageChange={(p) => router.push(`/dashboard/products?page=${p}`)}
      editHref={(p) => `/dashboard/products/${p.id}/edit`}
    />
  );
}
