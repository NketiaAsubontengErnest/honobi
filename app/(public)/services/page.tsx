import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function PublicServicesPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Services</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          From custom furniture to complete renovations, we offer a full range of carpentry and woodworking services.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service: typeof services[0]) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              {service.image && (
                <div className="w-full h-40 bg-muted rounded-md mb-2 overflow-hidden">
                  <img src={service.image} alt={service.name} className="object-cover w-full h-full" />
                </div>
              )}
              <CardTitle>{service.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{service.description}</p>
              <Link
                href="/quote"
                className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
              >
                Request a Quote →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
