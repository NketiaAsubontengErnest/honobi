"use client";

import { toast } from "sonner";
import { flashError } from "@/lib/utils/flash";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuote } from "@/actions/quotations";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Quote"}</Button>;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createQuote({
        customerName: String(formData.get("customerName") || ""),
        phone: String(formData.get("phone") || "") || undefined,
        email: String(formData.get("email") || "") || undefined,
        location: String(formData.get("location") || "") || undefined,
        projectType: String(formData.get("projectType") || "") || undefined,
        description: String(formData.get("description") || "") || undefined,
        estimatedBudget: formData.get("estimatedBudget") ? Number(formData.get("estimatedBudget")) : undefined,
        preferredDate: formData.get("preferredDate") ? new Date(String(formData.get("preferredDate"))) : undefined,
        additionalNotes: String(formData.get("additionalNotes") || "") || undefined,
      });
      toast.success("Quotation created");
      router.push("/dashboard/quotations");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to save the quote. Please check your input and try again."));
      setError("Failed to save the quote. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New Quotation</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input id="customerName" name="customerName" required placeholder="Enter customer name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="0241234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="customer@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Site location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Input id="projectType" name="projectType" placeholder="e.g. Wardrobe, Kitchen Cabinet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedBudget">Estimated Budget (GHS)</Label>
                <Input id="estimatedBudget" name="estimatedBudget" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred Date</Label>
                <Input id="preferredDate" name="preferredDate" type="date" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Describe the project requirements" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea id="additionalNotes" name="additionalNotes" placeholder="Any additional notes" />
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
