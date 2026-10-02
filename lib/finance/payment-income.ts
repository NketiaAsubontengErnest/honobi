import type { Prisma } from "@prisma/client";
import { generateNumber } from "@/lib/utils";

type IncomeWriter = Pick<Prisma.TransactionClient, "income">;

/**
 * Every payment received from a customer is income. The Income record shares the
 * payment's reference so it can be traced (and is never created twice).
 */
export async function recordIncomeForPayment(
  db: IncomeWriter,
  payment: {
    reference: string;
    amount: number | string;
    paymentMethod: string;
    customerId?: string | null;
    jobId?: string | null;
    paymentDate?: Date | null;
  },
  recordedById?: string | null
) {
  await db.income.create({
    data: {
      incomeNumber: generateNumber("INC"),
      date: payment.paymentDate ?? new Date(),
      amount: String(payment.amount),
      customerId: payment.customerId || null,
      jobId: payment.jobId || null,
      paymentMethod: payment.paymentMethod as never,
      category: "OTHER",
      description: `Customer payment ${payment.reference}`,
      reference: payment.reference,
      recordedById: recordedById ?? null,
    },
  });
}
