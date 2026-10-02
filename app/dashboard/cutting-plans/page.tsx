import { prisma } from "@/lib/db/prisma";
import { getCuttingPlans } from "@/actions/cutting-plans";
import { CuttingPlansClient } from "./cutting-plans-client";

export const dynamic = "force-dynamic";

export default async function CuttingPlansPage() {
  const [{ plans }, projects, jobs] = await Promise.all([
    getCuttingPlans(),
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
  ]);

  return <CuttingPlansClient plans={plans} projects={projects} jobs={jobs} />;
}
