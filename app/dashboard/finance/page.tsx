import { prisma } from "@/lib/db/prisma";
import { FinanceClient } from "./finance-client";

export default async function FinancePage() {
  const [incomeTotal, expenseTotal, recentIncome, recentExpenses] = await Promise.all([
    prisma.income.aggregate({ where: { isActive: true }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { isActive: true }, _sum: { amount: true } }),
    prisma.income.findMany({ where: { isActive: true }, orderBy: { date: "desc" }, take: 12 }),
    prisma.expense.findMany({ where: { isActive: true }, orderBy: { date: "desc" }, take: 12 }),
  ]);

  const totalIncome = Number(incomeTotal._sum.amount ?? 0);
  const totalExpenses = Number(expenseTotal._sum.amount ?? 0);
  const profit = totalIncome - totalExpenses;

  // Monthly data for charts
  const monthlyData = buildMonthlyData(recentIncome, recentExpenses);

  return (
    <FinanceClient
      totalIncome={totalIncome}
      totalExpenses={totalExpenses}
      profit={profit}
      monthlyData={monthlyData}
      recentIncome={recentIncome.map((i: typeof recentIncome[0]) => ({
        id: i.id, date: i.date.toISOString(), amount: Number(i.amount), category: i.category, description: i.description,
      }))}
      recentExpenses={recentExpenses.map((e: typeof recentExpenses[0]) => ({
        id: e.id, date: e.date.toISOString(), amount: Number(e.amount), category: e.category, description: e.description,
      }))}
    />
  );
}

function buildMonthlyData(
  income: Array<{ date: Date; amount: unknown }>,
  expenses: Array<{ date: Date; amount: unknown }>
) {
  const map = new Map<string, { month: string; income: number; expenses: number }>();
  for (const inc of income) {
    const key = `${inc.date.getFullYear()}-${String(inc.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) ?? { month: key, income: 0, expenses: 0 };
    existing.income += Number(inc.amount);
    map.set(key, existing);
  }
  for (const exp of expenses) {
    const key = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key) ?? { month: key, income: 0, expenses: 0 };
    existing.expenses += Number(exp.amount);
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}
