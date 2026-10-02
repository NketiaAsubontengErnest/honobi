import { getQuotes } from "@/actions/quotations";
import { QuotesClient } from "./quotes-client";

export default async function QuotesPage() {
  const quotes = await getQuotes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = quotes.map((q: any) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    customerName: q.customerName,
    projectType: q.projectType,
    status: q.status,
    totalAmount: q.totalAmount ? Number(q.totalAmount) : null,
    estimatedBudget: q.estimatedBudget ? Number(q.estimatedBudget) : null,
    customer: q.customer ? { name: q.customer.name } : null,
    itemCount: q.items?.length ?? 0,
    createdAt: q.createdAt.toISOString(),
  }));
  return <QuotesClient quotes={serialized} />;
}
