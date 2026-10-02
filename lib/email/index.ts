import nodemailer from "nodemailer";
import { prisma } from "@/lib/db/prisma";

/** Settings keys that make up the email configuration (group "email"). */
export const EMAIL_SETTING_DEFAULTS: { key: string; value: string; type: string; hint: string }[] = [
  { key: "smtp_host", value: "", type: "string", hint: "e.g. smtp.gmail.com" },
  { key: "smtp_port", value: "587", type: "number", hint: "587 (STARTTLS) or 465 (SSL)" },
  { key: "smtp_secure", value: "false", type: "boolean", hint: "true for port 465, false for 587" },
  { key: "smtp_user", value: "", type: "string", hint: "SMTP username (usually the email address)" },
  { key: "smtp_password", value: "", type: "string", hint: "SMTP password or app password" },
  { key: "smtp_from_name", value: "HONOBI WOOD JOINERY", type: "string", hint: "Sender display name" },
  { key: "smtp_from_email", value: "", type: "string", hint: "Sender address (defaults to the SMTP user)" },
  { key: "notification_emails", value: "", type: "string", hint: "Comma-separated addresses that receive new messages and quote requests" },
];

export const SECRET_SETTING_KEYS = ["smtp_password"];
export const SECRET_MASK = "********";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
  recipients: string[];
}

export async function ensureEmailSettings() {
  const existing = await prisma.setting.findMany({
    where: { key: { in: EMAIL_SETTING_DEFAULTS.map((d) => d.key) } },
    select: { key: true },
  });
  const have = new Set(existing.map((e) => e.key));
  const missing = EMAIL_SETTING_DEFAULTS.filter((d) => !have.has(d.key));
  if (missing.length) {
    await prisma.setting.createMany({
      data: missing.map((d) => ({ key: d.key, value: d.value, type: d.type, group: "email" })),
      skipDuplicates: true,
    });
  }
}

/** DB settings first, environment variables (SMTP_*) as fallback. */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...EMAIL_SETTING_DEFAULTS.map((d) => d.key), "business_email"] } },
  });
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = (r.value ?? "").trim();

  const host = s.smtp_host || process.env.SMTP_HOST || "";
  const user = s.smtp_user || process.env.SMTP_USER || "";
  const password = s.smtp_password || process.env.SMTP_PASSWORD || "";
  if (!host) return null;

  const port = Number(s.smtp_port || process.env.SMTP_PORT || 587);
  const secure = (s.smtp_secure || process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  const recipients = (s.notification_emails || process.env.NOTIFICATION_EMAILS || s.business_email || "")
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));

  return {
    host,
    port,
    secure,
    user,
    password,
    fromName: s.smtp_from_name || "HONOBI WOOD JOINERY",
    fromEmail: s.smtp_from_email || user,
    recipients,
  };
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

export async function sendMail(opts: {
  to?: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<SendResult> {
  try {
    const cfg = await getEmailConfig();
    if (!cfg) return { ok: false, error: "SMTP is not configured (set the SMTP host in Settings → Email)" };
    const to = opts.to?.length ? opts.to : cfg.recipients;
    if (!to.length) return { ok: false, error: "No notification email address is configured" };
    if (!cfg.fromEmail) return { ok: false, error: "No sender address configured" };

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });

    await transporter.sendMail({
      from: `"${cfg.fromName.replace(/"/g, "")}" <${cfg.fromEmail}>`,
      to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Failed to send email";
    console.error("[email] send failed:", error);
    return { ok: false, error };
  }
}

function row(label: string, value?: string | null) {
  return value ? `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>` : "";
}

export async function notifyContactMessage(m: {
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  const subject = `New website message: ${m.subject || m.name}`;
  const text = [
    `From: ${m.name}`,
    m.email ? `Email: ${m.email}` : null,
    m.phone ? `Phone: ${m.phone}` : null,
    m.subject ? `Subject: ${m.subject}` : null,
    "",
    m.message,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px"><h2 style="margin:0 0 12px">New website message</h2>
<table>${row("Name", m.name)}${row("Email", m.email)}${row("Phone", m.phone)}${row("Subject", m.subject)}</table>
<p style="white-space:pre-wrap;border-left:3px solid #b5651d;padding-left:12px;margin-top:16px">${escapeHtml(m.message)}</p></div>`;
  return sendMail({ subject, text, html, replyTo: m.email || undefined });
}

export async function notifyQuoteRequest(q: {
  quoteNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  location?: string | null;
  projectType?: string | null;
  description?: string | null;
  estimatedBudget?: number | null;
  additionalNotes?: string | null;
}) {
  const subject = `New quote request ${q.quoteNumber} from ${q.customerName}`;
  const lines: [string, string | null | undefined][] = [
    ["Quote #", q.quoteNumber],
    ["Name", q.customerName],
    ["Phone", q.phone],
    ["Email", q.email],
    ["Location", q.location],
    ["Project type", q.projectType],
    ["Budget", q.estimatedBudget ? String(q.estimatedBudget) : null],
    ["Description", q.description],
    ["Notes", q.additionalNotes],
  ];
  const text = lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px"><h2 style="margin:0 0 12px">New quote request</h2><table>${lines.map(([k, v]) => row(k, v)).join("")}</table></div>`;
  return sendMail({ subject, text, html, replyTo: q.email || undefined });
}
