"use client";

import { toast } from "sonner";
import { flashError } from "@/lib/utils/flash";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProduct } from "@/actions/products";

const STATUSES = ["AVAILABLE", "OUT_OF_STOCK", "MADE_TO_ORDER", "DISCONTINUED"].map((s) => ({
  value: s,
  label: s.replace(/_/g, " "),
}));

type ProductInitialData = {
  name: string;
  slug: string;
  description: string;
  price: string;
  discountedPrice: string;
  sku: string;
  dimensions: string;
  materials: string;
  color: string;
  availability: string;
  status: string;
  isFeatured: boolean;
  isPublic: boolean;
  showPrice: boolean;
};

export function ProductEditForm({
  productId,
  initialData,
}: {
  productId: string;
  initialData: ProductInitialData;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      await updateProduct(productId, formData);
      toast.success("Product updated");
      router.push("/dashboard/products");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to update the product. Please check your input and try again."));
      setError("Failed to update the product. Please check your input and try again.");
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="slug" value={initialData.slug} readOnly />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" required defaultValue={initialData.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (GHS) *</Label>
                <Input id="price" name="price" type="number" min="0" step="0.01" required defaultValue={initialData.price} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted Price</Label>
                <Input id="discountedPrice" name="discountedPrice" type="number" min="0" step="0.01" defaultValue={initialData.discountedPrice} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select id="status" name="status" options={STATUSES} defaultValue={initialData.status} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" defaultValue={initialData.sku} placeholder="Optional stock code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input id="dimensions" name="dimensions" defaultValue={initialData.dimensions} placeholder="e.g. 200cm x 80cm x 90cm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" defaultValue={initialData.color} placeholder="e.g. Walnut Brown" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="materials">Materials</Label>
                <Input id="materials" name="materials" defaultValue={initialData.materials} placeholder="e.g. Mahogany wood, foam, fabric" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="availability">Availability</Label>
                <Input id="availability" name="availability" defaultValue={initialData.availability} placeholder="e.g. In stock, made to order" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={initialData.description} placeholder="Product description" />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="isFeatured" value="false" readOnly />
                  <input type="checkbox" name="isFeatured" value="on" className="h-4 w-4" defaultChecked={initialData.isFeatured} /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="isPublic" value="false" readOnly />
                  <input type="checkbox" name="isPublic" value="on" className="h-4 w-4" defaultChecked={initialData.isPublic} /> Public
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="showPrice" value="false" readOnly />
                  <input type="checkbox" name="showPrice" value="on" className="h-4 w-4" defaultChecked={initialData.showPrice} /> Show price on public site
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Changes"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
