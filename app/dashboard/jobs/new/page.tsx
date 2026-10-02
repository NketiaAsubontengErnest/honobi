import { getCustomers } from "@/actions/customers";
import { getEmployees } from "@/actions/employees";
import { JobForm } from "./job-form";

export default async function NewJobPage() {
  const [{ customers }, employees] = await Promise.all([
    getCustomers({ page: 1, limit: 500 }),
    getEmployees(),
  ]);

  return (
    <JobForm
      customers={customers.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
      employees={employees.map((e: { id: string; name: string }) => ({ value: e.id, label: e.name }))}
    />
  );
}
