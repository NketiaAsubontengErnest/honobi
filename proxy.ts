import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { hasPermission, type Permission } from "@/lib/permissions";

// Dashboard route prefix -> permission resource. A route is allowed when the
// user's role has "<resource>:view" ("<resource>:create" for /new and
// "<resource>:edit" for /edit). Routes not listed need only a valid session.
const ROUTE_RESOURCES: Record<string, string> = {
  "/dashboard/customers": "customers",
  "/dashboard/quotations": "quotations",
  "/dashboard/jobs": "jobs",
  "/dashboard/invoices": "invoices",
  "/dashboard/payments": "payments",
  "/dashboard/products": "products",
  "/dashboard/projects": "projects",
  "/dashboard/services": "services",
  "/dashboard/cutting-plans": "cuttingPlans",
  "/dashboard/income": "income",
  "/dashboard/expenses": "expenses",
  "/dashboard/finance": "finance",
  "/dashboard/reports": "reports",
  "/dashboard/inventory": "inventory",
  "/dashboard/suppliers": "suppliers",
  "/dashboard/employees": "employees",
  "/dashboard/payroll": "payroll",
  "/dashboard/media": "media",
  "/dashboard/testimonials": "testimonials",
  "/dashboard/messages": "messages",
  "/dashboard/notifications": "notifications",
  "/dashboard/users": "users",
  "/dashboard/audit-logs": "audit",
  "/dashboard/settings": "settings",
};

function isRoleAllowed(pathname: string, role: string | undefined): boolean {
  if (!role) return false;
  for (const [prefix, resource] of Object.entries(ROUTE_RESOURCES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      let action = "view";
      if (/\/new\/?$/.test(pathname)) action = "create";
      else if (/\/edit\/?$/.test(pathname)) action = "edit";
      return hasPermission(role, `${resource}:${action}` as Permission);
    }
  }
  return true; // not a restricted route — any authenticated role passes
}

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname, search } = req.nextUrl;

  // Not signed in -> go to login, remembering where they were headed
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Signed in but role not allowed for this area -> back to the dashboard home
  if (!isRoleAllowed(pathname, token.role as string | undefined)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
