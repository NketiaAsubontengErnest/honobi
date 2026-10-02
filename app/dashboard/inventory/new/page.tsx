import { getSuppliers } from "@/actions/suppliers";
import { InventoryItemForm } from "./inventory-item-form";

export default async function NewInventoryItemPage() {
  const { suppliers } = await getSuppliers({ page: 1, limit: 500 });

  return (
    <InventoryItemForm
      suppliers={suppliers.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name }))}
    />
  );
}
