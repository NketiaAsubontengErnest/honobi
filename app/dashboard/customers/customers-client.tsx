"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "@/actions/customers";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  region: string | null;
  createdAt: string;
  _count: { jobs: number; invoices: number; quotes: number };
}

export function CustomersClient({
  customers,
  total,
  page,
  limit,
  totalPages,
}: {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}) {
  const router = useRouter();

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email", render: (c: Customer) => c.email || "-" },
    { key: "city", label: "City", render: (c: Customer) => c.city || "-" },
    {
      key: "activity",
      label: "Activity",
      render: (c: Customer) => (
        <div className="flex gap-2">
          <Badge variant="secondary">{c._count.jobs} jobs</Badge>
          <Badge variant="outline">{c._count.quotes} quotes</Badge>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to archive this customer?")) {
      await deleteCustomer(id);
      router.refresh();
    }
  };

  return (
    <DataTable
      columns={columns}
      data={customers}
      total={total}
      page={page}
      limit={limit}
      totalPages={totalPages}
      title="Customers"
      createHref="/dashboard/customers/new"
      searchPlaceholder="Search customers..."
      onSearch={(value) => router.push(`/dashboard/customers?search=${encodeURIComponent(value)}`)}
      onPageChange={(p) => router.push(`/dashboard/customers?page=${p}`)}
      viewHref={(c) => `/dashboard/customers/${c.id}`}
      editHref={(c) => `/dashboard/customers/${c.id}/edit`}
      actions={(c) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => handleDelete(c.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    />
  );
}
