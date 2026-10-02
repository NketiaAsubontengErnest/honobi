import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { hasPermission, type Permission } from "@/lib/permissions";
import { auditActionForPermission, logAudit } from "@/lib/audit";

/**
 * Returns the current session user (id, name, email, role) or null.
 * The role and active flag are re-read from the database so that a demoted or
 * deactivated user loses access immediately instead of when the JWT expires.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!dbUser || !dbUser.isActive) return null;

  return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role as string };
}

/**
 * Guard for server actions / route handlers.
 * Throws when the caller is unauthenticated or lacks the permission.
 * Client forms catch this and surface the message as a form error.
 */
export async function requirePermissionServer(permission: Permission) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("You must be signed in to perform this action");
  }
  if (!hasPermission(user.role, permission)) {
    throw new Error(`Your role (${user.role}) is not allowed to perform: ${permission}`);
  }
  // Record every state-changing action (create / update / delete / approve ...)
  const audit = auditActionForPermission(permission);
  if (audit) {
    await logAudit({ userId: user.id, action: audit.action, entity: audit.entity, metadata: { permission } });
  }
  return user;
}
