"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProject } from "@/actions/projects";

const STATUSES = ["PLANNING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => ({
  value: s,
  label: s.replace(/_/g, " "),
}));

type ProjectInitialData = {
  name: string;
  slug: string;
  description: string;
  customerName: string;
  location: string;
  startDate: string;
  completionDate: string;
  budget: string;
  status: string;
  coverImage: string;
  materialsUsed: string;
  servicesPerformed: string;
  isFeatured: boolean;
  isPublic: boolean;
};

export function ProjectEditForm({
  projectId,
  initialData,
}: {
  projectId: string;
  initialData: ProjectInitialData;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      await updateProject(projectId, formData);
      router.push("/dashboard/projects");
      router.refresh();
    } catch {
      setError("Failed to update the project. Please check your input and try again.");
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="slug" value={initialData.slug} readOnly />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" required defaultValue={initialData.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select id="status" name="status" options={STATUSES} defaultValue={initialData.status} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Client Name</Label>
                <Input id="customerName" name="customerName" defaultValue={initialData.customerName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={initialData.location} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (GHS)</Label>
                <Input id="budget" name="budget" type="number" min="0" step="0.01" defaultValue={initialData.budget} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={initialData.startDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completionDate">Completion Date</Label>
                <Input id="completionDate" name="completionDate" type="date" defaultValue={initialData.completionDate} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input id="coverImage" name="coverImage" defaultValue={initialData.coverImage} placeholder="https://..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="materialsUsed">Materials Used</Label>
                <Input id="materialsUsed" name="materialsUsed" defaultValue={initialData.materialsUsed} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="servicesPerformed">Services Performed</Label>
                <Input id="servicesPerformed" name="servicesPerformed" defaultValue={initialData.servicesPerformed} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={initialData.description} />
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
