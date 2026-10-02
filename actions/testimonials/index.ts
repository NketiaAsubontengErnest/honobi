"use server";

import { prisma } from "@/lib/db/prisma";
import { requirePermissionServer } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions";
import { testimonialSchema } from "@/lib/validation/schemas";

export async function getTestimonials(options?: { featured?: boolean; approved?: boolean }) {
  await requirePermissionServer("testimonials:view");
  const where: { isActive: boolean; isFeatured?: boolean; isApproved?: boolean } = { isActive: true };
  if (options?.featured) where.isFeatured = true;
  if (options?.approved) where.isApproved = true;
  return prisma.testimonial.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTestimonial(data: {
  customerName: string;
  customerRole?: string;
  testimonial: string;
  customerImage?: string;
  rating?: number;
  isFeatured?: boolean;
  isApproved?: boolean;
  customerId?: string;
}) {
  const user = await requirePermissionServer("testimonials:create");
  const parsed = testimonialSchema.parse(data);
  // Publishing flags require the approve permission
  const canApprove = hasPermission(user.role, "testimonials:approve");

  return prisma.testimonial.create({
    data: {
      customerName: parsed.customerName,
      customerRole: parsed.customerRole || null,
      testimonial: parsed.testimonial,
      customerImage: parsed.customerImage || null,
      rating: parsed.rating,
      isFeatured: canApprove ? parsed.isFeatured : false,
      isApproved: canApprove ? parsed.isApproved : false,
      customerId: data.customerId || null,
    },
  });
}

export async function updateTestimonial(
  id: string,
  data: {
    customerName?: string;
    customerRole?: string;
    testimonial?: string;
    rating?: number;
    isFeatured?: boolean;
    isApproved?: boolean;
  }
) {
  const user = await requirePermissionServer("testimonials:edit");
  const { isFeatured, isApproved, ...rest } = testimonialSchema.partial().parse(data);
  const canApprove = hasPermission(user.role, "testimonials:approve");

  return prisma.testimonial.update({
    where: { id },
    data: {
      ...(rest.customerName !== undefined && { customerName: rest.customerName }),
      ...(rest.customerRole !== undefined && { customerRole: rest.customerRole || null }),
      ...(rest.testimonial !== undefined && { testimonial: rest.testimonial }),
      ...(rest.rating !== undefined && { rating: rest.rating }),
      ...(canApprove && isFeatured !== undefined && { isFeatured }),
      ...(canApprove && isApproved !== undefined && { isApproved }),
    },
  });
}

export async function deleteTestimonial(id: string) {
  await requirePermissionServer("testimonials:delete");
  return prisma.testimonial.update({ where: { id }, data: { isActive: false } });
}
