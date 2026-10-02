"use server";

import { isThrottled } from "@/lib/security/throttle";
import { notifyQuoteRequest } from "@/lib/email";
import { validateLineItems } from "@/lib/validation/money";
import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { generateNumber } from "@/lib/utils";

// Convert Prisma results (Decimal/Date instances) into plain objects that can
// cross the Server -> Client boundary (server action return values).
function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function getQuotes(options?: { search?: string; status?: string }) {
  await requirePermissionServer("quotations:view");
  const where: any = { isValid: true };
  if (options?.search) {
    where.OR = [
      { quoteNumber: { contains: options.search, mode: "insensitive" } },
      { customerName: { contains: options.search, mode: "insensitive" } },
    ];
  }
  if (options?.status) {
    where.status = options.status;
  }
  return prisma.quote.findMany({
    where,
    include: { customer: true, items: true, convertedJob: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuoteById(id: string) {
  await requirePermissionServer("quotations:view");
  return prisma.quote.findUnique({
    where: { id },
    include: { customer: true, items: true, convertedJob: true },
  });
}

export async function createQuote(data: {
  customerId?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  location?: string;
  projectType?: string;
  description?: string;
  estimatedBudget?: number;
  preferredDate?: Date;
  additionalNotes?: string;
  items?: Array<{ name: string; description?: string; quantity: number; unitPrice: number }>;
}) {
  await requirePermissionServer("quotations:create");
  const quoteNumber = generateNumber("QT");
  const totalAmount = data.items
    ? data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    : null;

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: data.customerId || null,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      location: data.location,
      projectType: data.projectType,
      description: data.description,
      estimatedBudget: data.estimatedBudget,
      preferredDate: data.preferredDate,
      additionalNotes: data.additionalNotes,
      totalAmount,
      items: data.items
        ? {
            create: data.items.map((item) => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          }
        : undefined,
    },
    include: { items: true },
  });
  return serialize(quote);
}

/** Public: website "Request a quote" form. Accepts only customer-facing fields. */
export async function requestQuote(data: {
  customerName: string;
  phone: string;
  email?: string;
  location?: string;
  projectType?: string;
  description?: string;
  estimatedBudget?: number;
  additionalNotes?: string;
}) {
  const name = String(data.customerName ?? "").trim();
  const phone = String(data.phone ?? "").trim();
  if (name.length < 2 || phone.length < 7) {
    return { success: false as const, error: "Please enter your name and a valid phone number" };
  }
  if (isThrottled("quote:" + phone, 3)) {
    return { success: false as const, error: "Too many requests. Please try again later." };
  }
  const budget = Number(data.estimatedBudget);

  const quoteNumber = generateNumber("QT");
  const created = await prisma.quote.create({
    data: {
      quoteNumber,
      customerName: name.slice(0, 100),
      phone: phone.slice(0, 30),
      email: data.email ? String(data.email).trim().slice(0, 200) : null,
      location: data.location ? String(data.location).slice(0, 200) : null,
      projectType: data.projectType ? String(data.projectType).slice(0, 100) : null,
      description: data.description ? String(data.description).slice(0, 5000) : null,
      estimatedBudget: Number.isFinite(budget) && budget > 0 ? budget : null,
      additionalNotes: data.additionalNotes ? String(data.additionalNotes).slice(0, 5000) : null,
    },
  });
  await Promise.race([
    notifyQuoteRequest({
      quoteNumber,
      customerName: created.customerName ?? name,
      phone,
      email: created.email,
      location: created.location,
      projectType: created.projectType,
      description: created.description,
      estimatedBudget: created.estimatedBudget ? Number(created.estimatedBudget) : null,
      additionalNotes: created.additionalNotes,
    }).catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 10000)),
  ]);
  return { success: true as const };
}

export async function updateQuote(
  id: string,
  data: {
    status?: string;
    customerName?: string;
    phone?: string;
    email?: string;
    description?: string;
    totalAmount?: number;
    additionalNotes?: string;
  }
) {
  await requirePermissionServer("quotations:edit");
  const quote = await prisma.quote.update({ where: { id }, data: data as never });
  return serialize(quote);
}

export async function deleteQuote(id: string) {
  await requirePermissionServer("quotations:delete");
  const quote = await prisma.quote.update({ where: { id }, data: { isValid: false } });
  return serialize(quote);
}

export async function convertQuoteToJob(quoteId: string) {
  await requirePermissionServer("quotations:convert");
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { items: true } });
  if (!quote || !quote.customerId) throw new Error("Quote or customer not found");

  const jobNumber = generateNumber("JOB");

  const job = await prisma.job.create({
    data: {
      jobNumber,
      customerId: quote.customerId,
      title: quote.projectType || `Job from Quote ${quote.quoteNumber}`,
      description: quote.description,
      estimatedCost: quote.totalAmount,
      balance: quote.totalAmount ?? 0,
      status: "PENDING",
      items: quote.items.length > 0
        ? {
            create: quote.items.map((item: { name: string; description: string | null; quantity: number; unitPrice: unknown; totalPrice: unknown }) => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice as number,
              totalPrice: item.totalPrice as number,
            })),
          }
        : undefined,
    },
  });

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "CONVERTED", convertedJobId: job.id },
  });

  return serialize(job);
}
