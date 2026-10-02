"use client";

import { toast } from "sonner";
import { flashError } from "@/lib/utils/flash";
import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteService } from "@/actions/services";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

type Service = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFeatured: boolean;
  category: { name: string } | null;
  createdAt: Date;
};

export function ServicesClient({ services }: { services: Service[] }) {
  const [data, setData] = useState(services);
  const [search, setSearch] = useState("");

  const filtered = data.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try {
      await deleteService(id);
      setData((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service deleted");
    } catch (e) {
      toast.error(flashError(e, "Could not delete the service"));
    }
  };

  const columns = [
    { key: "name", label: "Service" },
    { key: "category", label: "Category", render: (item: Service) => item.category?.name ?? "—" },
    {
      key: "isFeatured",
      label: "Featured",
      render: (item: Service) => (
        <Badge variant={item.isFeatured ? "default" : "outline"}>
          {item.isFeatured ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: Service) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/dashboard/services/${item.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button asChild>
          <Link href="/dashboard/services/new">
            <Plus className="h-4 w-4 mr-2" /> Add Service
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
        title="Services"
        searchPlaceholder="Search services..."
        onSearch={setSearch}
      />
    </div>
  );
}
