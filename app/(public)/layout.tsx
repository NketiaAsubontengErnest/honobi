import Link from "next/link";
import { site } from "@/lib/site";
import { PublicNavbar } from "@/components/public/navbar";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                H
              </div>
              <span className="font-bold">HONOBI WOOD JOINERY</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Crafting excellence in wood. Custom furniture, cabinets, and carpentry solutions for Ghana&apos;s finest homes and offices.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">Products</Link></li>
              <li><Link href="/projects" className="hover:text-foreground">Projects</Link></li>
              <li><Link href="/services" className="hover:text-foreground">Services</Link></li>
              <li><Link href="/quote" className="hover:text-foreground">Request Quote</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{site.phone}</li>
              <li>{site.email}</li>
              <li>{site.address}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Business Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Mon - Fri: 8:00 AM - 6:00 PM</li>
              <li>Saturday: 9:00 AM - 4:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HONOBI WOOD JOINERY. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
