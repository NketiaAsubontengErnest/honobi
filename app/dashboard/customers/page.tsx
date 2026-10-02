import { requireAuth } from "@/lib/auth/session";
import { getCustomers } from "@/actions/customers";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;

  const { customers, total, page, limit, totalPages } = await getCustomers({
    page: Number(params.page) || 1,
    limit: 20,
    search: params.search || "",
  });

  return (
    <CustomersClient
      customers={JSON.parse(JSON.stringify(customers))}
      total={total}
      page={page}
      limit={limit}
      totalPages={totalPages}
    />
  );
}
