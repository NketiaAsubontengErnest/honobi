import { requireAuth } from "@/lib/auth/session";
import { getExpenses } from "@/actions/expenses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; category?: string }> }) {
  await requireAuth();
  const params = await searchParams;
  const { expenses, total, page, limit, totalPages, totalAmount } = await getExpenses({ page: Number(params.page) || 1, limit: 20, search: params.search || "", category: params.category || "" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalAmount)} across {total} records</p>
        </div>
        <Link href="/dashboard/expenses/new"><Button className="gap-2">+ Add Expense</Button></Link>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">Number</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Supplier</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">Method</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{e.expenseNumber}</td>
                <td className="p-3">{formatDate(e.date)}</td>
                <td className="p-3"><Badge variant="secondary">{e.category.replace("_", " ")}</Badge></td>
                <td className="p-3">{e.description || "-"}</td>
                <td className="p-3">{e.supplier?.name || "-"}</td>
                <td className="p-3 text-right font-medium">{formatCurrency(Number(e.amount))}</td>
                <td className="p-3 text-xs">{e.paymentMethod.replace("_", " ")}</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No expenses recorded</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/dashboard/expenses?page=${page - 1}`}><Button variant="outline" size="sm">Previous</Button></Link>}
            {page < totalPages && <Link href={`/dashboard/expenses?page=${page + 1}`}><Button variant="outline" size="sm">Next</Button></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
