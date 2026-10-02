import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerById } from "@/actions/customers";
import { formatCurrency, formatDate } from "@/lib/utils";

function money(value: unknown) {
  const num = Number(value ?? 0);
  return formatCurrency(Number.isFinite(num) ? num : 0);
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            Customer since {formatDate(customer.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/customers/${customer.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/customers">Back to List</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Phone:</span> {customer.phone}</p>
            {customer.altPhone && <p><span className="text-muted-foreground">Alt. Phone:</span> {customer.altPhone}</p>}
            <p><span className="text-muted-foreground">Email:</span> {customer.email || "-"}</p>
            <p><span className="text-muted-foreground">Address:</span> {customer.address || "-"}</p>
            <p><span className="text-muted-foreground">City / Region:</span> {[customer.city, customer.region].filter(Boolean).join(", ") || "-"}</p>
            {customer.notes && <p><span className="text-muted-foreground">Notes:</span> {customer.notes}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Quotes</span><Badge variant="secondary">{customer.quotes.length}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Jobs</span><Badge variant="secondary">{customer.jobs.length}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Invoices</span><Badge variant="secondary">{customer.invoices.length}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payments</span><Badge variant="secondary">{customer.payments.length}</Badge></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="divide-y">
              {customer.jobs.map((job: { id: string; jobNumber: string; title: string; status: string; estimatedCost: unknown; createdAt: Date }) => (
                <div key={job.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-muted-foreground">{job.jobNumber} · {formatDate(job.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{money(job.estimatedCost)}</span>
                    <Badge variant="outline">{job.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="divide-y">
              {customer.invoices.map((invoice: { id: string; invoiceNumber: string; status: string; total: unknown; balance: unknown; createdAt: Date }) => (
                <div key={invoice.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-muted-foreground">{formatDate(invoice.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{money(invoice.total)}</span>
                    <Badge variant={invoice.status === "PAID" ? "default" : "outline"}>{invoice.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="divide-y">
              {customer.payments.map((payment: { id: string; reference: string; amount: unknown; paymentMethod: string; paymentDate: Date }) => (
                <div key={payment.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{payment.reference}</p>
                    <p className="text-muted-foreground">{formatDate(payment.paymentDate)} · {payment.paymentMethod.replace(/_/g, " ")}</p>
                  </div>
                  <span>{money(payment.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
