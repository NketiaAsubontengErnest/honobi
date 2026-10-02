import { getSite } from "@/lib/site";
import { ContactView } from "@/components/public/contact-view";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const site = await getSite();
  return <ContactView site={site} />;
}
