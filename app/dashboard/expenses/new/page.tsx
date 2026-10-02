import { getSuppliers } from "@/actions/suppliers";
import { ExpenseForm } from "./expense-form";

export default async function NewExpensePage() {
  const { suppliers } = await getSuppliers({ page: 1, limit: 500 });

  return (
    <ExpenseForm
      suppliers={suppliers.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name }))}
    />
  );
}
