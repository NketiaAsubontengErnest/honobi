import { notFound } from "next/navigation";
import { getServiceById, getServiceCategories } from "@/actions/services";
import { ServiceForm } from "../../new/service-form";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [service, categories] = await Promise.all([getServiceById(id), getServiceCategories()]);
  if (!service) notFound();

  return (
    <ServiceForm
      categories={categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))}
      initial={{
        id: service.id,
        name: service.name,
        categoryId: service.categoryId ?? "",
        order: service.order,
        image: service.image ?? "",
        icon: service.icon ?? "",
        description: service.description ?? "",
        isFeatured: service.isFeatured,
        isPublic: service.isPublic,
      }}
    />
  );
}
