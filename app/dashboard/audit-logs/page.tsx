import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ page?: string; action?: string; entity?: string }>;

function describe(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const m = metadata as Record<string, unknown>;
  if (typeof m.email === "string") return m.email;
  if (Array.isArray(m.files)) return m.files.join(", ");
  if (typeof m.permission === "string") return m.permission;
  return "";
}

export default async function AuditLogsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const action = sp.action?.trim() || undefined;
  const entity = sp.entity?.trim() || undefined;
  const where = { ...(action && { action }), ...(entity && { entity }) };

  const [logs, total, actions, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    prisma.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (p: number) => {
    const q = new URLSearchParams();
    if (action) q.set("action", action);
    if (entity) q.set("entity", entity);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `/dashboard/audit-logs${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <form className="flex flex-wrap gap-2" method="get">
          <select name="action" defaultValue={action ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>{a.action}</option>
            ))}
          </select>
          <select name="entity" defaultValue={entity ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="">All areas</option>
            {entities.map((e) => (
              <option key={e.entity} value={e.entity}>{e.entity}</option>
            ))}
          </select>
          <Button type="submit" size="sm">Filter</Button>
          {(action || entity) && (
            <Link href="/dashboard/audit-logs"><Button type="button" size="sm" variant="outline">Clear</Button></Link>
          )}
        </form>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Area</th>
              <th className="text-left p-3">Details</th>
              <th className="text-left p-3">IP</th>
              <th className="text-left p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-3">{log.user?.name ?? "System"}</td>
                <td className="p-3">
                  <Badge variant="outline" className={log.action === "LOGIN_FAILED" || log.action === "DELETE" ? "border-destructive text-destructive" : ""}>
                    {log.action}
                  </Badge>
                </td>
                <td className="p-3 capitalize">{log.entity}</td>
                <td className="p-3 text-muted-foreground max-w-xs truncate">{describe(log.metadata) || "—"}</td>
                <td className="p-3 text-muted-foreground">{log.ipAddress ?? "—"}</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            No audit logs yet. Sign-ins and every create, update or delete are recorded here from now on.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages} · {total} entries</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={qs(page - 1)}><Button size="sm" variant="outline">Previous</Button></Link>}
            {page < totalPages && <Link href={qs(page + 1)}><Button size="sm" variant="outline">Next</Button></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
