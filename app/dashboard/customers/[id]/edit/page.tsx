import { notFound } from "next/navigation";
import { getCustomerById } from "@/actions/customers";
import { CustomerEditForm } from "./customer-edit-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) notFound();

  return (
    <CustomerEditForm
      customerId={customer.id}
      initialData={{
        name: customer.name,
        phone: customer.phone,
        altPhone: customer.altPhone ?? "",
        email: customer.email ?? "",
        address: customer.address ?? "",
        city: customer.city ?? "",
        region: customer.region ?? "",
        notes: customer.notes ?? "",
      }}
    />
  );
}
