import { prisma } from "@/lib/db/prisma";
import { ensureEmailSettings } from "@/lib/email";

/** Contact, hours and social settings shown on the public website (and on invoices). */
export const CONTACT_SETTING_DEFAULTS: { key: string; value: string; group: string; type?: string }[] = [
  { key: "business_phone", value: "", group: "general" },
  { key: "business_whatsapp", value: "", group: "general" },
  { key: "business_email", value: "", group: "general" },
  { key: "business_address", value: "", group: "general" },
  { key: "business_region", value: "", group: "general" },
  { key: "business_country", value: "Ghana", group: "general" },
  { key: "hours_mon_fri", value: "8:00 AM - 6:00 PM", group: "hours" },
  { key: "hours_saturday", value: "9:00 AM - 4:00 PM", group: "hours" },
  { key: "hours_sunday", value: "Closed", group: "hours" },
  { key: "social_facebook", value: "", group: "social" },
  { key: "social_instagram", value: "", group: "social" },
  { key: "social_tiktok", value: "", group: "social" },
];

/** Creates any setting rows that do not exist yet (never overwrites existing values). */
export async function ensureContactSettings() {
  const existing = await prisma.setting.findMany({
    where: { key: { in: CONTACT_SETTING_DEFAULTS.map((d) => d.key) } },
    select: { key: true },
  });
  const have = new Set(existing.map((e) => e.key));
  const missing = CONTACT_SETTING_DEFAULTS.filter((d) => !have.has(d.key));
  if (missing.length) {
    await prisma.setting.createMany({
      data: missing.map((d) => ({ key: d.key, value: d.value, group: d.group, type: d.type ?? "string" })),
      skipDuplicates: true,
    });
  }
}

export async function ensureAllSettings() {
  await Promise.all([ensureEmailSettings(), ensureContactSettings()]);
}
