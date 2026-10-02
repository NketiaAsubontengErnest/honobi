import { prisma } from "@/lib/db/prisma";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    where: { isActive: true },
    include: { customer: true, invoice: true },
    orderBy: { paymentDate: "desc" },
  });
  const serialized = payments.map((p: typeof payments[0]) => ({
    id: p.id,
    reference: p.reference,
    customerName: p.customer?.name ?? "—",
    invoiceNumber: p.invoice?.invoiceNumber ?? null,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod,
    paymentDate: p.paymentDate.toISOString(),
    notes: p.notes,
  }));
  return <PaymentsClient payments={serialized} />;
}
