import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCustomers } from "@/actions/customers";
import { getEmployees } from "@/actions/employees";
import { JobForm } from "../../new/job-form";

const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || !job.isActive) notFound();

  const [{ customers }, employees] = await Promise.all([
    getCustomers({ page: 1, limit: 500 }),
    getEmployees(),
  ]);

  return (
    <JobForm
      customers={customers.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
      employees={employees.map((e: { id: string; name: string }) => ({ value: e.id, label: e.name }))}
      initial={{
        id: job.id,
        title: job.title,
        customerId: job.customerId,
        assignedTo: job.assignedTo ?? "",
        estimatedCost: job.estimatedCost ? String(job.estimatedCost) : "",
        startDate: toDateInput(job.startDate),
        expectedCompletion: toDateInput(job.expectedCompletion),
        description: job.description ?? "",
        notes: job.notes ?? "",
      }}
    />
  );
}
