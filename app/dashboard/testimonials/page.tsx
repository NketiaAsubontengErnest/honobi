import { getTestimonials } from "@/actions/testimonials";
import { TestimonialsClient } from "./testimonials-client";

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();
  const serialized = testimonials.map((t: typeof testimonials[0]) => ({
    id: t.id,
    customerName: t.customerName,
    customerRole: t.customerRole,
    testimonial: t.testimonial,
    rating: t.rating,
    isFeatured: t.isFeatured,
    isApproved: t.isApproved,
    createdAt: t.createdAt.toISOString(),
  }));
  return <TestimonialsClient testimonials={serialized} />;
}
