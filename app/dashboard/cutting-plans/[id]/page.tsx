import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getBoardPresets, getCuttingPlanById } from "@/actions/cutting-plans";
import { CuttingPlanForm, type InitialPlanData } from "../cutting-plan-form";

export const dynamic = "force-dynamic";

export default async function CuttingPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.role, "cuttingPlans:view")) {
    redirect("/dashboard");
  }

  const plan = await getCuttingPlanById(id);
  if (!plan) notFound();

  const [projects, jobs, suppliers, presets] = await Promise.all([
    prisma.project.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.job.findMany({
      where: { isActive: true },
      select: { id: true, jobNumber: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getBoardPresets(),
  ]);

  return (
    <CuttingPlanForm
      mode="edit"
      userRole={session.user.role}
      initialData={plan as InitialPlanData}
      projects={projects.map((p: { id: string; name: string }) => ({ value: p.id, label: p.name }))}
      jobs={jobs.map((j: { id: string; jobNumber: string; title: string }) => ({ value: j.id, label: `${j.jobNumber} — ${j.title}` }))}
      suppliers={suppliers.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name }))}
      presets={presets}
    />
  );
}
