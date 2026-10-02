import { prisma } from "@/lib/db/prisma";
import { site } from "@/lib/site";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Star, Phone, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredProducts, featuredProjects, services, testimonials, stats] = await Promise.all([
    prisma.product.findMany({ where: { isFeatured: true, isPublic: true, isActive: true, status: { not: "DISCONTINUED" } }, take: 4, include: { images: { take: 1 } } }),
    prisma.project.findMany({ where: { isFeatured: true, isPublic: true, isActive: true, status: "COMPLETED" }, take: 3, include: { images: { take: 1 } } }),
    prisma.service.findMany({ where: { isFeatured: true, isPublic: true, isActive: true }, take: 6, orderBy: { order: "asc" } }),
    prisma.testimonial.findMany({ where: { isApproved: true, isPublic: true, isActive: true, isFeatured: true }, take: 3 }),
    Promise.all([
      prisma.project.count({ where: { status: "COMPLETED", isActive: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true, status: { not: "DISCONTINUED" } } }),
    ]).then(([projects, customers, products]) => ({ projects, customers, products })),
  ]);

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">Custom Furniture & Carpentry</Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
              Crafting Excellence in Wood
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Premium custom furniture, kitchen cabinets, wardrobes, and carpentry solutions for Ghana&apos;s finest homes and offices. Quality craftsmanship, delivered on time.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/quote">
                <Button size="lg" className="gap-2">
                  Request a Quote <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline">View Our Projects</Button>
              </Link>
              <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="ghost" className="gap-2 text-green-600 hover:text-green-700">
                  <MessageCircle className="h-4 w-4" /> WhatsApp Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{stats.projects}+</p>
              <p className="text-sm text-muted-foreground">Projects Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.customers}+</p>
              <p className="text-sm text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.products}+</p>
              <p className="text-sm text-muted-foreground">Products Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Our Services</h2>
            <p className="mt-2 text-muted-foreground">From custom furniture to complete renovations</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services">
              <Button variant="outline" className="gap-2">View All Services <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <p className="mt-2 text-muted-foreground">Handcrafted furniture and woodwork</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {product.images[0] ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <span className="text-4xl">🪵</span>
                    </div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  {product.showPrice && <p className="text-primary font-bold mt-1">{formatCurrency(Number(product.price))}</p>}
                  <Link href={`/products/${product.slug}`} className="block mt-2">
                    <Button variant="outline" size="sm" className="w-full">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/products">
              <Button variant="outline" className="gap-2">Browse All Products <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Our Projects</h2>
            <p className="mt-2 text-muted-foreground">Showcasing our craftsmanship</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {project.coverImage ? (
                    <img src={project.coverImage} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                      <span className="text-3xl">🏗️</span>
                    </div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <Badge variant="secondary" className="mb-2">{project.location || "Ghana"}</Badge>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                  <Link href={`/projects/${project.slug}`} className="block mt-3">
                    <Button variant="ghost" size="sm" className="gap-1">View Project <ArrowRight className="h-3 w-3" /></Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">&ldquo;{t.testimonial}&rdquo;</p>
                  <div className="mt-4">
                    <p className="font-semibold text-sm">{t.customerName}</p>
                    <p className="text-xs text-muted-foreground">{t.customerRole}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Start Your Project?</h2>
          <p className="mt-2 text-primary-foreground/80 max-w-2xl mx-auto">
            Contact us today for a free consultation and quotation. We bring your vision to life with quality craftsmanship.
          </p>
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <Link href="/quote">
              <Button size="lg" variant="secondary">Get a Free Quote</Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
