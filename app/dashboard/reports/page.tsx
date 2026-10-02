import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const [
    totalIncome,
    totalExpenses,
    customerCount,
    jobCount,
    productCount,
    pendingQuotes,
    activeJobs,
    invoiceStats,
  ] = await Promise.all([
    prisma.income.aggregate({ where: { isActive: true }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { isActive: true }, _sum: { amount: true } }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.job.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.quote.count({ where: { status: "PENDING", isValid: true } }),
    prisma.job.count({ where: { status: "IN_PROGRESS", isActive: true } }),
    prisma.invoice.groupBy({ by: ["status"], _count: true, where: { isActive: true } }),
  ]);

  const income = Number(totalIncome._sum.amount ?? 0);
  const expenses = Number(totalExpenses._sum.amount ?? 0);
  const profit = income - expenses;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(profit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {income > 0 ? ((profit / income) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Business Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Customers</span><span className="font-medium">{customerCount}</span></div>
            <div className="flex justify-between"><span>Products</span><span className="font-medium">{productCount}</span></div>
            <div className="flex justify-between"><span>Total Jobs</span><span className="font-medium">{jobCount}</span></div>
            <div className="flex justify-between"><span>Active Jobs</span><span className="font-medium">{activeJobs}</span></div>
            <div className="flex justify-between"><span>Pending Quotes</span><span className="font-medium">{pendingQuotes}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Invoice Status</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invoiceStats.map((s: { status: string; _count: number }) => (
              <div key={s.status} className="flex justify-between">
                <span>{s.status.replace(/_/g, " ")}</span>
                <span className="font-medium">{s._count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Export</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Download reports as CSV/PDF</p>
            <button className="w-full mt-2 px-4 py-2 bg-primary text-white rounded hover:opacity-90 text-sm">
              Export Financial Report
            </button>
            <button className="w-full px-4 py-2 border rounded hover:bg-muted text-sm">
              Export Jobs Report
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
