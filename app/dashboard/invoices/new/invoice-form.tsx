"use client";

import { toast } from "sonner";
import { flashError } from "@/lib/utils/flash";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoice, updateInvoice } from "@/actions/invoices";

type LineItem = { name: string; quantity: string; unitPrice: string };

const emptyItem: LineItem = { name: "", quantity: "1", unitPrice: "0" };

export type InvoiceEditData = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  status: string;
  dueDate: string; // yyyy-mm-dd or ""
  notes: string;
  discount: number;
  taxRate: number;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
};

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function InvoiceForm({ customers, invoice }: { customers: { value: string; label: string }[]; invoice?: InvoiceEditData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<LineItem[]>(
    invoice && invoice.items.length > 0
      ? invoice.items.map((item) => ({ name: item.name, quantity: String(item.quantity), unitPrice: String(item.unitPrice) }))
      : [{ ...emptyItem }]
  );

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );
    return { subtotal };
  }, [items]);

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    const cleanItems = items
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      }));

    if (cleanItems.length === 0) {
      setError("Add at least one line item with a name.");
      return;
    }

    setPending(true);
    try {
      const payload = {
        customerId: String(formData.get("customerId") || ""),
        items: cleanItems,
        discount: formData.get("discount") ? Number(formData.get("discount")) : undefined,
        taxRate: formData.get("taxRate") ? Number(formData.get("taxRate")) : undefined,
        dueDate: formData.get("dueDate") ? new Date(String(formData.get("dueDate"))) : undefined,
        notes: String(formData.get("notes") || "") || undefined,
      };
      if (invoice) {
        const status = String(formData.get("status") || "") || undefined;
        await updateInvoice(invoice.id, { ...payload, status, notes: payload.notes ?? "" });
        toast.success("Invoice updated");
        router.push(`/dashboard/invoices/${invoice.id}`);
      } else {
        const created = await createInvoice(payload);
        toast.success("Invoice created");
        // Go straight to the letterhead view and open the print preview
        router.push(`/dashboard/invoices/${created.id}?print=1`);
      }
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to save the invoice. Please check your input and try again."));
      setError("Failed to save the invoice. Please check your input and try again.");
      setPending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{invoice ? `Edit Invoice ${invoice.invoiceNumber}` : "New Invoice"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select id="customerId" name="customerId" options={customers} placeholder="Select customer" required defaultValue={invoice?.customerId} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" defaultValue={invoice?.dueDate} />
              </div>
            </div>

            {invoice && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" options={statusOptions} defaultValue={invoice.status} />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    className="flex-1"
                    placeholder="Item description"
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                  />
                  <Input
                    type="number"
                    min="1"
                    className="w-24"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-32"
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (GHS)</Label>
                <Input id="discount" name="discount" type="number" min="0" step="0.01" defaultValue={invoice?.discount ?? 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" name="taxRate" type="number" min="0" max="100" step="0.01" defaultValue={invoice?.taxRate ?? 0} />
              </div>
              <div className="space-y-2 flex flex-col justify-end pb-1">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold">GHS {totals.subtotal.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Payment terms, thank-you note, etc." defaultValue={invoice?.notes} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={pending}>{pending ? "Saving..." : invoice ? "Save Changes" : "Save Invoice"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
