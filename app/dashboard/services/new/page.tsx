import { getServiceCategories } from "@/actions/services";
import { ServiceForm } from "./service-form";

export default async function NewServicePage() {
  const categories = await getServiceCategories();

  return (
    <ServiceForm
      categories={categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
    />
  );
}
