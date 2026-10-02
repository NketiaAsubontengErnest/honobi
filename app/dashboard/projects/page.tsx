import { requireAuth } from "@/lib/auth/session";
import { getProjects } from "@/actions/projects";
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string }> }) {
  await requireAuth();
  const params = await searchParams;
  const { projects, total, page, limit, totalPages } = await getProjects({ page: Number(params.page) || 1, limit: 20, search: params.search || "", status: params.status || "" });
  return <ProjectsClient projects={JSON.parse(JSON.stringify(projects))} total={total} page={page} limit={limit} totalPages={totalPages} />;
}
