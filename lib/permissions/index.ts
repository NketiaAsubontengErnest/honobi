import type { Role } from "@prisma/client";

export type Permission =
  | "customers:view" | "customers:create" | "customers:edit" | "customers:delete"
  | "products:view" | "products:create" | "products:edit" | "products:delete"
  | "projects:view" | "projects:create" | "projects:edit" | "projects:delete"
  | "services:view" | "services:create" | "services:edit" | "services:delete"
  | "quotations:view" | "quotations:create" | "quotations:edit" | "quotations:delete" | "quotations:convert"
  | "jobs:view" | "jobs:create" | "jobs:edit" | "jobs:delete" | "jobs:assign"
  | "invoices:view" | "invoices:create" | "invoices:edit" | "invoices:delete" | "invoices:send"
  | "payments:view" | "payments:create" | "payments:edit" | "payments:delete"
  | "income:view" | "income:create" | "income:edit" | "income:delete"
  | "expenses:view" | "expenses:create" | "expenses:edit" | "expenses:delete"
  | "inventory:view" | "inventory:create" | "inventory:edit" | "inventory:delete" | "inventory:adjust"
  | "suppliers:view" | "suppliers:create" | "suppliers:edit" | "suppliers:delete"
  | "employees:view" | "employees:create" | "employees:edit" | "employees:delete"
  | "payroll:view" | "payroll:create" | "payroll:edit" | "payroll:delete"
  | "reports:view" | "reports:export"
  | "finance:view"
  | "testimonials:view" | "testimonials:create" | "testimonials:edit" | "testimonials:delete" | "testimonials:approve"
  | "messages:view" | "messages:reply" | "messages:delete"
  | "media:view" | "media:upload" | "media:delete"
  | "notifications:view"
  | "users:view" | "users:create" | "users:edit" | "users:delete"
  | "audit:view"
  | "cuttingPlans:view" | "cuttingPlans:create" | "cuttingPlans:edit" | "cuttingPlans:delete" | "cuttingPlans:approve" | "cuttingPlans:print"
  | "settings:view" | "settings:edit";

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "customers:view", "customers:create", "customers:edit", "customers:delete",
    "products:view", "products:create", "products:edit", "products:delete",
    "projects:view", "projects:create", "projects:edit", "projects:delete",
    "services:view", "services:create", "services:edit", "services:delete",
    "quotations:view", "quotations:create", "quotations:edit", "quotations:delete", "quotations:convert",
    "jobs:view", "jobs:create", "jobs:edit", "jobs:delete", "jobs:assign",
    "invoices:view", "invoices:create", "invoices:edit", "invoices:delete", "invoices:send",
    "payments:view", "payments:create", "payments:edit", "payments:delete",
    "income:view", "income:create", "income:edit", "income:delete",
    "expenses:view", "expenses:create", "expenses:edit", "expenses:delete",
    "inventory:view", "inventory:create", "inventory:edit", "inventory:delete", "inventory:adjust",
    "suppliers:view", "suppliers:create", "suppliers:edit", "suppliers:delete",
    "employees:view", "employees:create", "employees:edit", "employees:delete",
    "payroll:view", "payroll:create", "payroll:edit", "payroll:delete",
    "reports:view", "reports:export", "finance:view",
    "testimonials:view", "testimonials:create", "testimonials:edit", "testimonials:delete", "testimonials:approve",
    "messages:view", "messages:reply", "messages:delete",
    "media:view", "media:upload", "media:delete",
    "notifications:view",
    "users:view", "users:create", "users:edit", "users:delete",
    "audit:view", "settings:view", "settings:edit",
    "cuttingPlans:view", "cuttingPlans:create", "cuttingPlans:edit", "cuttingPlans:delete", "cuttingPlans:approve", "cuttingPlans:print",
  ],
  ADMIN: [
    "customers:view", "customers:create", "customers:edit", "customers:delete",
    "products:view", "products:create", "products:edit", "products:delete",
    "projects:view", "projects:create", "projects:edit", "projects:delete",
    "services:view", "services:create", "services:edit", "services:delete",
    "quotations:view", "quotations:create", "quotations:edit", "quotations:delete", "quotations:convert",
    "jobs:view", "jobs:create", "jobs:edit", "jobs:delete", "jobs:assign",
    "invoices:view", "invoices:create", "invoices:edit", "invoices:delete", "invoices:send",
    "payments:view", "payments:create", "payments:edit",
    "income:view", "income:create", "income:edit",
    "expenses:view", "expenses:create", "expenses:edit",
    "inventory:view", "inventory:create", "inventory:edit", "inventory:delete", "inventory:adjust",
    "suppliers:view", "suppliers:create", "suppliers:edit", "suppliers:delete",
    "employees:view", "employees:create", "employees:edit", "employees:delete",
    "payroll:view", "payroll:create", "payroll:edit",
    "reports:view", "reports:export", "finance:view",
    "testimonials:view", "testimonials:create", "testimonials:edit", "testimonials:approve",
    "messages:view", "messages:reply", "messages:delete",
    "media:view", "media:upload", "media:delete",
    "notifications:view",
    "users:view", "users:create", "users:edit",
    "settings:view", "settings:edit",
    "cuttingPlans:view", "cuttingPlans:create", "cuttingPlans:edit", "cuttingPlans:delete", "cuttingPlans:approve", "cuttingPlans:print",
  ],
  MANAGER: [
    "customers:view", "customers:create", "customers:edit",
    "products:view", "products:create", "products:edit",
    "projects:view", "projects:create", "projects:edit",
    "services:view", "services:create", "services:edit",
    "quotations:view", "quotations:create", "quotations:edit", "quotations:convert",
    "jobs:view", "jobs:create", "jobs:edit", "jobs:assign",
    "invoices:view", "invoices:create", "invoices:edit", "invoices:send",
    "payments:view",
    "income:view", "expenses:view",
    "inventory:view", "inventory:create", "inventory:edit", "inventory:adjust",
    "suppliers:view", "suppliers:create", "suppliers:edit",
    "employees:view",
    "payroll:view", "payroll:create", "payroll:edit",
    "reports:view", "finance:view",
    "testimonials:view", "testimonials:create",
    "messages:view", "messages:reply",
    "media:view", "media:upload",
    "notifications:view",
    "cuttingPlans:view", "cuttingPlans:create", "cuttingPlans:edit", "cuttingPlans:approve", "cuttingPlans:print",
  ],
  SECRETARY: [
    "customers:view", "customers:create", "customers:edit",
    "products:view",
    "projects:view",
    "services:view",
    "quotations:view", "quotations:create", "quotations:edit",
    "jobs:view", "jobs:create", "jobs:edit",
    "invoices:view", "invoices:create",
    "payments:view",
    "inventory:view", "suppliers:view", "suppliers:create",
    "employees:view",
    "testimonials:view", "testimonials:create",
    "messages:view", "messages:reply",
    "media:view", "media:upload",
    "notifications:view",
    "cuttingPlans:view", "cuttingPlans:create", "cuttingPlans:edit", "cuttingPlans:print",
  ],
  ACCOUNTANT: [
    "customers:view",
    "quotations:view",
    "jobs:view",
    "invoices:view", "invoices:create", "invoices:edit", "invoices:send",
    "payments:view", "payments:create", "payments:edit",
    "income:view", "income:create", "income:edit",
    "expenses:view", "expenses:create", "expenses:edit",
    "payroll:view", "payroll:create", "payroll:edit", "payroll:delete",
    "reports:view", "reports:export", "finance:view",
    "notifications:view",
    "cuttingPlans:view",
  ],
  STAFF: [
    "customers:view",
    "products:view",
    "projects:view",
    "services:view",
    "quotations:view",
    "jobs:view",
    "inventory:view",
    "notifications:view",
    "media:view",
    "cuttingPlans:view", "cuttingPlans:print",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = rolePermissions[role as Role] || [];
  return permissions.includes(permission);
}

export function getPermissions(role: string): Permission[] {
  return rolePermissions[role as Role] || [];
}

export function requirePermission(user: { role: string }, permission: Permission): boolean {
  return hasPermission(user.role, permission);
}
