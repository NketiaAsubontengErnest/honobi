import { requireAuth } from "@/lib/auth/session";
import { getIncomeRecords } from "@/actions/income";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function IncomePage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; category?: string }> }) {
  await requireAuth();
  const params = await searchParams;
  const { records, total, page, limit, totalPages, totalAmount } = await getIncomeRecords({ page: Number(params.page) || 1, limit: 20, search: params.search || "", category: params.category || "" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income</h1>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalAmount)} across {total} records</p>
        </div>
        <Link href="/dashboard/income/new"><Button className="gap-2">+ Record Income</Button></Link>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">Number</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">Method</th>
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {records.map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{r.incomeNumber}</td>
                <td className="p-3">{formatDate(r.date)}</td>
                <td className="p-3"><Badge variant="success">{r.category.replace("_", " ")}</Badge></td>
                <td className="p-3">{r.description || "-"}</td>
                <td className="p-3">{r.customer?.name || "-"}</td>
                <td className="p-3 text-right font-medium text-green-700">{formatCurrency(Number(r.amount))}</td>
                <td className="p-3 text-xs">{r.paymentMethod.replace("_", " ")}</td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No income records</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/dashboard/income?page=${page - 1}`}><Button variant="outline" size="sm">Previous</Button></Link>}
            {page < totalPages && <Link href={`/dashboard/income?page=${page + 1}`}><Button variant="outline" size="sm">Next</Button></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
