import { getSuppliers } from "@/actions/suppliers";
import { SuppliersClient } from "./suppliers-client";

export default async function SuppliersPage() {
  const { suppliers } = await getSuppliers({ page: 1, limit: 100 });
  return <SuppliersClient suppliers={suppliers} />;
}
