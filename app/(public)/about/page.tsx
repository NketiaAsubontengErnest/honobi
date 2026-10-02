import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AboutPage() {
  const settings = await prisma.setting.findMany({ where: { isActive: true, key: { in: ["business_name", "business_description"] } } });
  const settingsMap: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => { settingsMap[s.key] = s.value; });

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About {settingsMap.business_name ?? "HONOBi WOOD JOINERY"}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {settingsMap.business_description ?? "We are a passionate team of skilled carpenters dedicated to crafting beautiful, durable furniture and delivering top-quality woodwork across Ghana."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To provide exceptional carpentry services and custom furniture that transforms spaces and brings our clients&apos; visions to life.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Our Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To become Ghana&apos;s most trusted and innovative carpentry workshop, known for quality craftsmanship and outstanding customer service.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Our Values</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quality craftsmanship, integrity, innovation, customer satisfaction, and community impact guide everything we do.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="prose max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <p className="text-muted-foreground mb-4">
          Founded with a simple vision to bring quality woodwork to every Ghanaian home and business, {settingsMap.business_name ?? "HONOBi WOOD JOINERY"} has grown from a small workshop to a full-service carpentry business serving clients across the region.
        </p>
        <p className="text-muted-foreground mb-4">
          Our team of experienced carpenters combines traditional woodworking techniques with modern design sensibilities to create furniture and fixtures that are both beautiful and built to last.
        </p>
        <p className="text-muted-foreground">
          From custom furniture for your home to complete office fitouts, we approach every project with the same dedication to excellence and attention to detail.
        </p>
      </div>
    </div>
  );
}
