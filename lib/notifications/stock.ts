import { prisma } from "@/lib/db/prisma";
import { NotificationType, ProductStatus } from "@prisma/client";

/**
 * Evaluate one inventory item:
 * - create a notification when it is out of stock or close to finishing (<= minStock)
 * - automate the status of products linked by SKU (AVAILABLE <-> OUT_OF_STOCK)
 * Notifications are deduplicated against unread alerts with the same title.
 */
export async function syncStockAlerts(itemId: string) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item || !item.isActive) return;

  const qty = Number(item.quantity);
  const min = Number(item.minStock);
  const unit = String(item.unit).toLowerCase().replace("_", " ");

  if (qty <= min) {
    const outOfStock = qty <= 0;
    const title = outOfStock ? `Out of stock: ${item.name}` : `Low stock: ${item.name}`;
    const message = outOfStock
      ? `${item.name} is out of stock. Reorder needed (min level: ${min} ${unit}).`
      : `${item.name} is close to finishing: ${qty} ${unit} left (min level: ${min}).`;

    const exists = await prisma.notification.findFirst({
      where: { type: NotificationType.LOW_INVENTORY, title, isRead: false },
    });
    if (!exists) {
      await prisma.notification.create({
        data: {
          type: NotificationType.LOW_INVENTORY,
          title,
          message,
          link: "/dashboard/inventory",
        },
      });
    }
  }

  // Product status automation via SKU linkage
  if (item.sku) {
    const linked = await prisma.product.findMany({ where: { sku: item.sku, isActive: true } });
    for (const p of linked) {
      if (qty <= 0 && p.status !== ProductStatus.OUT_OF_STOCK && p.status !== ProductStatus.DISCONTINUED) {
        await prisma.product.update({
          where: { id: p.id },
          data: { status: ProductStatus.OUT_OF_STOCK, availability: "Out of Stock" },
        });
      } else if (qty > 0 && p.status === ProductStatus.OUT_OF_STOCK) {
        await prisma.product.update({
          where: { id: p.id },
          data: { status: ProductStatus.AVAILABLE, availability: "In Stock" },
        });
      }
    }
  }
}

/** Sweep every active inventory item (used when the notifications page loads). */
export async function runStockSweep() {
  const items = await prisma.inventoryItem.findMany({ where: { isActive: true }, select: { id: true } });
  for (const item of items) {
    await syncStockAlerts(item.id);
  }
}
