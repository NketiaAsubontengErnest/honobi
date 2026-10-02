// Pure, client/server-safe payroll amount calculation.
// Lives outside the "use server" actions module because Next.js requires
// every export of a "use server" file to be an async function.

export type PayrollCycle = "DAILY" | "WEEKLY" | "MONTHLY";

export interface PayrollComputeInput {
  cycle: PayrollCycle;
  baseRate: number;
  daysWorked: number;
  allowance: number;
  deduction: number;
  periodStart: string;
  periodEnd: string;
}

export interface PayrollComputeResult {
  baseAmount: number;
  netAmount: number;
  expectedDays: number;
}

export function computePayrollAmounts(input: PayrollComputeInput): PayrollComputeResult {
  const { cycle, baseRate, daysWorked, allowance, deduction, periodStart, periodEnd } = input;
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    throw new Error("Invalid pay period dates");
  }
  const spanDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  const days = daysWorked > 0 ? daysWorked : spanDays;

  let baseAmount = 0;
  let expectedDays = spanDays;
  if (cycle === "DAILY") {
    // baseRate is earned per working day
    baseAmount = baseRate * days;
    expectedDays = spanDays;
  } else if (cycle === "WEEKLY") {
    // baseRate is earned per calendar week; partial weeks are prorated by days
    const weeks = spanDays / 7;
    baseAmount = baseRate * weeks;
    expectedDays = spanDays;
  } else {
    // MONTHLY: baseRate per calendar month; the period is prorated against
    // the number of days in the starting month
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    baseAmount = baseRate * (spanDays / daysInMonth);
    expectedDays = daysInMonth;
  }

  baseAmount = Math.round(baseAmount * 100) / 100;
  const netAmount = Math.max(0, Math.round((baseAmount + allowance - deduction) * 100) / 100);
  return { baseAmount, netAmount, expectedDays };
}
