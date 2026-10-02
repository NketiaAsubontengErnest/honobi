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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInventoryItem } from "@/actions/inventory";

const UNITS = ["PIECES", "SHEETS", "METERS", "LITRES", "KILOGRAMS", "BOXES", "SETS"].map((u) => ({
  value: u,
  label: u.replace(/_/g, " "),
}));

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Item"}</Button>;
}

export function InventoryItemForm({ suppliers }: { suppliers: { value: string; label: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createInventoryItem(formData);
      toast.success("Inventory item added");
      router.push("/dashboard/inventory");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to save the inventory item. Please check your input and try again."));
      setError("Failed to save the inventory item. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Inventory Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input id="name" name="name" required placeholder="e.g. 1x2 Mahogany Timber" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" placeholder="Optional stock code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select id="unit" name="unit" options={UNITS} placeholder="Select unit" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input id="quantity" name="quantity" type="number" min="0" step="0.01" required defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock *</Label>
                <Input id="minStock" name="minStock" type="number" min="0" step="0.01" required defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Cost Per Unit (GHS) *</Label>
                <Input id="costPerUnit" name="costPerUnit" type="number" min="0" step="0.01" required defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <Select id="supplierId" name="supplierId" options={suppliers} placeholder="No supplier" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input id="location" name="location" placeholder="e.g. Main Warehouse, Shelf A" />
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
