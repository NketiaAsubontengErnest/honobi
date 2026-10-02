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
import { createJob, updateJob } from "@/actions/jobs";

export type JobFormInitial = {
  id: string;
  title: string;
  customerId: string;
  assignedTo: string;
  estimatedCost: string;
  startDate: string;
  expectedCompletion: string;
  description: string;
  notes: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Job"}</Button>;
}

export function JobForm({
  customers,
  employees,
  initial,
}: {
  customers: { value: string; label: string }[];
  employees: { value: string; label: string }[];
  initial?: JobFormInitial;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      if (initial) await updateJob(initial.id, formData);
      else await createJob(formData);
      router.push("/dashboard/jobs");
      router.refresh();
    } catch {
      setError("Failed to save the job. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{initial ? "Edit Job" : "New Job"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" name="title" defaultValue={initial?.title} required placeholder="e.g. Kitchen Cabinet Fabrication" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select id="customerId" name="customerId" defaultValue={initial?.customerId} options={customers} placeholder="Select customer" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned Employee</Label>
                <Select id="assignedTo" name="assignedTo" defaultValue={initial?.assignedTo} options={employees} placeholder="Unassigned" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (GHS)</Label>
                <Input id="estimatedCost" name="estimatedCost" defaultValue={initial?.estimatedCost} type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" defaultValue={initial?.startDate} type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedCompletion">Expected Completion</Label>
                <Input id="expectedCompletion" name="expectedCompletion" defaultValue={initial?.expectedCompletion} type="date" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={initial?.description} placeholder="Describe the job scope" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={initial?.notes} placeholder="Internal notes" />
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
