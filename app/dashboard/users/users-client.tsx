"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteUser } from "@/actions/users";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export function UsersClient({ users }: { users: User[] }) {
  const [data, setData] = useState(users);

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this user?")) return;
    await deleteUser(id);
    setData((prev) => prev.filter((u) => u.id !== id));
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (item: User) => <Badge variant="outline">{item.role}</Badge>,
    },
    {
      key: "isActive",
      label: "Status",
      render: (item: User) => (
        <Badge variant={item.isActive ? "default" : "destructive"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    { key: "createdAt", label: "Joined", render: (item: User) => formatDate(item.createdAt) },
    {
      key: "actions",
      label: "",
      render: (item: User) => (
        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="h-4 w-4 mr-2" /> Add User
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        total={data.length}
        page={1}
        limit={50}
        totalPages={1}
        title="Users"
        searchPlaceholder="Search users..."
      />
    </div>
  );
}
