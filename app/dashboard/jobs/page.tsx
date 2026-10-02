import { requireAuth } from "@/lib/auth/session";
import { getJobs } from "@/actions/jobs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string }> }) {
  await requireAuth();
  const params = await searchParams;
  const { jobs, total, page, limit, totalPages } = await getJobs({ page: Number(params.page) || 1, limit: 20, search: params.search || "", status: params.status || "" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">{total} total jobs</p>
        </div>
        <Link href="/dashboard/jobs/new"><Button className="gap-2">+ New Job</Button></Link>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">Job</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Cost</th>
              <th className="p-3 text-left">Balance</th>
              <th className="p-3 text-left">Due</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b hover:bg-muted/30">
                <td className="p-3"><div className="font-medium">{job.title}</div><div className="text-xs text-muted-foreground">{job.jobNumber}</div></td>
                <td className="p-3">{job.customer.name}</td>
                <td className="p-3"><Badge variant={job.status === "COMPLETED" ? "success" : job.status === "IN_PROGRESS" ? "info" : job.status === "CANCELLED" ? "destructive" : "secondary"}>{job.status.replace("_", " ")}</Badge></td>
                <td className="p-3">{job.estimatedCost ? formatCurrency(Number(job.estimatedCost)) : "-"}</td>
                <td className="p-3">{formatCurrency(Number(job.balance))}</td>
                <td className="p-3">{job.expectedCompletion ? formatDate(job.expectedCompletion) : "-"}</td>
                <td className="p-3"><Link href={`/dashboard/jobs/${job.id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link></td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No jobs found</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/dashboard/jobs?page=${page - 1}`}><Button variant="outline" size="sm">Previous</Button></Link>}
            {page < totalPages && <Link href={`/dashboard/jobs?page=${page + 1}`}><Button variant="outline" size="sm">Next</Button></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
