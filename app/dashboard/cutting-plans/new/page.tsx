import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getBoardPresets } from "@/actions/cutting-plans";
import { getCuttingMaterials } from "@/actions/cutting-materials";
import { CuttingPlanForm } from "../cutting-plan-form";

export const dynamic = "force-dynamic";

export default async function NewCuttingPlanPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.role, "cuttingPlans:create")) {
    redirect("/dashboard/cutting-plans");
  }

  const [projects, jobs, suppliers, presets, materials] = await Promise.all([
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
    getCuttingMaterials(),
  ]);

  return (
    <CuttingPlanForm
      mode="create"
      userRole={session.user.role}
      projects={projects.map((p: { id: string; name: string }) => ({ value: p.id, label: p.name }))}
      jobs={jobs.map((j: { id: string; jobNumber: string; title: string }) => ({ value: j.id, label: `${j.jobNumber} — ${j.title}` }))}
      suppliers={suppliers.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name }))}
      presets={presets}
      materials={materials}
    />
  );
}
