export type LineItemInput = { name: string; description?: string; quantity: number; unitPrice: number };

/** Validates client-supplied line items so totals cannot be NaN, negative or absurd. */
export function validateLineItems(items: LineItemInput[]): LineItemInput[] {
  if (!Array.isArray(items) || items.length === 0 || items.length > 200) {
    throw new Error("Between 1 and 200 line items are required");
  }
  return items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    if (!item.name || !String(item.name).trim()) throw new Error("Every line item needs a name");
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) throw new Error("Invalid quantity");
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 1_000_000_000) throw new Error("Invalid unit price");
    return {
      name: String(item.name).trim().slice(0, 200),
      description: item.description ? String(item.description).slice(0, 1000) : undefined,
      quantity,
      unitPrice,
    };
  });
}

export function validateAmounts(subtotal: number, discount: number, taxRate: number) {
  if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
    throw new Error("Discount must be between 0 and the subtotal");
  }
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new Error("Tax rate must be between 0 and 100");
  }
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
