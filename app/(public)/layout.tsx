import Link from "next/link";
import { getSite, type SiteInfo } from "@/lib/site";
import { PublicNavbar } from "@/components/public/navbar";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSite();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter site={site} />
    </div>
  );
}

function PublicFooter({ site }: { site: SiteInfo }) {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                H
              </div>
              <span className="font-bold">{site.name}</span>
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
              {site.phone && <li>{site.phone}</li>}
              {site.email && <li>{site.email}</li>}
              {site.address && <li>{site.address}</li>}
              {site.whatsappUrl && (
                <li><a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">WhatsApp</a></li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Business Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Mon - Fri: {site.hours.monFri}</li>
              <li>Saturday: {site.hours.saturday}</li>
              <li>Sunday: {site.hours.sunday}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          {(site.social.facebook || site.social.instagram || site.social.tiktok) && (
            <p className="mb-2 space-x-4">
              {site.social.facebook && <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Facebook</a>}
              {site.social.instagram && <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Instagram</a>}
              {site.social.tiktok && <a href={site.social.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">TikTok</a>}
            </p>
          )}
          <p>&copy; {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
