"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { deleteInvoice, recordPayment } from "@/actions/invoices";
import { Plus, Trash2, Eye, Wallet, Pencil } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  jobId: string | null;
  customerName: string;
  total: number;
  amountPaid: number;
  balance: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "MTN_MOMO", label: "MTN MoMo" },
  { value: "TELECEL_CASH", label: "Telecel Cash" },
  { value: "AIRTELTIGO_MONEY", label: "AirtelTigo Money" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];

export function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const [data, setData] = useState(invoices);
  const [search, setSearch] = useState("");
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = data.filter(
    (inv) => !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || inv.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    await deleteInvoice(id);
    setData((prev) => prev.filter((inv) => inv.id !== id));
  };

  const openPaymentDialog = (inv: Invoice) => {
    setPayFor(inv);
    setAmount(inv.balance > 0 ? inv.balance.toFixed(2) : "");
    setMethod("CASH");
    setNotes("");
    setError(null);
  };

  const handleRecordPayment = async () => {
    if (!payFor) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (amt > payFor.balance + 0.01) {
      setError(`Amount exceeds the outstanding balance of ${formatCurrency(payFor.balance)}.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await recordPayment(payFor.id, {
        amount: amt,
        paymentMethod: method,
        notes: notes || undefined,
        customerId: payFor.customerId,
        jobId: payFor.jobId ?? undefined,
      });
      setData((prev) =>
        prev.map((inv) => {
          if (inv.id !== payFor.id) return inv;
          const newPaid = inv.amountPaid + amt;
          const newBalance = Math.max(0, inv.total - newPaid);
          return {
            ...inv,
            amountPaid: newPaid,
            balance: newBalance,
            status: newBalance <= 0 ? "PAID" : "PARTIALLY_PAID",
          };
        })
      );
      setPayFor(null);
    } catch {
      setError("Failed to record the payment. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "invoiceNumber", label: "Invoice #" },
    { key: "customerName", label: "Customer" },
    { key: "total", label: "Total", render: (item: Invoice) => formatCurrency(item.total) },
    { key: "balance", label: "Balance", render: (item: Invoice) => formatCurrency(item.balance) },
    {
      key: "status",
      label: "Status",
      render: (item: Invoice) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status] || ""}`}>
          {item.status}
        </span>
      ),
    },
    { key: "dueDate", label: "Due Date", render: (item: Invoice) => item.dueDate ? formatDate(item.dueDate) : "—" },
    {
      key: "actions",
      label: "",
      render: (item: Invoice) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" asChild title="View / Print">
            <Link href={`/dashboard/invoices/${item.id}`}>
              <Eye className="h-4 w-4 text-blue-600" />
            </Link>
          </Button>
          <Button size="sm" variant="ghost" asChild title="Edit">
            <Link href={`/dashboard/invoices/${item.id}/edit`}>
              <Pencil className="h-4 w-4 text-amber-600" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title="Record Payment"
            onClick={() => openPaymentDialog(item)}
            disabled={item.status === "PAID" || item.balance <= 0}
          >
            <Wallet className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} title="Delete">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button asChild>
          <Link href="/dashboard/invoices/new">
            <Plus className="h-4 w-4 mr-2" /> New Invoice
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
        title="Invoices"
        searchPlaceholder="Search invoices..."
        onSearch={setSearch}
      />

      {/* Record Payment dialog */}
      {payFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPayFor(null)}>
          <div
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <p className="text-sm text-muted-foreground">
                {payFor.invoiceNumber} · {payFor.customerName} · Balance {formatCurrency(payFor.balance)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (GHS)</Label>
              <Input
                id="pay-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-method">Payment Method</Label>
              <Select
                id="pay-method"
                options={paymentMethods}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-notes">Notes (optional)</Label>
              <Input
                id="pay-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bank reference"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPayFor(null)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} disabled={busy}>
                {busy ? "Saving..." : "Record Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
