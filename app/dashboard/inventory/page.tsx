import { prisma } from "@/lib/db/prisma";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    include: { category: true, supplier: true },
    orderBy: { name: "asc" },
  });
  const serialized = items.map((item: typeof items[0]) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    unit: item.unit,
    quantity: Number(item.quantity),
    minStock: Number(item.minStock),
    costPerUnit: Number(item.costPerUnit),
    location: item.location,
    category: item.category?.name ?? null,
    supplier: item.supplier?.name ?? null,
  }));
  return <InventoryClient items={serialized} />;
}
