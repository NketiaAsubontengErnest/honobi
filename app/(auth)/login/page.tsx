import { getSite } from "@/lib/site";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const site = await getSite();
  return <LoginForm logoUrl={site.logoUrl} name={site.name} />;
}
