import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const site = await getSite();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        userName={session.user.name || "User"}
        userRole={session.user.role || "STAFF"}
        logoUrl={site.logoUrl}
      />
      <main className="min-w-0 flex-1 pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
