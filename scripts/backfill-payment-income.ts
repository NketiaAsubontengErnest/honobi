// One-off: create the missing Income record for payments recorded before payments counted as income.
// Safe to re-run (skips payments that already have an income record with the same reference).
import { PrismaClient } from "@prisma/client";
import { generateNumber } from "../lib/utils";

const prisma = new PrismaClient();

async function main() {
  const payments = await prisma.payment.findMany({ where: { isActive: true } });
  let created = 0;
  for (const p of payments) {
    const exists = await prisma.income.findFirst({ where: { reference: p.reference } });
    if (exists) continue;
    await prisma.income.create({
      data: {
        incomeNumber: generateNumber("INC"),
        date: p.paymentDate,
        amount: p.amount,
        customerId: p.customerId,
        jobId: p.jobId,
        paymentMethod: p.paymentMethod,
        category: "OTHER",
        description: `Customer payment ${p.reference}`,
        reference: p.reference,
      },
    });
    created++;
  }
  console.log(`payments: ${payments.length}, income records created: ${created}`);
}

main().finally(() => prisma.$disconnect());
