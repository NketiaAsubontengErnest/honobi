"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  quantity: number;
  minStock: number;
  costPerUnit: number;
  location: string | null;
  category: string | null;
  supplier: string | null;
};

export function InventoryClient({ items }: { items: InventoryItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (item) => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "name", label: "Item" },
    { key: "sku", label: "SKU", render: (item: InventoryItem) => item.sku ?? "—" },
    { key: "category", label: "Category", render: (item: InventoryItem) => item.category ?? "—" },
    {
      key: "quantity",
      label: "Stock",
      render: (item: InventoryItem) => (
        <span className={item.quantity <= item.minStock ? "text-red-600 font-bold" : ""}>
          {item.quantity} {item.unit}
          {item.quantity <= item.minStock && <Badge variant="destructive" className="ml-2">Low</Badge>}
        </span>
      ),
    },
    { key: "costPerUnit", label: "Cost/Unit", render: (item: InventoryItem) => formatCurrency(item.costPerUnit) },
    { key: "supplier", label: "Supplier", render: (item: InventoryItem) => item.supplier ?? "—" },
    { key: "location", label: "Location", render: (item: InventoryItem) => item.location ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button asChild>
          <Link href="/dashboard/inventory/new">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        total={filtered.length}
        page={1}
        limit={50}
        totalPages={1}
        title="Inventory"
        searchPlaceholder="Search inventory..."
        onSearch={setSearch}
      />
    </div>
  );
}
