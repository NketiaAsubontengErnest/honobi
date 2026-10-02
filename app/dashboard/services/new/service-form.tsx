"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createService, updateService } from "@/actions/services";

export type ServiceFormInitial = {
  id: string;
  name: string;
  categoryId: string;
  order: number;
  image: string;
  icon: string;
  description: string;
  isFeatured: boolean;
  isPublic: boolean;
};

export function ServiceForm({
  categories,
  initial,
}: {
  categories: { value: string; label: string }[];
  initial?: ServiceFormInitial;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const payload = {
        name: String(formData.get("name") || ""),
        description: String(formData.get("description") || "") || undefined,
        image: String(formData.get("image") || "") || undefined,
        icon: String(formData.get("icon") || "") || undefined,
        categoryId: String(formData.get("categoryId") || "") || undefined,
        order: formData.get("order") ? Number(formData.get("order")) : undefined,
        isFeatured: formData.get("isFeatured") === "on",
        isPublic: formData.get("isPublic") === "on",
      };
      if (initial) await updateService(initial.id, payload);
      else await createService(payload);
      router.push("/dashboard/services");
      router.refresh();
    } catch {
      setError("Failed to save the service. Please check your input and try again.");
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{initial ? "Edit Service" : "Add New Service"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input id="name" name="name" defaultValue={initial?.name} required placeholder="e.g. Custom Furniture Design" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select id="categoryId" name="categoryId" defaultValue={initial?.categoryId} options={categories} placeholder="Uncategorized" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input id="order" name="order" type="number" min="0" defaultValue={initial?.order ?? 0} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" name="image" defaultValue={initial?.image} placeholder="https://..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="icon">Icon Name</Label>
                <Input id="icon" name="icon" defaultValue={initial?.icon} placeholder="Optional icon identifier" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={initial?.description} placeholder="Describe this service" />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isFeatured" className="h-4 w-4" defaultChecked={initial?.isFeatured} /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isPublic" className="h-4 w-4" defaultChecked={initial ? initial.isPublic : true} /> Public
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Service"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
