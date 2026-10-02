import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  await requireAuth();

  // Fetch real data from database
  const [
    customerCount,
    activeJobs,
    completedProjects,
    incomeResult,
    expenseResult,
    productCount,
    lowStockItems,
    recentQuotes,
    recentJobs,
    outstandingInvoices,
  ] = await Promise.all([
    prisma.customer.count({ where: { isActive: true } }),
    prisma.job.count({ where: { status: { in: ["PENDING", "APPROVED", "IN_PROGRESS"] }, isActive: true } }),
    prisma.project.count({ where: { status: "COMPLETED", isActive: true } }),
    prisma.income.aggregate({ _sum: { amount: true }, where: { isActive: true } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.inventoryItem.findMany({
      where: { isActive: true, quantity: { lte: prisma.inventoryItem.fields.minStock } },
      take: 5,
    }),
    prisma.quote.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { customer: true } }),
    prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { customer: true } }),
    prisma.invoice.findMany({ where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] }, isActive: true }, include: { customer: true } }),
  ]);

  const totalIncome = Number(incomeResult._sum.amount || 0);
  const totalExpenses = Number(expenseResult._sum.amount || 0);
  const netProfit = totalIncome - totalExpenses;
  const outstandingTotal = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);

  const stats = [
    { title: "Total Customers", value: customerCount.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/dashboard/customers" },
    { title: "Active Jobs", value: activeJobs.toString(), icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50", href: "/dashboard/jobs" },
    { title: "Completed Projects", value: completedProjects.toString(), icon: Package, color: "text-green-600", bg: "bg-green-50", href: "/dashboard/projects" },
    { title: "Total Products", value: productCount.toString(), icon: FileText, color: "text-purple-600", bg: "bg-purple-50", href: "/dashboard/products" },
    { title: "Total Income", value: formatCurrency(totalIncome), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", href: "/dashboard/income" },
    { title: "Total Expenses", value: formatCurrency(totalExpenses), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50", href: "/dashboard/expenses" },
    { title: "Net Profit", value: formatCurrency(netProfit), icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50", href: "/dashboard/finance" },
    { title: "Outstanding", value: formatCurrency(outstandingTotal), icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", href: "/dashboard/invoices" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to HONOBI WOOD JOINERY management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold truncate" title={stat.value}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg} shrink-0`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{quote.customerName || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{quote.quoteNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {quote.totalAmount ? formatCurrency(Number(quote.totalAmount)) : "Pending"}
                    </p>
                    <p className="text-xs text-muted-foreground">{quote.status}</p>
                  </div>
                </div>
              ))}
              {recentQuotes.length === 0 && (
                <p className="text-sm text-muted-foreground">No quotations yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{job.status.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{job.jobNumber}</p>
                  </div>
                </div>
              ))}
              {recentJobs.length === 0 && (
                <p className="text-sm text-muted-foreground">No jobs yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-orange-700">Stock: {String(item.quantity)} / Min: {String(item.minStock)}</span>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-sm text-muted-foreground">All inventory levels are healthy</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
