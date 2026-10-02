"use server";

import { prisma } from "@/lib/db/prisma";
import { getSessionUser, requirePermissionServer } from "@/lib/auth/guard";
import { ensureEmailSettings, sendMail, SECRET_SETTING_KEYS, SECRET_MASK } from "@/lib/email";

function maskSecret<T extends { key: string; value: string }>(s: T): T {
  return SECRET_SETTING_KEYS.includes(s.key) && s.value ? { ...s, value: SECRET_MASK } : s;
}

export async function getSettings(group?: string) {
  await requirePermissionServer("settings:view");
  await ensureEmailSettings();
  const where: { isActive: boolean; group?: string } = { isActive: true };
  if (group) where.group = group;
  const rows = await prisma.setting.findMany({ where, orderBy: { key: "asc" } });
  return rows.map(maskSecret);
}

export async function getSettingByKey(key: string) {
  await requirePermissionServer("settings:view");
  const row = await prisma.setting.findUnique({ where: { key } });
  return row ? maskSecret(row) : null;
}

export async function updateSetting(id: string, value: string) {
  await requirePermissionServer("settings:edit");
  const current = await prisma.setting.findUnique({ where: { id } });
  if (!current) throw new Error("Setting not found");
  // The masked placeholder means "unchanged"
  if (SECRET_SETTING_KEYS.includes(current.key) && value === SECRET_MASK) return maskSecret(current);
  const updated = await prisma.setting.update({ where: { id }, data: { value: value.trim() } });
  return maskSecret(updated);
}

export async function upsertSetting(key: string, value: string, type: string = "string", group: string = "general") {
  await requirePermissionServer("settings:edit");
  const row = await prisma.setting.upsert({
    where: { key },
    create: { key, value, type, group },
    update: { value },
  });
  return maskSecret(row);
}

/** Any signed-in user (e.g. for company details on printed invoices). Secrets are never returned. */
export async function getAllSettingsMap(): Promise<Record<string, string>> {
  const user = await getSessionUser();
  if (!user) throw new Error("You must be signed in to perform this action");
  const settings = await prisma.setting.findMany({ where: { isActive: true, group: { not: "email" } } });
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
}

/** Sends a test message using the saved SMTP settings. */
export async function sendTestEmail(to?: string): Promise<{ ok: boolean; message: string }> {
  const user = await requirePermissionServer("settings:edit");
  const target = (to || user.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
    return { ok: false, message: "Enter a valid email address to send the test to" };
  }
  const res = await sendMail({
    to: [target],
    subject: "HONOBI test email",
    text: "This is a test email from the HONOBI dashboard. Your SMTP settings work.",
    html: "<p>This is a test email from the HONOBI dashboard. <strong>Your SMTP settings work.</strong></p>",
  });
  return res.ok
    ? { ok: true, message: `Test email sent to ${target}` }
    : { ok: false, message: res.error || "Failed to send test email" };
}
