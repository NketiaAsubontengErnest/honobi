"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestQuote } from "@/actions/quotations";

export default function QuotePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await requestQuote({
        customerName: formData.get("customerName") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        location: formData.get("location") as string,
        projectType: formData.get("projectType") as string,
        description: formData.get("description") as string,
        estimatedBudget: parseFloat(formData.get("estimatedBudget") as string) || undefined,
        additionalNotes: formData.get("additionalNotes") as string,
      });
      if (res.success) setSuccess(true);
      else setError(res.error);
    } catch {
      setError("Could not submit your request. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Quote Request Received!</h1>
        <p className="text-muted-foreground">
          Thank you for your interest. We will review your request and get back to you within 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Request a Quote</h1>
        <p className="text-muted-foreground">
          Tell us about your project and we&apos;ll provide a detailed quote.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input id="customerName" name="customerName" required placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" required placeholder="024 XXX XXXX" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@email.com" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="City/Area" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectType">Project Type</Label>
                <Input id="projectType" name="projectType" placeholder="e.g. Wardrobe, Kitchen Cabinet" />
              </div>
              <div>
                <Label htmlFor="estimatedBudget">Estimated Budget (GHS)</Label>
                <Input id="estimatedBudget" name="estimatedBudget" type="number" placeholder="5000" />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Project Description *</Label>
              <Textarea id="description" name="description" required placeholder="Describe what you need..." rows={4} />
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea id="additionalNotes" name="additionalNotes" placeholder="Any specific requirements..." rows={3} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Quote Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
