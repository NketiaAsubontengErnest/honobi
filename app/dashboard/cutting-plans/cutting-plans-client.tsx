"use client";

import { toast } from "sonner";
import { flashError } from "@/lib/utils/flash";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  duplicateCuttingPlan,
  deleteCuttingPlan,
} from "@/actions/cutting-plans";
import { formatDate } from "@/lib/utils";
import { Eye, Copy, Trash2, FileJson, FileSpreadsheet, Plus, Printer } from "lucide-react";

export type CuttingPlanRow = {
  id: string;
  planNumber: string;
  name: string;
  status: string;
  materialName: string;
  materialType: string;
  boardLength: number;
  boardWidth: number;
  unit: string;
  boardsUsed: number | null;
  efficiency: number | null;
  createdAt: string;
  project: { id: string; name: string } | null;
  job: { id: string; jobNumber: string; title: string } | null;
  pieces: {
    id: string;
    name: string;
    length: number;
    width: number;
    quantity: number;
    grain: string;
    allowRotation: boolean;
    notes: string | null;
  }[];
};

const STATUSES = ["ALL", "DRAFT", "GENERATED", "APPROVED", "PRINTED", "COMPLETED", "ARCHIVED"];

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  GENERATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PRINTED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  ARCHIVED: "bg-zinc-200 text-zinc-600 line-through",
};

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function planToCsv(plan: CuttingPlanRow): string {
  const header = "planNumber,planName,pieceName,length,width,quantity,grain,rotation,notes";
  const rows = plan.pieces.map(
    (p) =>
      `${plan.planNumber},"${plan.name}","${p.name}",${p.length},${p.width},${p.quantity},${p.grain},${p.allowRotation},"${(p.notes ?? "").replace(/"/g, '""')}"`
  );
  return [header, ...rows].join("\n");
}

export function CuttingPlansClient({
  plans,
  projects,
  jobs,
}: {
  plans: CuttingPlanRow[];
  projects: { id: string; name: string }[];
  jobs: { id: string; jobNumber: string; title: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [projectId, setProjectId] = useState("");
  const [jobId, setJobId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      if (status !== "ALL" && p.status !== status) return false;
      if (projectId && p.project?.id !== projectId) return false;
      if (jobId && p.job?.id !== jobId) return false;
      if (from && new Date(p.createdAt) < new Date(from)) return false;
      if (to && new Date(p.createdAt) > new Date(`${to}T23:59:59`)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.planNumber.toLowerCase().includes(q) ||
          p.materialName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [plans, search, status, projectId, jobId, from, to]);

  const handleDuplicate = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      const copy = await duplicateCuttingPlan(id);
      toast.success("Cutting plan duplicated");
      router.push(`/dashboard/cutting-plans/${copy.id}`);
    } catch (e) {
      toast.error(flashError(e, "Failed to duplicate plan"));
      setError(e instanceof Error ? e.message : "Failed to duplicate plan");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this cutting plan?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteCuttingPlan(id);
      toast.success("Cutting plan archived");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to archive plan"));
      setError(e instanceof Error ? e.message : "Failed to archive plan");
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "planNumber", label: "Plan #" },
    { key: "name", label: "Name" },
    {
      key: "material",
      label: "Board",
      render: (p: CuttingPlanRow) =>
        `${p.materialName} (${p.boardLength} x ${p.boardWidth} ${p.unit})`,
    },
    {
      key: "project",
      label: "Project / Job",
      render: (p: CuttingPlanRow) => p.project?.name ?? p.job?.title ?? "—",
    },
    {
      key: "boardsUsed",
      label: "Boards",
      render: (p: CuttingPlanRow) => (p.boardsUsed !== null ? String(p.boardsUsed) : "—"),
    },
    {
      key: "efficiency",
      label: "Efficiency",
      render: (p: CuttingPlanRow) =>
        p.efficiency !== null ? `${p.efficiency}%` : "—",
    },
    {
      key: "status",
      label: "Status",
      render: (p: CuttingPlanRow) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || ""}`}>
          {p.status}
        </span>
      ),
    },
    { key: "createdAt", label: "Date", render: (p: CuttingPlanRow) => formatDate(p.createdAt) },
  ];

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Filter bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <div className="col-span-2 md:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUSES.map((s) => ({ value: s, label: s === "ALL" ? "All statuses" : s }))}
          />
        </div>
        <div className="col-span-2 md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Project</label>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={[
              { value: "", label: "All projects" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        total={filtered.length}
        page={1}
        limit={100}
        totalPages={1}
        title="Cutting Plans"
        searchPlaceholder="Search plans..."
        onSearch={setSearch}
        viewHref={(p: CuttingPlanRow) => `/dashboard/cutting-plans/${p.id}`}
        actions={(p: CuttingPlanRow) => (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" title="Print / View" asChild>
              <Link href={`/dashboard/cutting-plans/${p.id}`}>
                <Printer className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Export JSON"
              onClick={() =>
                download(
                  `${p.planNumber}.json`,
                  JSON.stringify(
                    {
                      exportedAt: new Date().toISOString(),
                      app: "HONOBI Cutting Optimizer",
                      version: 1,
                      plan: p,
                    },
                    null,
                    2
                  ),
                  "application/json"
                )
              }
            >
              <FileJson className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Export CSV"
              onClick={() => download(`${p.planNumber}.csv`, planToCsv(p), "text/csv")}
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Duplicate"
              disabled={busy}
              onClick={() => handleDuplicate(p.id)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="Archive"
              disabled={busy}
              onClick={() => handleDelete(p.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      />

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/cutting-plans/new">
            <Plus className="h-4 w-4 mr-2" /> Create New Cutting Plan
          </Link>
        </Button>
      </div>
    </div>
  );
}
