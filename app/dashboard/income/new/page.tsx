import { getCustomers } from "@/actions/customers";
import { IncomeForm } from "./income-form";

export default async function NewIncomePage() {
  const { customers } = await getCustomers({ page: 1, limit: 500 });

  return (
    <IncomeForm
      customers={customers.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
    />
  );
}
