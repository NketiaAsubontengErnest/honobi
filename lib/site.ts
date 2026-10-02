import { prisma } from "@/lib/db/prisma";

export interface SiteInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  whatsappUrl: string | null;
  hours: { monFri: string; saturday: string; sunday: string };
  social: { facebook: string; instagram: string; tiktok: string };
}

/**
 * Public contact details. Source of truth is Dashboard > Settings > Contact;
 * the NEXT_PUBLIC_CONTACT_* environment variables are only a fallback.
 */
export async function getSite(): Promise<SiteInfo> {
  let s: Record<string, string> = {};
  try {
    const rows = await prisma.setting.findMany({
      where: { isActive: true, OR: [{ key: { startsWith: "business_" } }, { key: { startsWith: "hours_" } }, { key: { startsWith: "social_" } }] },
    });
    for (const r of rows) s[r.key] = (r.value ?? "").trim();
  } catch {
    s = {}; // database unavailable (e.g. during a build): fall back to env/defaults
  }

  const pick = (...values: (string | undefined)[]) => values.find((v) => v && v.trim())?.trim() ?? "";
  const whatsappDigits = pick(s.business_whatsapp, process.env.NEXT_PUBLIC_WHATSAPP_NUMBER).replace(/\D/g, "");
  const address = [pick(s.business_address, process.env.NEXT_PUBLIC_CONTACT_ADDRESS), s.business_region, s.business_country]
    .filter(Boolean)
    .join(", ");

  return {
    name: pick(s.business_name, "HONOBI WOOD JOINERY"),
    phone: pick(s.business_phone, process.env.NEXT_PUBLIC_CONTACT_PHONE),
    email: pick(s.business_email, process.env.NEXT_PUBLIC_CONTACT_EMAIL),
    address,
    whatsappUrl: whatsappDigits ? `https://wa.me/${whatsappDigits}` : null,
    hours: {
      monFri: pick(s.hours_mon_fri, "8:00 AM - 6:00 PM"),
      saturday: pick(s.hours_saturday, "9:00 AM - 4:00 PM"),
      sunday: pick(s.hours_sunday, "Closed"),
    },
    social: { facebook: s.social_facebook ?? "", instagram: s.social_instagram ?? "", tiktok: s.social_tiktok ?? "" },
  };
}
