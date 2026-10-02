"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PackagePlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { flashError } from "@/lib/utils/flash";
import { formatCurrency } from "@/lib/utils";
import {
  adjustMaterialStock,
  createCuttingMaterial,
  deleteCuttingMaterial,
  updateCuttingMaterial,
  type CuttingMaterialRow,
} from "@/actions/cutting-materials";

const TYPES = ["MDF", "PLYWOOD", "HARDWOOD", "SOFTWOOD", "MELAMINE", "CHIPBOARD", "VENEER", "LAMINATED", "CUSTOM"].map((m) => ({
  value: m,
  label: m.charAt(0) + m.slice(1).toLowerCase(),
}));
const UNITS = [
  { value: "mm", label: "Millimeters (mm)" },
  { value: "cm", label: "Centimeters (cm)" },
  { value: "in", label: "Inches (in)" },
];

type FormState = {
  name: string;
  materialType: string;
  length: string;
  width: string;
  thickness: string;
  unit: string;
  quantity: string;
  price: string;
  notes: string;
};

const empty: FormState = { name: "", materialType: "MDF", length: "2440", width: "1220", thickness: "", unit: "mm", quantity: "0", price: "", notes: "" };

export function MaterialsClient({
  materials,
  canCreate,
  canEdit,
  canDelete,
}: {
  materials: CuttingMaterialRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  function startNew() {
    setForm(empty);
    setEditing("new");
  }

  function startEdit(m: CuttingMaterialRow) {
    setForm({
      name: m.name,
      materialType: m.materialType,
      length: String(m.length),
      width: String(m.width),
      thickness: m.thickness === null ? "" : String(m.thickness),
      unit: m.unit,
      quantity: String(m.quantity),
      price: m.price === null ? "" : String(m.price),
      notes: m.notes ?? "",
    });
    setEditing(m.id);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        materialType: form.materialType as never,
        length: Number(form.length),
        width: Number(form.width),
        thickness: form.thickness ? Number(form.thickness) : null,
        unit: form.unit as never,
        quantity: Number(form.quantity || 0),
        price: form.price ? Number(form.price) : null,
        notes: form.notes || null,
      };
      if (editing === "new") await createCuttingMaterial(payload);
      else if (editing) await updateCuttingMaterial(editing, payload);
      toast.success(editing === "new" ? "Material added" : "Material updated");
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Could not save the material. Check the name and sizes."));
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: CuttingMaterialRow) {
    if (!confirm(`Remove "${m.name}" from the materials list? Existing plans keep their sizes.`)) return;
    try {
      await deleteCuttingMaterial(m.id);
      toast.success("Material removed");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Could not remove the material"));
    }
  }

  async function applyAdjust(m: CuttingMaterialRow) {
    const change = Number(adjustValue);
    setBusy(true);
    try {
      const updated = await adjustMaterialStock(m.id, change);
      toast.success(`${m.name}: stock is now ${updated.quantity}`);
      setAdjustId(null);
      setAdjustValue("");
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Could not change the stock"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cutting Materials</h1>
          <p className="text-sm text-muted-foreground">
            The boards and sheets you cut from. Pick one in a cutting plan to fill in its size and see how many are in stock.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/cutting-plans"><ArrowLeft className="mr-2 h-4 w-4" /> Cutting plans</Link>
          </Button>
          {canCreate && (
            <Button onClick={startNew}>
              <Plus className="mr-2 h-4 w-4" /> Add material
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editing === "new" ? "Add cutting material" : "Edit cutting material"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="m-name">Material name *</Label>
                <Input id="m-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. GREY BOARD" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-type">Type</Label>
                <Select id="m-type" value={form.materialType} onChange={(e) => set({ materialType: e.target.value })} options={TYPES} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-length">Sheet length *</Label>
                <Input id="m-length" type="number" step="any" value={form.length} onChange={(e) => set({ length: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-width">Sheet width *</Label>
                <Input id="m-width" type="number" step="any" value={form.width} onChange={(e) => set({ width: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-thick">Thickness</Label>
                <Input id="m-thick" type="number" step="any" value={form.thickness} onChange={(e) => set({ thickness: e.target.value })} placeholder="18" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-unit">Unit</Label>
                <Select id="m-unit" value={form.unit} onChange={(e) => set({ unit: e.target.value })} options={UNITS} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-qty">Sheets in stock</Label>
                <Input id="m-qty" type="number" min="0" step="1" value={form.quantity} onChange={(e) => set({ quantity: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-price">Price per sheet (GHS)</Label>
                <Input id="m-price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1 md:col-span-3">
                <Label htmlFor="m-notes">Notes</Label>
                <Textarea id="m-notes" rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Supplier, grade, colour…" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save material"}</Button>
              <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Material</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Sheet size</th>
              <th className="p-3 text-right">In stock</th>
              <th className="p-3 text-right">Price / sheet</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3 font-medium">{m.name}</td>
                <td className="p-3 capitalize">{m.materialType.toLowerCase()}</td>
                <td className="p-3">
                  {m.length} × {m.width}
                  {m.thickness ? ` × ${m.thickness}` : ""} {m.unit}
                </td>
                <td className="p-3 text-right">
                  <span className={m.quantity === 0 ? "font-semibold text-destructive" : "font-semibold"}>{m.quantity}</span>
                  {m.quantity === 0 && <span className="ml-1 text-xs text-destructive">out of stock</span>}
                </td>
                <td className="p-3 text-right">{m.price !== null ? formatCurrency(m.price) : "—"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {adjustId === m.id ? (
                      <>
                        <Input
                          className="h-8 w-24"
                          type="number"
                          step="1"
                          autoFocus
                          placeholder="+10 / -2"
                          value={adjustValue}
                          onChange={(e) => setAdjustValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && applyAdjust(m)}
                        />
                        <Button size="sm" onClick={() => applyAdjust(m)} disabled={busy}>Apply</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAdjustId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        {canEdit && (
                          <Button size="sm" variant="outline" onClick={() => { setAdjustId(m.id); setAdjustValue(""); }}>
                            <PackagePlus className="mr-1 h-4 w-4" /> Stock
                          </Button>
                        )}
                        {canEdit && (
                          <Button size="sm" variant="ghost" onClick={() => startEdit(m)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="sm" variant="ghost" onClick={() => remove(m)} aria-label="Remove">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {materials.length === 0 && (
          <p className="p-8 text-center text-muted-foreground">
            No cutting materials yet. {canCreate ? "Press Add material to create your first board or sheet." : ""}
          </p>
        )}
      </div>
    </div>
  );
}
