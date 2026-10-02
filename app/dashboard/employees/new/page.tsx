"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEmployee } from "@/actions/employees";

const POSITIONS = [
  "CARPENTER",
  "ASSISTANT_CARPENTER",
  "FINISHING_SPECIALIST",
  "INSTALLER",
  "DRIVER",
  "STOREKEEPER",
  "ACCOUNTANT",
  "MANAGER",
  "ADMINISTRATOR",
].map((p) => ({ value: p, label: p.replace(/_/g, " ") }));

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Employee"}</Button>;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createEmployee({
        name: String(formData.get("name") || ""),
        phone: String(formData.get("phone") || "") || undefined,
        email: String(formData.get("email") || "") || undefined,
        position: String(formData.get("position") || ""),
        salary: formData.get("salary") ? Number(formData.get("salary")) : undefined,
        hireDate: formData.get("hireDate") ? new Date(String(formData.get("hireDate"))) : undefined,
        address: String(formData.get("address") || "") || undefined,
        emergencyContact: String(formData.get("emergencyContact") || "") || undefined,
      });
      router.push("/dashboard/employees");
      router.refresh();
    } catch {
      setError("Failed to save the employee. Please check your input and try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" required placeholder="Enter employee name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select id="position" name="position" options={POSITIONS} placeholder="Select position" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary (GHS)</Label>
                <Input id="salary" name="salary" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="0241234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="employee@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input id="hireDate" name="hireDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input id="emergencyContact" name="emergencyContact" placeholder="Name & phone number" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="Physical address" />
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
