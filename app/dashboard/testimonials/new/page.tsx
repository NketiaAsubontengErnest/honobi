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
import { createTestimonial } from "@/actions/testimonials";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Testimonial"}</Button>;
}

export default function NewTestimonialPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createTestimonial({
        customerName: String(formData.get("customerName") || ""),
        customerRole: String(formData.get("customerRole") || "") || undefined,
        testimonial: String(formData.get("testimonial") || ""),
        customerImage: String(formData.get("customerImage") || "") || undefined,
        rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
        isFeatured: formData.get("isFeatured") === "on",
        isApproved: formData.get("isApproved") === "on",
      });
      toast.success("Testimonial added");
      router.push("/dashboard/testimonials");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to save the testimonial. Please check your input and try again."));
      setError("Failed to save the testimonial. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Testimonial</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input id="customerName" name="customerName" required placeholder="Enter customer name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerRole">Customer Role</Label>
                <Input id="customerRole" name="customerRole" placeholder="e.g. Homeowner, Architect" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input id="rating" name="rating" type="number" min={1} max={5} defaultValue={5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerImage">Image URL</Label>
                <Input id="customerImage" name="customerImage" placeholder="https://..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="testimonial">Testimonial *</Label>
                <Textarea id="testimonial" name="testimonial" required minLength={10} placeholder="What did the customer say?" />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isFeatured" className="h-4 w-4" /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isApproved" className="h-4 w-4" defaultChecked /> Approved
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
