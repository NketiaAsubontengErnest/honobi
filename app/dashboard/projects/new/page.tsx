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
import { createProject } from "@/actions/projects";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

const STATUSES = ["PLANNING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => ({
  value: s,
  label: s.replace(/_/g, " "),
}));

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Project"}</Button>;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createProject(formData);
      toast.success("Project created");
      router.push("/dashboard/projects");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to save the project. Please check your input and try again."));
      setError("Failed to save the project. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" required placeholder="e.g. Office Fit-out - Airport City" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select id="status" name="status" options={STATUSES} defaultValue="PLANNING" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Client Name</Label>
                <Input id="customerName" name="customerName" placeholder="Client name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Project location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (GHS)</Label>
                <Input id="budget" name="budget" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completionDate">Completion Date</Label>
                <Input id="completionDate" name="completionDate" type="date" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Cover Image</Label>
                <ImageUploadField name="coverImage" target="project" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="materialsUsed">Materials Used</Label>
                <Input id="materialsUsed" name="materialsUsed" placeholder="e.g. Mahogany, plywood, glass" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="servicesPerformed">Services Performed</Label>
                <Input id="servicesPerformed" name="servicesPerformed" placeholder="e.g. Design, fabrication, installation" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Project description" />
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
