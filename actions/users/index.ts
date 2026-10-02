"use server";

import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSessionUser, requirePermissionServer } from "@/lib/auth/guard";

const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SECRETARY", "ACCOUNTANT", "STAFF"] as const;
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: passwordSchema,
  role: z.enum(ROLES),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
});

const SAFE_SELECT = { id: true, name: true, email: true, role: true, isActive: true } as const;

/** Only a SUPER_ADMIN may grant, change or remove the SUPER_ADMIN role. */
function assertCanTouchRole(actorRole: string, ...roles: (string | undefined)[]) {
  if (actorRole !== "SUPER_ADMIN" && roles.includes("SUPER_ADMIN")) {
    throw new Error("Only a Super Admin can manage Super Admin accounts");
  }
}

export async function getUsers() {
  await requirePermissionServer("users:view");
  return prisma.user.findMany({
    select: { ...SAFE_SELECT, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(data: { name: string; email: string; password: string; role: string }) {
  const actor = await requirePermissionServer("users:create");
  const parsed = createUserSchema.parse(data);
  assertCanTouchRole(actor.role, parsed.role);

  const passwordHash = await bcrypt.hash(parsed.password, 12);
  return prisma.user.create({
    data: { name: parsed.name, email: parsed.email, passwordHash, role: parsed.role },
    select: SAFE_SELECT,
  });
}

export async function updateUser(id: string, data: { name?: string; email?: string; role?: string; isActive?: boolean }) {
  const actor = await requirePermissionServer("users:edit");
  const parsed = updateUserSchema.parse(data);

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) throw new Error("User not found");
  assertCanTouchRole(actor.role, target.role, parsed.role);

  if (actor.id === id && (parsed.isActive === false || (parsed.role && parsed.role !== target.role))) {
    throw new Error("You cannot change your own role or deactivate your own account");
  }

  return prisma.user.update({ where: { id }, data: parsed, select: SAFE_SELECT });
}

/**
 * Users change their own password by supplying the current one.
 * Admins (users:edit) can reset someone else's password.
 */
export async function changePassword(id: string, newPassword: string, currentPassword?: string) {
  const actor = await getSessionUser();
  if (!actor) throw new Error("You must be signed in to perform this action");
  passwordSchema.parse(newPassword);

  const target = await prisma.user.findUnique({ where: { id }, select: { passwordHash: true, role: true } });
  if (!target) throw new Error("User not found");

  if (actor.id === id) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, target.passwordHash))) {
      throw new Error("Current password is incorrect");
    }
  } else {
    await requirePermissionServer("users:edit");
    assertCanTouchRole(actor.role, target.role);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return { success: true };
}

export async function deleteUser(id: string) {
  const actor = await requirePermissionServer("users:delete");
  if (actor.id === id) throw new Error("You cannot deactivate your own account");

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) throw new Error("User not found");
  assertCanTouchRole(actor.role, target.role);

  return prisma.user.update({ where: { id }, data: { isActive: false }, select: SAFE_SELECT });
}
