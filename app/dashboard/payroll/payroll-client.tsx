"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPayrollRun,
  upsertPayrollConfig,
  deletePayrollConfig,
  markPayrollRunPaid,
  cancelPayrollRun,
  deletePayrollRun,
} from "@/actions/payroll";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { hasPermission, type Permission } from "@/lib/permissions";
import { CalendarDays, CreditCard, Plus, Trash2, Wallet, XCircle } from "lucide-react";

type Cycle = "DAILY" | "WEEKLY" | "MONTHLY";

export interface PayrollConfigRow {
  id: string;
  employeeId: string;
  cycle: Cycle;
  baseRate: number;
  allowance: number | null;
  deduction: number | null;
  effectiveFrom: string;
  notes: string | null;
  employee: { id: string; employeeId: string; name: string; position: string; status: string };
}

export interface PayrollRunRow {
  id: string;
  runNumber: string;
  employeeId: string;
  cycle: Cycle;
  periodStart: string;
  periodEnd: string;
  daysWorked: number;
  baseAmount: number;
  allowance: number;
  deduction: number;
  netAmount: number;
  status: "PENDING" | "PROCESSED" | "PAID" | "CANCELLED";
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
  employee: { id: string; employeeId: string; name: string; position: string };
  createdBy?: { id: string; name: string } | null;
}

interface Props {
  configs: PayrollConfigRow[];
  runs: PayrollRunRow[];
  summary: {
    pendingCount: number;
    pendingTotal: number;
    paidThisMonthTotal: number;
    byCycle: { cycle: string; count: number }[];
  };
  employees: { id: string; employeeId: string; name: string; position: string }[];
  userRole: string;
}

const CYCLES: { value: Cycle; label: string; hint: string }[] = [
  { value: "DAILY", label: "Daily", hint: "rate is paid per working day" },
  { value: "WEEKLY", label: "Weekly", hint: "rate is paid per calendar week" },
  { value: "MONTHLY", label: "Monthly", hint: "rate is paid per calendar month" },
];

const STATUS_STYLE: Record<PayrollRunRow["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// Mirrors computePayrollAmounts on the server (kept pure for client preview)
function previewAmounts(cycle: Cycle, baseRate: number, daysWorked: number, allowance: number, deduction: number, start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null;
  const spanDays = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
  const days = daysWorked > 0 ? daysWorked : spanDays;
  let baseAmount = 0;
  if (cycle === "DAILY") baseAmount = baseRate * days;
  else if (cycle === "WEEKLY") baseAmount = baseRate * (spanDays / 7);
  else {
    const daysInMonth = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
    baseAmount = baseRate * (spanDays / daysInMonth);
  }
  baseAmount = Math.round(baseAmount * 100) / 100;
  const net = Math.max(0, Math.round((baseAmount + allowance - deduction) * 100) / 100);
  return { baseAmount, net, spanDays };
}

export function PayrollClient({ configs, runs, summary, employees, userRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const can = (perm: Permission) => hasPermission(userRole, perm);

  // ---------- config form state ----------
  const [cfgEmployeeId, setCfgEmployeeId] = useState("");
  const [cfgCycle, setCfgCycle] = useState<Cycle>("MONTHLY");
  const [cfgRate, setCfgRate] = useState("");
  const [cfgAllowance, setCfgAllowance] = useState("0");
  const [cfgDeduction, setCfgDeduction] = useState("0");

  // ---------- run form state ----------
  const [runEmployeeId, setRunEmployeeId] = useState("");
  const [runCycle, setRunCycle] = useState<Cycle>("MONTHLY");
  const [runStart, setRunStart] = useState(todayISO(-30));
  const [runEnd, setRunEnd] = useState(todayISO());
  const [runDays, setRunDays] = useState("");
  const [runAllowance, setRunAllowance] = useState("0");
  const [runDeduction, setRunDeduction] = useState("0");
  const [runBaseOverride, setRunBaseOverride] = useState("");

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: `${e.name} (${e.employeeId})` })),
    [employees]
  );

  const configFor = (employeeId: string) => configs.find((c) => c.employeeId === employeeId);

  const runBaseRate = useMemo(() => {
    const override = parseFloat(runBaseOverride);
    if (override > 0) return override;
    return configFor(runEmployeeId)?.baseRate ?? 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runBaseOverride, runEmployeeId, configs]);

  const preview = useMemo(
    () =>
      previewAmounts(
        runCycle,
        runBaseRate,
        parseFloat(runDays) || 0,
        parseFloat(runAllowance) || 0,
        parseFloat(runDeduction) || 0,
        runStart,
        runEnd
      ),
    [runCycle, runBaseRate, runDays, runAllowance, runDeduction, runStart, runEnd]
  );

  function submitConfig() {
    setError("");
    if (!cfgEmployeeId) return setError("Select an employee");
    if (!(parseFloat(cfgRate) > 0)) return setError("Base rate must be positive");
    startTransition(async () => {
      try {
        await upsertPayrollConfig({
          employeeId: cfgEmployeeId,
          cycle: cfgCycle,
          baseRate: parseFloat(cfgRate),
          allowance: parseFloat(cfgAllowance) || 0,
          deduction: parseFloat(cfgDeduction) || 0,
        });
        setCfgEmployeeId(""); setCfgRate(""); setCfgAllowance("0"); setCfgDeduction("0");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save payroll configuration");
      }
    });
  }

  function submitRun() {
    setError("");
    if (!runEmployeeId) return setError("Select an employee");
    if (!preview) return setError("Invalid pay period (end must be on or after start)");
    if (runBaseRate <= 0) return setError("No pay rate — set a payroll configuration for this employee first");
    startTransition(async () => {
      try {
        await createPayrollRun({
          employeeId: runEmployeeId,
          cycle: runCycle,
          periodStart: runStart,
          periodEnd: runEnd,
          daysWorked: parseFloat(runDays) || 0,
          allowance: parseFloat(runAllowance) || 0,
          deduction: parseFloat(runDeduction) || 0,
          baseRateOverride: parseFloat(runBaseOverride) || null,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create payroll run");
      }
    });
  }

  function act(fn: () => Promise<unknown>, fallback: string) {
    setError("");
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : fallback);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-muted-foreground">Daily, weekly or monthly pay cycles with per-employee rates and payroll runs.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending Runs</p>
            <p className="text-2xl font-bold truncate" title={String(summary.pendingCount)}>{summary.pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending Total</p>
            <p className="text-2xl font-bold truncate" title={formatCurrency(summary.pendingTotal)}>{formatCurrency(summary.pendingTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid This Month</p>
            <p className="text-2xl font-bold truncate" title={formatCurrency(summary.paidThisMonthTotal)}>{formatCurrency(summary.paidThisMonthTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pay Cycles In Use</p>
            <p className="text-sm font-medium mt-1">
              {summary.byCycle.map((c) => `${c.count} ${String(c.cycle).toLowerCase()}`).join(" · ") || "None configured"}
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
      )}

      {can("payroll:create") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Payroll Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label>Employee</Label>
                <Select value={cfgEmployeeId} onChange={(e) => setCfgEmployeeId(e.target.value)} options={[{ value: "", label: "— Select —" }, ...employeeOptions]} />
              </div>
              <div className="space-y-1">
                <Label>Cycle</Label>
                <Select value={cfgCycle} onChange={(e) => setCfgCycle(e.target.value as Cycle)} options={CYCLES.map((c) => ({ value: c.value, label: c.label }))} />
              </div>
              <div className="space-y-1">
                <Label>Base Rate (GH₵ / {cfgCycle.toLowerCase().replace("ly", "y")})</Label>
                <Input type="number" step="0.01" min="0" value={cfgRate} onChange={(e) => setCfgRate(e.target.value)} placeholder="e.g. 80" />
              </div>
              <div className="space-y-1">
                <Label>Allowance</Label>
                <Input type="number" step="0.01" min="0" value={cfgAllowance} onChange={(e) => setCfgAllowance(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Deduction</Label>
                <Input type="number" step="0.01" min="0" value={cfgDeduction} onChange={(e) => setCfgDeduction(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Rate meaning — {CYCLES.find((c) => c.value === cfgCycle)?.hint}. Saving overwrites the employee&apos;s existing configuration.
            </p>
            <Button className="mt-3" onClick={submitConfig} disabled={isPending}>
              <Plus className="h-4 w-4 mr-1" /> {cfgEmployeeId && configFor(cfgEmployeeId) ? "Update Configuration" : "Set Configuration"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee Pay Settings ({configs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="p-2">Employee</th>
                  <th className="p-2">Cycle</th>
                  <th className="p-2 text-right">Base Rate</th>
                  <th className="p-2 text-right">Allowance</th>
                  <th className="p-2 text-right">Deduction</th>
                  <th className="p-2">Effective</th>
                  {can("payroll:delete") && <th className="p-2 w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">
                      <span className="font-medium">{c.employee.name}</span>{" "}
                      <span className="text-muted-foreground">({c.employee.employeeId})</span>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="capitalize">{c.cycle.toLowerCase()}</Badge>
                    </td>
                    <td className="p-2 text-right font-medium">{formatCurrency(c.baseRate)}</td>
                    <td className="p-2 text-right">{c.allowance ? formatCurrency(c.allowance) : "—"}</td>
                    <td className="p-2 text-right">{c.deduction ? formatCurrency(c.deduction) : "—"}</td>
                    <td className="p-2">{formatDate(c.effectiveFrom)}</td>
                    {can("payroll:delete") && (
                      <td className="p-2">
                        <Button size="sm" variant="ghost" title="Remove configuration" disabled={isPending}
                          onClick={() => act(() => deletePayrollConfig(c.id), "Failed to remove configuration")}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {configs.length === 0 && <p className="text-center py-6 text-muted-foreground">No pay settings configured yet.</p>}
          </div>
        </CardContent>
      </Card>

      {can("payroll:create") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> New Payroll Run
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Employee</Label>
                <Select
                  value={runEmployeeId}
                  onChange={(e) => {
                    setRunEmployeeId(e.target.value);
                    const cfg = configFor(e.target.value);
                    if (cfg) setRunCycle(cfg.cycle);
                  }}
                  options={[{ value: "", label: "— Select —" }, ...employeeOptions]}
                />
              </div>
              <div className="space-y-1">
                <Label>Cycle</Label>
                <Select value={runCycle} onChange={(e) => setRunCycle(e.target.value as Cycle)} options={CYCLES.map((c) => ({ value: c.value, label: c.label }))} />
              </div>
              <div className="space-y-1">
                <Label>Period Start</Label>
                <Input type="date" value={runStart} onChange={(e) => setRunStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Period End</Label>
                <Input type="date" value={runEnd} onChange={(e) => setRunEnd(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Days Worked (0 = full period)</Label>
                <Input type="number" min="0" step="0.5" value={runDays} onChange={(e) => setRunDays(e.target.value)} placeholder={String(preview?.spanDays ?? "")} />
              </div>
              <div className="space-y-1">
                <Label>Allowance</Label>
                <Input type="number" min="0" step="0.01" value={runAllowance} onChange={(e) => setRunAllowance(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Deduction</Label>
                <Input type="number" min="0" step="0.01" value={runDeduction} onChange={(e) => setRunDeduction(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Base Rate Override</Label>
                <Input type="number" min="0" step="0.01" value={runBaseOverride} onChange={(e) => setRunBaseOverride(e.target.value)}
                  placeholder={runBaseRate > 0 ? String(runBaseRate) : "from config"} />
              </div>
            </div>

            {preview && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
                <span>Period: <b>{preview.spanDays}</b> days</span>
                <span>Base: <b>{formatCurrency(preview.baseAmount)}</b></span>
                <span>Allowance: {formatCurrency(parseFloat(runAllowance) || 0)}</span>
                <span>Deduction: {formatCurrency(parseFloat(runDeduction) || 0)}</span>
                <span>Net pay: <b className="text-emerald-700">{formatCurrency(preview.net)}</b></span>
              </div>
            )}

            <Button onClick={submitRun} disabled={isPending}>
              <CreditCard className="h-4 w-4 mr-1" /> Create Payroll Run
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Runs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payroll Runs ({runs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="p-2">Run #</th>
                  <th className="p-2">Employee</th>
                  <th className="p-2">Cycle</th>
                  <th className="p-2">Period</th>
                  <th className="p-2 text-right">Net Pay</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Date</th>
                  {(can("payroll:edit") || can("payroll:delete")) && <th className="p-2 w-36">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{r.runNumber}</td>
                    <td className="p-2">{r.employee.name}</td>
                    <td className="p-2 capitalize">{r.cycle.toLowerCase()}</td>
                    <td className="p-2 text-xs">{formatDate(r.periodStart)} → {formatDate(r.periodEnd)}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(r.netAmount)}</td>
                    <td className="p-2">
                      <Badge variant="outline" className={STATUS_STYLE[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="p-2 text-xs">{r.paidDate ? formatDate(r.paidDate) : formatDate(r.createdAt)}</td>
                    {(can("payroll:edit") || can("payroll:delete")) && (
                      <td className="p-2">
                        <div className="flex gap-1">
                          {can("payroll:edit") && r.status !== "PAID" && r.status !== "CANCELLED" && (
                            <>
                              <Button size="sm" variant="outline" title="Mark as paid (records salary payment)" disabled={isPending}
                                onClick={() => act(() => markPayrollRunPaid(r.id, { recordExpense: true }), "Failed to mark paid")}>
                                Mark Paid
                              </Button>
                              <Button size="sm" variant="ghost" title="Cancel run" disabled={isPending}
                                onClick={() => act(() => cancelPayrollRun(r.id), "Failed to cancel run")}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {can("payroll:delete") && r.status !== "PAID" && (
                            <Button size="sm" variant="ghost" title="Delete run" disabled={isPending}
                              onClick={() => {
                                if (confirm(`Delete payroll run ${r.runNumber}?`)) act(() => deletePayrollRun(r.id), "Failed to delete run");
                              }}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {runs.length === 0 && <p className="text-center py-6 text-muted-foreground">No payroll runs yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
