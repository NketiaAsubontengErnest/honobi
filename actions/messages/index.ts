"use server";

import { prisma } from "@/lib/db/prisma";
import { requirePermissionServer } from "@/lib/auth/guard";
import { z } from "zod";
import { isThrottled } from "@/lib/security/throttle";
import { notifyContactMessage } from "@/lib/email";

const MESSAGE_STATUSES = ["NEW", "READ", "REPLIED", "CLOSED"] as const;

const publicMessageSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address").or(z.literal("")),
  phone: z.string(),
  subject: z.string(),
  message: z.string().min(3, "Please write a message"),
});

export async function getMessages(options?: { status?: string }) {
  await requirePermissionServer("messages:view");
  const where: { isActive: boolean; status?: (typeof MESSAGE_STATUSES)[number] } = { isActive: true };
  if (options?.status) where.status = z.enum(MESSAGE_STATUSES).parse(options.status);
  return prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" } });
}

/** Public: used by the website contact / quote forms. */
export async function createMessage(data: {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  source?: string;
}) {
  // Form fields that were left out arrive as null/undefined; treat them as empty
  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const result = publicMessageSchema.safeParse({
    name: clean(data.name),
    email: clean(data.email),
    phone: clean(data.phone),
    subject: clean(data.subject),
    message: clean(data.message),
  });
  if (!result.success) {
    return { success: false as const, error: result.error.issues[0]?.message ?? "Please check the form and try again" };
  }
  const parsed = result.data;
  const key = (parsed.email || parsed.phone || parsed.name).toLowerCase();
  if (isThrottled(key)) {
    return { success: false as const, error: "Too many messages. Please try again later." };
  }

  const saved = {
    name: parsed.name.slice(0, 100),
    email: parsed.email || null,
    phone: parsed.phone?.slice(0, 30) || null,
    subject: parsed.subject?.slice(0, 200) || null,
    message: parsed.message.slice(0, 5000),
  };
  await prisma.contactMessage.create({
    data: { ...saved, source: data.source === "quote" ? "quote" : "website" },
  });

  // Email the configured recipients. Never fail the visitor's submission because of SMTP,
  // and do not wait on a slow mail server for more than a few seconds.
  await Promise.race([
    notifyContactMessage(saved).catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 10000)),
  ]);
  return { success: true as const };
}

export async function updateMessageStatus(id: string, status: string) {
  await requirePermissionServer("messages:reply");
  const parsed = z.enum(MESSAGE_STATUSES).parse(status);
  return prisma.contactMessage.update({ where: { id }, data: { status: parsed } });
}

export async function deleteMessage(id: string) {
  await requirePermissionServer("messages:delete");
  return prisma.contactMessage.update({ where: { id }, data: { isActive: false } });
}
