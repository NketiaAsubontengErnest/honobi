"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { validateAmounts, validateLineItems, round2 } from "@/lib/validation/money";
import { generateNumber } from "@/lib/utils";

// Convert Prisma results (Decimal/Date instances) into plain objects that can
// cross the Server -> Client boundary (server action return values).
function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function getInvoices(options?: { search?: string; status?: string }) {
  await requirePermissionServer("invoices:view");
  const where: any = { isActive: true };
  if (options?.search) {
    where.OR = [
      { invoiceNumber: { contains: options.search, mode: "insensitive" } },
      { customer: { name: { contains: options.search, mode: "insensitive" } } },
    ];
  }
  if (options?.status) {
    where.status = options.status;
  }
  return prisma.invoice.findMany({
    where,
    include: { customer: true, job: true, items: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceById(id: string) {
  await requirePermissionServer("invoices:view");
  return prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, job: true, items: true, payments: { include: { customer: true } } },
  });
}

export async function createInvoice(data: {
  customerId: string;
  jobId?: string;
  items: Array<{ name: string; description?: string; quantity: number; unitPrice: number }>;
  discount?: number;
  taxRate?: number;
  dueDate?: Date;
  notes?: string;
}) {
  await requirePermissionServer("invoices:create");
  const invoiceNumber = generateNumber("INV");
  const lineItems = validateLineItems(data.items);
  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const discount = data.discount ?? 0;
  const taxRate = data.taxRate ?? 0;
  validateAmounts(subtotal, discount, taxRate);
  const taxAmount = round2(((subtotal - discount) * taxRate) / 100);
  const total = round2(subtotal - discount + taxAmount);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: data.customerId,
      jobId: data.jobId || null,
      subtotal,
      discount,
      taxRate,
      taxAmount,
      total,
      balance: total,
      dueDate: data.dueDate,
      notes: data.notes,
      items: {
        create: lineItems.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  });
  await prisma.notification.create({
    data: {
      type: "INVOICE_GENERATED",
      title: `Invoice ${invoiceNumber} created`,
      message: `Invoice ${invoiceNumber} for ${invoice.total} has been generated.`,
      link: `/dashboard/invoices/${invoice.id}`,
    },
  });
  return serialize(invoice);
}

export async function updateInvoice(
  id: string,
  data: {
    customerId?: string;
    items?: Array<{ name: string; description?: string; quantity: number; unitPrice: number }>;
    discount?: number;
    taxRate?: number;
    dueDate?: Date;
    notes?: string;
    status?: string;
  }
) {
  await requirePermissionServer("invoices:edit");
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw new Error("Invoice not found");

  const discount = data.discount ?? Number(existing.discount);
  const taxRate = data.taxRate ?? Number(existing.taxRate);
  const amountPaid = Number(existing.amountPaid);

  let subtotal = Number(existing.subtotal);
  let total = Number(existing.total);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { discount, taxRate };
  if (data.customerId) updateData.customerId = data.customerId;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const lineItems = data.items ? validateLineItems(data.items) : undefined;
  if (lineItems) {
    subtotal = round2(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
    validateAmounts(subtotal, discount, taxRate);
    const taxAmount = round2(((subtotal - discount) * taxRate) / 100);
    total = round2(subtotal - discount + taxAmount);
    updateData.subtotal = subtotal;
    updateData.taxAmount = taxAmount;
    updateData.total = total;
  }

  // Keep the balance and status consistent with the (possibly new) total
  const balance = Math.max(0, total - amountPaid);
  updateData.balance = balance;
  if (data.status) {
    if (!["DRAFT", "SENT", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"].includes(data.status)) throw new Error("Invalid status");
    updateData.status = data.status;
  } else if (balance <= 0 && total > 0) {
    updateData.status = "PAID";
  } else if (amountPaid > 0 && existing.status === "PAID") {
    // Total grew beyond what was already paid
    updateData.status = "PARTIALLY_PAID";
  }

  const invoice = await prisma.$transaction(async (tx) => {
    if (lineItems) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.createMany({
        data: lineItems.map((item) => ({
          invoiceId: id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      });
    }
    return tx.invoice.update({ where: { id }, data: updateData });
  });
  return serialize(invoice);
}

export async function deleteInvoice(id: string) {
  await requirePermissionServer("invoices:delete");
  const invoice = await prisma.invoice.update({ where: { id }, data: { isActive: false } });
  return serialize(invoice);
}

export async function recordPayment(
  invoiceId: string,
  paymentData: {
    amount: number;
    paymentMethod: string;
    notes?: string;
    customerId: string;
    jobId?: string;
  }
) {
  await requirePermissionServer("payments:create");
  if (!Number.isFinite(paymentData.amount) || paymentData.amount <= 0) throw new Error("Amount must be positive");
  const reference = generateNumber("PAY");
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Invoice not found");
  if (paymentData.amount > Number(invoice.balance) + 0.005) throw new Error("Payment exceeds the outstanding balance");

  const payment = await prisma.payment.create({
    data: {
      reference,
      customerId: paymentData.customerId,
      invoiceId,
      jobId: paymentData.jobId || null,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod as never,
      notes: paymentData.notes,
    },
  });

  const newAmountPaid = Number(invoice.amountPaid) + paymentData.amount;
  const newBalance = Number(invoice.total) - newAmountPaid;
  const newStatus = newBalance <= 0 ? "PAID" : "PARTIALLY_PAID";

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid: newAmountPaid, balance: newBalance, status: newStatus },
  });

  await prisma.notification.create({
    data: {
      type: "PAYMENT_RECEIVED",
      title: `Payment ${reference} received`,
      message: `Payment of ${paymentData.amount} recorded against invoice ${invoice.invoiceNumber} (${newStatus}).`,
      link: `/dashboard/invoices/${invoiceId}`,
    },
  });

  return serialize({ payment, invoiceStatus: newStatus, amountPaid: newAmountPaid, balance: newBalance });
}
