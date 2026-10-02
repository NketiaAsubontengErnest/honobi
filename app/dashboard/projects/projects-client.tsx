"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Project {
  id: string; name: string; slug: string; status: string; location: string | null;
  budget: string | null; isFeatured: boolean; category: { name: string } | null;
  startDate: string | null; completionDate: string | null;
}

export function ProjectsClient({ projects, total, page, limit, totalPages }: { projects: Project[]; total: number; page: number; limit: number; totalPages: number }) {
  const router = useRouter();
  const columns = [
    { key: "name", label: "Project" },
    { key: "category", label: "Category", render: (p: Project) => p.category?.name || "-" },
    { key: "location", label: "Location", render: (p: Project) => p.location || "-" },
    { key: "status", label: "Status", render: (p: Project) => <Badge variant={p.status === "COMPLETED" ? "success" : p.status === "IN_PROGRESS" ? "info" : p.status === "CANCELLED" ? "destructive" : "secondary"}>{p.status.replace("_", " ")}</Badge> },
    { key: "completionDate", label: "Completed", render: (p: Project) => p.completionDate ? formatDate(p.completionDate) : "-" },
  ];

  return (
    <DataTable columns={columns} data={projects} total={total} page={page} limit={limit} totalPages={totalPages}
      title="Projects" createHref="/dashboard/projects/new" searchPlaceholder="Search projects..."
      onSearch={(v) => router.push(`/dashboard/projects?search=${encodeURIComponent(v)}`)}
      onPageChange={(p) => router.push(`/dashboard/projects?page=${p}`)}
      editHref={(p) => `/dashboard/projects/${p.id}/edit`} />
  );
}
