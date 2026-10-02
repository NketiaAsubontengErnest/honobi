"use client";

import { toast } from "sonner";
import { flashError } from "@/lib/utils/flash";
import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { deleteSupplier } from "@/actions/suppliers";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type Supplier = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  materials: string | null;
};

export function SuppliersClient({ suppliers }: { suppliers: Supplier[] }) {
  const [data, setData] = useState(suppliers);
  const [search, setSearch] = useState("");

  const filtered = data.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      await deleteSupplier(id);
      setData((prev) => prev.filter((s) => s.id !== id));
      toast.success("Supplier deleted");
    } catch (e) {
      toast.error(flashError(e, "Could not delete the supplier"));
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "contactPerson", label: "Contact", render: (item: Supplier) => item.contactPerson ?? "—" },
    { key: "phone", label: "Phone", render: (item: Supplier) => item.phone ?? "—" },
    { key: "email", label: "Email", render: (item: Supplier) => item.email ?? "—" },
    { key: "materials", label: "Materials", render: (item: Supplier) => item.materials ?? "—" },
    {
      key: "actions",
      label: "",
      render: (item: Supplier) => (
        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Button asChild>
          <Link href="/dashboard/suppliers/new">
            <Plus className="h-4 w-4 mr-2" /> Add Supplier
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
        title="Suppliers"
        searchPlaceholder="Search suppliers..."
        onSearch={setSearch}
      />
    </div>
  );
}
