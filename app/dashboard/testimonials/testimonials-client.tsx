"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteTestimonial } from "@/actions/testimonials";
import { Star, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type Testimonial = {
  id: string;
  customerName: string;
  customerRole: string | null;
  testimonial: string;
  rating: number;
  isFeatured: boolean;
  isApproved: boolean;
  createdAt: string;
};

export function TestimonialsClient({ testimonials }: { testimonials: Testimonial[] }) {
  const [data, setData] = useState(testimonials);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await deleteTestimonial(id);
    setData((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <Button asChild>
          <Link href="/dashboard/testimonials/new">
            <Plus className="h-4 w-4 mr-2" /> Add Testimonial
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{t.customerName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t.customerRole ?? "Customer"}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic">&ldquo;{t.testimonial}&rdquo;</p>
              <div className="flex gap-2 mt-2">
                {t.isFeatured && <Badge>Featured</Badge>}
                {t.isApproved && <Badge variant="outline">Approved</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
