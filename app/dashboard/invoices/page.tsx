import { getInvoices } from "@/actions/invoices";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = invoices.map((inv: any) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerId: inv.customerId,
    jobId: inv.jobId ?? null,
    customerName: inv.customer?.name ?? "—",
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    balance: Number(inv.balance),
    status: inv.status,
    dueDate: inv.dueDate?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
  }));
  return <InvoicesClient invoices={serialized} />;
}
