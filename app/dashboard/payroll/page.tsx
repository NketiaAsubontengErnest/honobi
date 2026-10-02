import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  getPayrollConfigs,
  getPayrollRuns,
  getPayrollSummary,
} from "@/actions/payroll";
import { PayrollClient } from "./payroll-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "payroll:view")) redirect("/dashboard");

  const [configs, runs, summary, employees] = await Promise.all([
    getPayrollConfigs(),
    getPayrollRuns(),
    getPayrollSummary(),
    prisma.employee.findMany({
      where: { isActive: true, status: "ACTIVE" },
      select: { id: true, employeeId: true, name: true, position: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PayrollClient
      configs={configs}
      runs={runs}
      summary={summary}
      employees={employees}
      userRole={session.user.role}
    />
  );
}
