"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProduct } from "@/actions/products";

const STATUSES = ["AVAILABLE", "OUT_OF_STOCK", "MADE_TO_ORDER", "DISCONTINUED"].map((s) => ({
  value: s,
  label: s.replace(/_/g, " "),
}));

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Product"}</Button>;
}

export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createProduct(formData);
      router.push("/dashboard/products");
      router.refresh();
    } catch {
      setError("Failed to save the product. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" required placeholder="e.g. 3-Seater Sofa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (GHS) *</Label>
                <Input id="price" name="price" type="number" min="0" step="0.01" required placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted Price</Label>
                <Input id="discountedPrice" name="discountedPrice" type="number" min="0" step="0.01" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select id="status" name="status" options={STATUSES} defaultValue="AVAILABLE" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" placeholder="Optional stock code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input id="dimensions" name="dimensions" placeholder="e.g. 200cm x 80cm x 90cm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" placeholder="e.g. Walnut Brown" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="materials">Materials</Label>
                <Input id="materials" name="materials" placeholder="e.g. Mahogany wood, foam, fabric" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="availability">Availability</Label>
                <Input id="availability" name="availability" placeholder="e.g. In stock, made to order" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Product description" />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="isFeatured" value="false" readOnly />
                  <input type="checkbox" name="isFeatured" value="on" className="h-4 w-4" /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="isPublic" value="false" readOnly />
                  <input type="checkbox" name="isPublic" value="on" className="h-4 w-4" defaultChecked /> Public
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="showPrice" value="false" readOnly />
                  <input type="checkbox" name="showPrice" value="on" className="h-4 w-4" /> Show price on public site
                </label>
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
