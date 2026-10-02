import { getEmployees } from "@/actions/employees";
import { EmployeesClient } from "./employees-client";

export default async function EmployeesPage() {
  const employees = await getEmployees();
  const serialized = employees.map((emp: typeof employees[0]) => ({
    id: emp.id,
    employeeId: emp.employeeId,
    name: emp.name,
    phone: emp.phone,
    email: emp.email,
    position: emp.position,
    salary: emp.salary ? Number(emp.salary) : null,
    status: emp.status,
    hireDate: emp.hireDate?.toISOString() ?? null,
  }));
  return <EmployeesClient employees={serialized} />;
}
