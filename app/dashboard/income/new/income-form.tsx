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
import { createIncome } from "@/actions/income";

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
  "FURNITURE_SALES",
  "CARPENTRY_SERVICES",
  "INSTALLATION",
  "REPAIRS",
  "DELIVERY",
  "CUSTOM_ORDERS",
  "OTHER",
].map((c) => ({ value: c, label: c.replace(/_/g, " ") }));

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Income"}</Button>;
}

export function IncomeForm({ customers }: { customers: { value: string; label: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createIncome(formData);
      toast.success("Income recorded");
      router.push("/dashboard/income");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to save the income record. Please check your input and try again."));
      setError("Failed to save the income record. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Record Income</CardTitle>
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
                <Label htmlFor="customerId">Customer</Label>
                <Select id="customerId" name="customerId" options={customers} placeholder="No customer" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" placeholder="Receipt / transaction reference" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="What was this income for?" />
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
