import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Keeps a material's stock in line with the plan. The plan "owns" stockDeducted sheets:
 * saving again only moves the difference, switching material returns the old stock first,
 * and archiving a plan gives its sheets back.
 */
export async function syncStock(tx: Tx, planId: string, previous: { materialId: string | null; stockDeducted: number }) {
  const plan = await tx.cuttingPlan.findUnique({
    where: { id: planId },
    select: { materialId: true, deductStock: true, boardsUsed: true, isActive: true },
  });
  if (!plan) return;

  let already = previous.stockDeducted;
  if (already > 0 && previous.materialId && previous.materialId !== plan.materialId) {
    await tx.cuttingMaterial.update({ where: { id: previous.materialId }, data: { quantity: { increment: already } } });
    already = 0;
  }

  const want = plan.deductStock && plan.materialId && plan.isActive ? plan.boardsUsed ?? 0 : 0;
  const delta = want - already;
  if (plan.materialId && delta !== 0) {
    if (delta > 0) {
      const material = await tx.cuttingMaterial.findUnique({ where: { id: plan.materialId } });
      if (!material) throw new Error("The selected material no longer exists");
      if (material.quantity < delta) {
        throw new Error(`Not enough stock of ${material.name}: ${material.quantity} in stock, ${delta} more needed`);
      }
    }
    await tx.cuttingMaterial.update({ where: { id: plan.materialId }, data: { quantity: { increment: -delta } } });
  }
  await tx.cuttingPlan.update({ where: { id: planId }, data: { stockDeducted: want } });
}

