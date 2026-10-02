"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { paymentSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { generateNumber } from "@/lib/utils";

export async function createPayment(formData: FormData) {
  await requirePermissionServer("payments:create");
  const data = Object.fromEntries(formData.entries());
  const validated = paymentSchema.parse(data);
  const reference = generateNumber("PAY");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payment = await prisma.$transaction(async (tx: any) => {
    const p = await tx.payment.create({
      data: {
        reference,
        customerId: validated.customerId,
        invoiceId: validated.invoiceId || null,
        jobId: validated.jobId || null,
        amount: validated.amount.toString(),
        paymentDate: new Date(validated.paymentDate),
        paymentMethod: validated.paymentMethod,
        notes: validated.notes || null,
      },
    });

    // Update invoice balance if linked
    if (validated.invoiceId) {
      const invoice = await tx.invoice.findUnique({ where: { id: validated.invoiceId } });
      if (invoice) {
        if (validated.amount > Number(invoice.balance) + 0.005) throw new Error("Payment exceeds the outstanding balance");
        const newAmountPaid = Number(invoice.amountPaid) + validated.amount;
        const newBalance = Number(invoice.total) - newAmountPaid;
        const newStatus = newBalance <= 0 ? "PAID" : "PARTIALLY_PAID";
        await tx.invoice.update({
          where: { id: validated.invoiceId },
          data: { amountPaid: String(newAmountPaid), balance: String(Math.max(0, newBalance)), status: newStatus },
        });
      }
    }

    // Update job balance if linked
    if (validated.jobId) {
      const job = await tx.job.findUnique({ where: { id: validated.jobId } });
      if (job) {
        const newAmountPaid = Number(job.amountPaid) + validated.amount;
        const newBalance = Number(job.finalCost || job.estimatedCost || 0) - newAmountPaid;
        await tx.job.update({
          where: { id: validated.jobId },
          data: { amountPaid: String(newAmountPaid), balance: String(Math.max(0, newBalance)) },
        });
      }
    }

    return p;
  });

  revalidatePath("/dashboard/payments");
  return { success: true, payment };
}

export async function getPayments(params: { page?: number; limit?: number; search?: string }) {
  await requirePermissionServer("payments:view");
  const { page = 1, limit = 20, search = "" } = params;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { reference: { contains: search, mode: "insensitive" as const } },
        { customer: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: "desc" },
      include: { customer: true, invoice: true },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
}
