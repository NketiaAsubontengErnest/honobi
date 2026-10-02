import { notFound } from "next/navigation";
import { getInvoiceById } from "@/actions/invoices";
import { getCustomers } from "@/actions/customers";
import { InvoiceForm } from "../../new/invoice-form";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice || !invoice.isActive) notFound();

  const { customers } = await getCustomers({ page: 1, limit: 500 });

  return (
    <InvoiceForm
      customers={customers.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
      invoice={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        status: invoice.status,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : "",
        notes: invoice.notes ?? "",
        discount: Number(invoice.discount),
        taxRate: Number(invoice.taxRate),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (invoice.items as any[]).map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      }}
    />
  );
}
