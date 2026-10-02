"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { generateNumber } from "@/lib/utils";

export async function getEmployees(options?: { search?: string; position?: string }) {
  await requirePermissionServer("employees:view");
  const where: any = { isActive: true };
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { employeeId: { contains: options.search, mode: "insensitive" } },
    ];
  }
  if (options?.position) {
    where.position = options.position;
  }
  return prisma.employee.findMany({ where, orderBy: { name: "asc" } });
}

export async function getEmployeeById(id: string) {
  await requirePermissionServer("employees:view");
  return prisma.employee.findUnique({
    where: { id },
    include: { salaryPayments: { orderBy: { date: "desc" }, take: 12 } },
  });
}

export async function createEmployee(data: {
  name: string;
  phone?: string;
  email?: string;
  position: string;
  salary?: number;
  hireDate?: Date;
  address?: string;
  emergencyContact?: string;
}) {
  await requirePermissionServer("employees:create");
  const employeeId = generateNumber("EMP");
  return prisma.employee.create({
    data: {
      employeeId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      position: data.position as never,
      salary: data.salary,
      hireDate: data.hireDate,
      address: data.address,
      emergencyContact: data.emergencyContact,
    },
  });
}

export async function updateEmployee(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    position?: string;
    salary?: number;
    hireDate?: Date;
    status?: string;
    address?: string;
    emergencyContact?: string;
  }
) {
  await requirePermissionServer("employees:edit");
  return prisma.employee.update({ where: { id }, data: data as never });
}

export async function deleteEmployee(id: string) {
  await requirePermissionServer("employees:delete");
  return prisma.employee.update({ where: { id }, data: { isActive: false } });
}

export async function recordSalaryPayment(data: {
  employeeId: string;
  amount: number;
  date: Date;
  type: string;
  period?: string;
  notes?: string;
}) {
  await requirePermissionServer("employees:edit");
  return prisma.salaryPayment.create({ data });
}

export async function getSalaryPayments(options?: { employeeId?: string; period?: string }) {
  await requirePermissionServer("employees:view");
  const where: any = { isActive: true };
  if (options?.employeeId) where.employeeId = options.employeeId;
  if (options?.period) where.period = options.period;
  return prisma.salaryPayment.findMany({
    where,
    include: { employee: true },
    orderBy: { date: "desc" },
  });
}
