import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";

const VERB_ACTIONS: Record<string, string> = {
  create: "CREATE",
  edit: "UPDATE",
  delete: "DELETE",
  approve: "APPROVE",
  convert: "CONVERT",
  adjust: "ADJUST",
  send: "SEND",
  assign: "ASSIGN",
  reply: "REPLY",
  upload: "UPLOAD",
  export: "EXPORT",
};

/** Maps a permission such as "invoices:edit" to an audit action, or null for read-only permissions. */
export function auditActionForPermission(permission: string): { action: string; entity: string } | null {
  const [entity, verb] = permission.split(":");
  const action = VERB_ACTIONS[verb];
  return action ? { action, entity } : null;
}

function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip")) || null;
}

/** Best-effort audit write: never throws and never blocks the caller's work. */
export async function logAudit(entry: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  try {
    let ip = entry.ipAddress ?? null;
    if (!ip) {
      try {
        ip = clientIp(await headers());
      } catch {
        // outside a request scope (scripts)
      }
    }
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        metadata: (entry.metadata as never) ?? undefined,
        ipAddress: ip,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log:", err instanceof Error ? err.message : err);
  }
}

export { clientIp };
