"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";

type Payment = {
  id: string;
  reference: string;
  customerName: string;
  invoiceNumber: string | null;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string | null;
};

export function PaymentsClient({ payments }: { payments: Payment[] }) {
  const [search, setSearch] = useState("");

  const columns = [
    { key: "reference", label: "Reference" },
    { key: "customerName", label: "Customer" },
    { key: "invoiceNumber", label: "Invoice", render: (item: Payment) => item.invoiceNumber ?? "—" },
    { key: "amount", label: "Amount", render: (item: Payment) => formatCurrency(item.amount) },
    { key: "paymentMethod", label: "Method" },
    { key: "paymentDate", label: "Date", render: (item: Payment) => formatDate(item.paymentDate) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <DataTable
        columns={columns}
        data={payments}
        total={payments.length}
        page={1}
        limit={50}
        totalPages={1}
        title="Payments"
        searchPlaceholder="Search payments..."
        onSearch={setSearch}
      />
    </div>
  );
}
