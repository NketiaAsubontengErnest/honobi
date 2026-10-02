"use client";

import { toast } from "sonner";
import { flashError } from "@/lib/utils/flash";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createExpense } from "@/actions/expenses";

const PAYMENT_METHODS = [
  "CASH",
  "MOBILE_MONEY",
  "MTN_MOMO",
  "TELECEL_CASH",
  "AIRTELTIGO_MONEY",
  "BANK_TRANSFER",
  "CARD",
  "OTHER",
].map((p) => ({ value: p, label: p.replace(/_/g, " ") }));

const CATEGORIES = [
  "WOOD",
  "PLYWOOD",
  "MDF",
  "NAILS",
  "SCREWS",
  "GLUE",
  "PAINT",
  "VARNISH",
  "SANDPAPER",
  "HARDWARE",
  "ELECTRICITY",
  "WATER",
  "RENT",
  "TRANSPORT",
  "FUEL",
  "SALARIES",
  "TOOLS",
  "MACHINE_MAINTENANCE",
  "REPAIRS",
  "MARKETING",
  "INTERNET",
  "PACKAGING",
  "DELIVERY",
  "OTHER",
].map((c) => ({ value: c, label: c.replace(/_/g, " ") }));

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Expense"}</Button>;
}

export function ExpenseForm({ suppliers }: { suppliers: { value: string; label: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createExpense(formData);
      toast.success("Expense recorded");
      router.push("/dashboard/expenses");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to save the expense. Please check your input and try again."));
      setError("Failed to save the expense. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (GHS) *</Label>
                <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select id="category" name="category" options={CATEGORIES} placeholder="Select category" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select id="paymentMethod" name="paymentMethod" options={PAYMENT_METHODS} placeholder="Select method" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <Select id="supplierId" name="supplierId" options={suppliers} placeholder="No supplier" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" placeholder="Receipt / invoice reference" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="What was this expense for?" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-4">
              <SubmitButton />
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
