"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteEmployee } from "@/actions/employees";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

type Employee = {
  id: string;
  employeeId: string;
  name: string;
  phone: string | null;
  email: string | null;
  position: string;
  salary: number | null;
  status: string;
  hireDate: string | null;
};

export function EmployeesClient({ employees }: { employees: Employee[] }) {
  const [data, setData] = useState(employees);
  const [search, setSearch] = useState("");

  const filtered = data.filter(
    (emp) => !search || emp.name.toLowerCase().includes(search.toLowerCase()) || emp.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this employee?")) return;
    await deleteEmployee(id);
    setData((prev) => prev.filter((e) => e.id !== id));
  };

  const columns = [
    { key: "employeeId", label: "ID" },
    { key: "name", label: "Name" },
    { key: "position", label: "Position" },
    { key: "phone", label: "Phone", render: (item: Employee) => item.phone ?? "—" },
    { key: "salary", label: "Salary", render: (item: Employee) => item.salary ? formatCurrency(item.salary) : "—" },
    { key: "hireDate", label: "Hire Date", render: (item: Employee) => item.hireDate ? formatDate(item.hireDate) : "—" },
    {
      key: "status",
      label: "Status",
      render: (item: Employee) => (
        <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{item.status}</Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (item: Employee) => (
        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button asChild>
          <Link href="/dashboard/employees/new">
            <Plus className="h-4 w-4 mr-2" /> Add Employee
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        total={filtered.length}
        page={1}
        limit={50}
        totalPages={1}
        title="Employees"
        searchPlaceholder="Search employees..."
        onSearch={setSearch}
      />
    </div>
  );
}
