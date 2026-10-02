"use client";

import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getPermissions, type Permission } from "@/lib/permissions";
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Package,
  Image,
  Wrench,
  Boxes,
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserCheck,
  Wallet,
  Star,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Images,
  Receipt,
  CreditCard,
  ScrollText,
  Scissors,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: Permission;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> }],
  },
  {
    label: "Sales & Customers",
    items: [
      { label: "Customers", href: "/dashboard/customers", icon: <Users className="h-4 w-4" />, permission: "customers:view" },
      { label: "Quotations", href: "/dashboard/quotations", icon: <FileText className="h-4 w-4" />, permission: "quotations:view" },
      { label: "Jobs", href: "/dashboard/jobs", icon: <Briefcase className="h-4 w-4" />, permission: "jobs:view" },
      { label: "Invoices", href: "/dashboard/invoices", icon: <Receipt className="h-4 w-4" />, permission: "invoices:view" },
      { label: "Payments", href: "/dashboard/payments", icon: <CreditCard className="h-4 w-4" />, permission: "payments:view" },
    ],
  },
  {
    label: "Products & Projects",
    items: [
      { label: "Products", href: "/dashboard/products", icon: <Package className="h-4 w-4" />, permission: "products:view" },
      { label: "Projects", href: "/dashboard/projects", icon: <Image className="h-4 w-4" />, permission: "projects:view" },
      { label: "Services", href: "/dashboard/services", icon: <Wrench className="h-4 w-4" />, permission: "services:view" },
      { label: "Cutting Plans", href: "/dashboard/cutting-plans", icon: <Scissors className="h-4 w-4" />, permission: "cuttingPlans:view" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Income", href: "/dashboard/income", icon: <TrendingUp className="h-4 w-4" />, permission: "income:view" },
      { label: "Expenses", href: "/dashboard/expenses", icon: <TrendingDown className="h-4 w-4" />, permission: "expenses:view" },
      { label: "Finance", href: "/dashboard/finance", icon: <DollarSign className="h-4 w-4" />, permission: "finance:view" },
      { label: "Reports", href: "/dashboard/reports", icon: <BarChart3 className="h-4 w-4" />, permission: "reports:view" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Inventory", href: "/dashboard/inventory", icon: <Boxes className="h-4 w-4" />, permission: "inventory:view" },
      { label: "Suppliers", href: "/dashboard/suppliers", icon: <Truck className="h-4 w-4" />, permission: "suppliers:view" },
    ],
  },
  {
    label: "Staff",
    items: [
      { label: "Employees", href: "/dashboard/employees", icon: <UserCheck className="h-4 w-4" />, permission: "employees:view" },
      { label: "Payroll", href: "/dashboard/payroll", icon: <Wallet className="h-4 w-4" />, permission: "payroll:view" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Media", href: "/dashboard/media", icon: <Images className="h-4 w-4" />, permission: "media:view" },
      { label: "Testimonials", href: "/dashboard/testimonials", icon: <Star className="h-4 w-4" />, permission: "testimonials:view" },
      { label: "Messages", href: "/dashboard/messages", icon: <MessageSquare className="h-4 w-4" />, permission: "messages:view" },
      { label: "Notifications", href: "/dashboard/notifications", icon: <Bell className="h-4 w-4" />, permission: "notifications:view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/dashboard/users", icon: <Users className="h-4 w-4" />, permission: "users:view" },
      { label: "Audit Logs", href: "/dashboard/audit-logs", icon: <ScrollText className="h-4 w-4" />, permission: "audit:view" },
      { label: "Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, permission: "settings:view" },
    ],
  },
];

/** Exact match for /dashboard, prefix match (with path boundary) for everything else
 *  so /dashboard/customers/new still marks "Customers" active. */
function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({ userName, userRole, logoUrl }: { userName: string; userRole: string; logoUrl?: string | null }) {
  const pathname = usePathname();
  const allowed = getPermissions(userRole);

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || allowed.includes(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  // Groups containing the active route (always expanded)
  const activeGroupLabels = visibleGroups
    .filter((g) => g.items.some((item) => isActiveHref(pathname, item.href)))
    .map((g) => g.label);

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() =>
    Array.from(new Set(["Overview", "Sales & Customers", ...activeGroupLabels]))
  );

  // Keep the active group expanded while navigating (adjust state during render, not in an effect)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    const missing = activeGroupLabels.filter((g) => !expandedGroups.includes(g));
    if (missing.length) setExpandedGroups([...expandedGroups, ...missing]);
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandLogo url={logoUrl} className="h-8" fallbackClassName="h-8 w-8 text-sm" />
          {!logoUrl && <span className="font-semibold text-lg">HONOBI</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-1">
        {visibleGroups.map((group) => {
          const groupHasActive = activeGroupLabels.includes(group.label);
          const expanded = expandedGroups.includes(group.label);
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground",
                  groupHasActive && !expanded && "text-foreground"
                )}
              >
                {group.label}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              </button>
              {expanded && (
                <div className="ml-2 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isActiveHref(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole.replace("_", " ").toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden print:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandLogo url={logoUrl} className="h-8" fallbackClassName="h-8 w-8 text-sm" />
          {!logoUrl && <span className="font-semibold">HONOBI</span>}
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden print:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-background border-r transition-transform lg:hidden print:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:self-start lg:flex-col lg:border-r lg:bg-background print:hidden">
        {sidebarContent}
      </aside>
    </>
  );
}
