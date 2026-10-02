"use server";

import { requirePermissionServer } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { inventoryItemSchema, stockMovementSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { syncStockAlerts } from "@/lib/notifications/stock";

export async function createInventoryItem(formData: FormData) {
  await requirePermissionServer("inventory:create");
  const data = Object.fromEntries(formData.entries());
  const validated = inventoryItemSchema.parse(data);

  const item = await prisma.inventoryItem.create({
    data: {
      name: validated.name,
      sku: validated.sku || null,
      categoryId: validated.categoryId || null,
      unit: validated.unit,
      quantity: String(validated.quantity),
      minStock: String(validated.minStock),
      costPerUnit: String(validated.costPerUnit),
      supplierId: validated.supplierId || null,
      location: validated.location || null,
    },
  });

  await syncStockAlerts(item.id);
  revalidatePath("/dashboard/inventory");
  return { success: true, item: JSON.parse(JSON.stringify(item)) };
}

export async function updateInventoryItem(id: string, formData: FormData) {
  await requirePermissionServer("inventory:edit");
  const data = Object.fromEntries(formData.entries());
  const validated = inventoryItemSchema.parse(data);

  await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: validated.name,
      sku: validated.sku || null,
      categoryId: validated.categoryId || null,
      unit: validated.unit,
      quantity: String(validated.quantity),
      minStock: String(validated.minStock),
      costPerUnit: String(validated.costPerUnit),
      supplierId: validated.supplierId || null,
      location: validated.location || null,
    },
  });

  await syncStockAlerts(id);
  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function deleteInventoryItem(id: string) {
  await requirePermissionServer("inventory:delete");
  await prisma.inventoryItem.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function recordStockMovement(formData: FormData) {
  await requirePermissionServer("inventory:adjust");
  const data = Object.fromEntries(formData.entries());
  const validated = stockMovementSchema.parse(data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    // Create movement record
    await tx.stockMovement.create({
      data: {
        itemId: validated.itemId,
        type: validated.type,
        quantity: String(validated.quantity),
        unitCost: validated.unitCost ? String(validated.unitCost) : null,
        reference: validated.reference || null,
        notes: validated.notes || null,
      },
    });

    // Update item quantity
    const item = await tx.inventoryItem.findUnique({ where: { id: validated.itemId } });
    if (item) {
      const currentQty = Number(item.quantity);
      const moveQty = Number(validated.quantity);
      let newQty = currentQty;

      if (validated.type === "STOCK_IN") newQty = currentQty + moveQty;
      else if (validated.type === "STOCK_OUT") newQty = currentQty - moveQty;
      else if (validated.type === "ADJUSTMENT") newQty = moveQty; // set to specific value

      await tx.inventoryItem.update({
        where: { id: validated.itemId },
        data: { quantity: String(Math.max(0, newQty)) },
      });
    }
  });

  // Evaluate the new stock level for alerts + product status automation
  await syncStockAlerts(validated.itemId);

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function getInventoryItems(params: {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
}) {
  await requirePermissionServer("inventory:view");
  const { page = 1, limit = 20, search = "", lowStock = false } = params;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { category: true, supplier: true },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  const filteredItems = lowStock
    ? items.filter((item: { quantity: unknown; minStock: unknown }) => Number(item.quantity) <= Number(item.minStock))
    : items;

  return { items: filteredItems, total: lowStock ? filteredItems.length : total, page, limit, totalPages: Math.ceil(total / limit) };
}
