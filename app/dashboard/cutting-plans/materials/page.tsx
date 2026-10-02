import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getCuttingMaterials } from "@/actions/cutting-materials";
import { MaterialsClient } from "./materials-client";

export const dynamic = "force-dynamic";

export default async function CuttingMaterialsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (!hasPermission(role, "cuttingPlans:view")) redirect("/dashboard");

  const materials = await getCuttingMaterials();
  return (
    <MaterialsClient
      materials={materials}
      canCreate={hasPermission(role, "cuttingPlans:create")}
      canEdit={hasPermission(role, "cuttingPlans:edit")}
      canDelete={hasPermission(role, "cuttingPlans:delete")}
    />
  );
}
