import { getCustomers } from "@/actions/customers";
import { InvoiceForm } from "./invoice-form";

export default async function NewInvoicePage() {
  const { customers } = await getCustomers({ page: 1, limit: 500 });

  return (
    <InvoiceForm
      customers={customers.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
    />
  );
}
