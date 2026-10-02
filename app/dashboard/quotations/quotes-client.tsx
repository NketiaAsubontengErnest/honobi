"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteQuote } from "@/actions/quotations";
import { Plus, Trash2, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

type Quote = {
  id: string;
  quoteNumber: string;
  customerName: string | null;
  projectType: string | null;
  status: string;
  totalAmount: number | null;
  customer: { name: string } | null;
  itemCount: number;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  CONVERTED: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-100 text-gray-800",
};

export function QuotesClient({ quotes }: { quotes: Quote[] }) {
  const [data, setData] = useState(quotes);
  const [search, setSearch] = useState("");

  const filtered = data.filter(
    (q) => !search || q.quoteNumber.toLowerCase().includes(search.toLowerCase()) || q.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quote?")) return;
    await deleteQuote(id);
    setData((prev) => prev.filter((q) => q.id !== id));
  };

  const columns = [
    { key: "quoteNumber", label: "Quote #" },
    { key: "customerName", label: "Customer", render: (item: Quote) => item.customer?.name ?? item.customerName ?? "—" },
    { key: "projectType", label: "Type", render: (item: Quote) => item.projectType ?? "—" },
    { key: "totalAmount", label: "Amount", render: (item: Quote) => item.totalAmount ? formatCurrency(item.totalAmount) : "—" },
    {
      key: "status",
      label: "Status",
      render: (item: Quote) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status] || ""}`}>
          {item.status}
        </span>
      ),
    },
    { key: "createdAt", label: "Date", render: (item: Quote) => formatDate(item.createdAt) },
    {
      key: "actions",
      label: "",
      render: (item: Quote) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quotations</h1>
        <Button asChild>
          <Link href="/dashboard/quotations/new">
            <Plus className="h-4 w-4 mr-2" /> New Quote
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        total={filtered.length}
        page={1}
        limit={50}
        totalPages={1}
        title="Quotations"
        searchPlaceholder="Search quotes..."
        onSearch={setSearch}
      />
    </div>
  );
}
