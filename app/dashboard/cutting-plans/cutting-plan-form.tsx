"use client";

import { toast } from "sonner";
import { flashError } from "@/lib/utils/flash";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CuttingPrintPanel } from "@/components/dashboard/cutting-print-panel";
import {
  createCuttingPlan,
  updateCuttingPlan,
  createBoardPreset,
  updateCuttingPlanStatus,
} from "@/actions/cutting-plans";
import { hasPermission } from "@/lib/permissions";
import { optimizeCuttingPlan, type OptimizerResult, type GrainOption } from "@/lib/cutting-optimizer";
import { Download, FileJson, FileSpreadsheet, Plus, Copy, Trash2, Eraser, Printer, Sparkles, Save, Upload } from "lucide-react";
import type { BoardPreset } from "@prisma/client";

type Option = { value: string; label: string };

type PieceRow = {
  key: string;
  name: string;
  length: string;
  width: string;
  quantity: string;
  thickness: string;
  grain: GrainOption;
  allowRotation: boolean;
  notes: string;
};

export type InitialPlanData = {
  id: string;
  planNumber: string;
  name: string;
  status: string;
  projectId: string | null;
  jobId: string | null;
  supplierId: string | null;
  customerName: string | null;
  materialName: string;
  materialType: string;
  boardLength: number;
  boardWidth: number;
  boardThickness: number | null;
  boardQuantity: number;
  unit: string;
  boardPrice: number | null;
  notes: string | null;
  kerf: number;
  trimTop: number;
  trimBottom: number;
  trimLeft: number;
  trimRight: number;
  direction: string;
  allowRotation: boolean;
  grainStrategy: string;
  strategy: string;
  boardsUsed: number | null;
  efficiency: number | null;
  wasteArea: number | null;
  layout: OptimizerResult | null;
  pieces: {
    id: string;
    name: string;
    length: number;
    width: number;
    quantity: number;
    thickness: number | null;
    grain: string;
    allowRotation: boolean;
    notes: string | null;
  }[];
};

const MATERIALS: Option[] = [
  "MDF", "PLYWOOD", "HARDWOOD", "SOFTWOOD", "MELAMINE", "CHIPBOARD", "VENEER", "LAMINATED", "CUSTOM",
].map((m) => ({ value: m, label: m.charAt(0) + m.slice(1).toLowerCase() }));

const UNITS: Option[] = [
  { value: "mm", label: "Millimeters (mm)" },
  { value: "cm", label: "Centimeters (cm)" },
  { value: "in", label: "Inches (in)" },
];

const GRAINS: Option[] = [
  { value: "NONE", label: "No grain restriction" },
  { value: "LENGTH", label: "Grain follows length" },
  { value: "WIDTH", label: "Grain follows width" },
];

const DIRECTIONS: Option[] = [
  { value: "AUTOMATIC", label: "Automatic optimization" },
  { value: "HORIZONTAL", label: "Horizontal" },
  { value: "VERTICAL", label: "Vertical" },
];

const STRATEGIES: Option[] = [
  { value: "GUILLOTINE", label: "Guillotine cutting" },
  { value: "NESTING_2D", label: "General 2D rectangular nesting" },
];

const STATUSES = ["DRAFT", "GENERATED", "APPROVED", "PRINTED", "COMPLETED", "ARCHIVED"];
const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  GENERATED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  PRINTED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  ARCHIVED: "bg-zinc-200 text-zinc-600",
};

let rowSeq = 0;
const newKey = () => `row-${Date.now()}-${rowSeq++}`;

const emptyRow = (): PieceRow => ({
  key: newKey(),
  name: "",
  length: "",
  width: "",
  quantity: "1",
  thickness: "",
  grain: "NONE",
  allowRotation: true,
  notes: "",
});

// Pieces no longer have a user-entered name; fall back to an auto label.
const pieceLabel = (r: PieceRow, i: number) => r.name?.trim() || `Piece ${i + 1}`;

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseGrain(v: string): GrainOption {
  const u = (v || "").trim().toUpperCase();
  return u === "LENGTH" || u === "WIDTH" ? u : "NONE";
}

export function CuttingPlanForm({
  mode,
  initialData,
  projects,
  jobs,
  suppliers,
  presets: initialPresets,
  userRole,
}: {
  mode: "create" | "edit";
  initialData?: InitialPlanData | null;
  projects: Option[];
  jobs: Option[];
  suppliers: Option[];
  presets: (BoardPreset & { length: number; width: number; thickness: number | null })[];
  userRole: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // ---------- Section A: board / stock ----------
  const [planName, setPlanName] = useState(initialData?.name ?? "");
  const [projectId, setProjectId] = useState(initialData?.projectId ?? "");
  const [jobId, setJobId] = useState(initialData?.jobId ?? "");
  const [customerName, setCustomerName] = useState(initialData?.customerName ?? "");
  const [materialName, setMaterialName] = useState(initialData?.materialName ?? "");
  const [materialType, setMaterialType] = useState(initialData?.materialType ?? "MDF");
  const [boardLength, setBoardLength] = useState(String(initialData?.boardLength ?? ""));
  const [boardWidth, setBoardWidth] = useState(String(initialData?.boardWidth ?? ""));
  const [boardThickness, setBoardThickness] = useState(String(initialData?.boardThickness ?? ""));
  const [boardQuantity, setBoardQuantity] = useState(String(initialData?.boardQuantity ?? "1"));
  const [unit, setUnit] = useState(initialData?.unit ?? "mm");
  const [boardPrice, setBoardPrice] = useState(String(initialData?.boardPrice ?? ""));
  const [supplierId, setSupplierId] = useState(initialData?.supplierId ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // ---------- Section B: cutting settings ----------
  const [kerf, setKerf] = useState(String(initialData?.kerf ?? "3"));
  const trims = initialData
    ? [initialData.trimTop, initialData.trimBottom, initialData.trimLeft, initialData.trimRight]
    : [0, 0, 0, 0];
  const isUniformTrim = trims[0] === trims[1] && trims[1] === trims[2] && trims[2] === trims[3];
  const [uniformTrim, setUniformTrim] = useState(initialData ? isUniformTrim : true);
  const [trimUniformVal, setTrimUniformVal] = useState(String(trims[0] ?? 0));
  const [trimTop, setTrimTop] = useState(String(trims[0]));
  const [trimBottom, setTrimBottom] = useState(String(trims[1]));
  const [trimLeft, setTrimLeft] = useState(String(trims[2]));
  const [trimRight, setTrimRight] = useState(String(trims[3]));
  const [direction, setDirection] = useState(initialData?.direction ?? "AUTOMATIC");
  const [allowRotation, setAllowRotation] = useState(initialData?.allowRotation ?? true);
  const [grainStrategy, setGrainStrategy] = useState(initialData?.grainStrategy ?? "NONE");
  const [strategy, setStrategy] = useState(initialData?.strategy ?? "GUILLOTINE");

  // ---------- Section C: pieces ----------
  const [rows, setRows] = useState<PieceRow[]>(
    initialData?.pieces.length
      ? initialData.pieces.map((p) => ({
          key: p.id,
          name: p.name,
          length: String(p.length),
          width: String(p.width),
          quantity: String(p.quantity),
          thickness: p.thickness === null ? "" : String(p.thickness),
          grain: p.grain as GrainOption,
          allowRotation: p.allowRotation,
          notes: p.notes ?? "",
        }))
      : [emptyRow(), emptyRow(), emptyRow()]
  );

  // ---------- results / ui ----------
  const [result, setResult] = useState<OptimizerResult | null>(initialData?.layout ?? null);
  const [printOpen, setPrintOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [presets, setPresets] = useState(initialPresets);
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");

  const effTrim = useMemo(() => {
    if (uniformTrim) {
      const v = parseFloat(trimUniformVal) || 0;
      return { trimTop: v, trimBottom: v, trimLeft: v, trimRight: v };
    }
    return {
      trimTop: parseFloat(trimTop) || 0,
      trimBottom: parseFloat(trimBottom) || 0,
      trimLeft: parseFloat(trimLeft) || 0,
      trimRight: parseFloat(trimRight) || 0,
    };
  }, [uniformTrim, trimUniformVal, trimTop, trimBottom, trimLeft, trimRight]);

  // Merge imported pieces into the current list: keep any real entries and
  // continue after them; drop blank placeholder rows so an empty plan starts
  // from the top instead of leaving leading empty rows.
  const pieceRows = (list: Partial<PieceRow>[]) =>
    setRows((prev) => {
      const kept = prev.filter((r) => r.name.trim() || r.length.trim() || r.width.trim());
      const additions = list.map((p) => ({ ...emptyRow(), ...p, key: newKey() } as PieceRow));
      return [...kept, ...additions];
    });

  const updateRow = (key: string, patch: Partial<PieceRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const duplicateRow = (key: string) =>
    setRows((prev) => {
      const i = prev.findIndex((r) => r.key === key);
      if (i === -1) return prev;
      const copy = { ...prev[i], key: newKey() };
      return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
    });

  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  // ---------- validation ----------
  const validate = (): string[] => {
    const errs: string[] = [];
    if (planName.trim().length < 2) errs.push("Plan name must be at least 2 characters");
    if (!materialName.trim()) errs.push("Material name is required");
    const L = parseFloat(boardLength);
    const W = parseFloat(boardWidth);
    if (!(L > 0)) errs.push("Board length must be positive");
    if (!(W > 0)) errs.push("Board width must be positive");
    const Q = parseInt(boardQuantity);
    if (!(Q >= 1) && boardQuantity !== "0" && boardQuantity !== "") errs.push("Board quantity must be 1 or more (0 = unlimited)");
    const K = parseFloat(kerf);
    if (K < 0 || Number.isNaN(K)) errs.push("Kerf must be 0 or more");
    if (L > 0 && effTrim.trimLeft + effTrim.trimRight >= L) errs.push("Left + right trim must be smaller than board length");
    if (W > 0 && effTrim.trimTop + effTrim.trimBottom >= W) errs.push("Top + bottom trim must be smaller than board width");

    const validPieces = rows.filter((r) => r.length.trim() || r.width.trim() || r.name.trim());
    if (validPieces.length === 0) errs.push("Add at least one required piece");
    validPieces.forEach((r, i) => {
      const label = pieceLabel(r, i);
      const pl = parseFloat(r.length);
      const pw = parseFloat(r.width);
      const pq = parseInt(r.quantity);
      if (!(pl > 0)) errs.push(`${label}: length must be positive`);
      if (!(pw > 0)) errs.push(`${label}: width must be positive`);
      if (!(pq >= 1)) errs.push(`${label}: quantity must be 1 or more`);
    });
    return errs;
  };

  const buildOptimizerInput = () => {
    const validPieces = rows.filter((r) => parseFloat(r.length) > 0 && parseFloat(r.width) > 0);
    return {
      pieces: validPieces.map((r, i) => ({
        ref: r.key,
        name: pieceLabel(r, i),
        length: parseFloat(r.length),
        width: parseFloat(r.width),
        quantity: Math.max(1, parseInt(r.quantity) || 1),
        grain: r.grain,
        allowRotation: r.allowRotation,
      })),
      settings: {
        boardLength: parseFloat(boardLength),
        boardWidth: parseFloat(boardWidth),
        boardQuantity: parseInt(boardQuantity) || 0,
        kerf: parseFloat(kerf) || 0,
        ...effTrim,
        direction: direction as "HORIZONTAL" | "VERTICAL" | "AUTOMATIC",
        allowRotation,
        grainStrategy: grainStrategy as GrainOption,
      },
    };
  };

  // ---------- generate ----------
  const handleGenerate = async () => {
    const errs = validate();
    if (errs.length) {
      setError(errs.join(" · "));
      return;
    }
    setError("");
    setGenerating(true);
    setResult(null);
    // let the browser paint the loading state before the (synchronous) solve
    await new Promise((r) => setTimeout(r, 60));
    try {
      const { pieces, settings } = buildOptimizerInput();
      const res = optimizeCuttingPlan(pieces, settings);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setGenerating(false);
    }
  };

  // ---------- save ----------
  const handleSave = async () => {
    const errs = validate();
    if (errs.length) {
      setError(errs.join(" · "));
      return;
    }
    setError("");
    setSaving(true);
    try {
      const input = {
        name: planName.trim(),
        projectId: projectId || null,
        jobId: jobId || null,
        supplierId: supplierId || null,
        customerName: customerName.trim() || null,
        materialName: materialName.trim(),
        materialType,
        boardLength: parseFloat(boardLength),
        boardWidth: parseFloat(boardWidth),
        boardThickness: parseFloat(boardThickness) || null,
        boardQuantity: parseInt(boardQuantity) || 0,
        unit,
        boardPrice: parseFloat(boardPrice) || null,
        notes: notes.trim() || null,
        kerf: parseFloat(kerf) || 0,
        ...effTrim,
        direction,
        allowRotation,
        grainStrategy,
        strategy,
        pieces: rows
          .filter((r) => parseFloat(r.length) > 0 && parseFloat(r.width) > 0)
          .map((r, i) => ({
            name: pieceLabel(r, i),
            length: parseFloat(r.length),
            width: parseFloat(r.width),
            quantity: Math.max(1, parseInt(r.quantity) || 1),
            thickness: parseFloat(r.thickness) || null,
            grain: r.grain,
            allowRotation: r.allowRotation,
            notes: r.notes.trim() || null,
          })),
        result: result ?? null,
      };
      const saved =
        mode === "edit" && initialData
          ? await updateCuttingPlan(initialData.id, input)
          : await createCuttingPlan(input);
      toast.success(mode === "edit" ? "Cutting plan updated" : "Cutting plan created");
      router.push(`/dashboard/cutting-plans/${saved.id}`);
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Failed to save plan"));
      setError(e instanceof Error ? e.message : "Failed to save plan");
      setSaving(false);
    }
  };

  // ---------- status actions ----------
  const changeStatus = async (next: string) => {
    if (!initialData) return;
    try {
      await updateCuttingPlanStatus(initialData.id, next);
      setStatus(next);
      toast.success(`Status changed to ${next.toLowerCase()}`);
      router.refresh();
    } catch (e) {
      toast.error(flashError(e, "Could not change the status"));
    }
  };

  // ---------- presets ----------
  const applyPreset = (p: (typeof presets)[number]) => {
    setMaterialType(p.materialType);
    setBoardLength(String(p.length));
    setBoardWidth(String(p.width));
    if (p.thickness !== null) setBoardThickness(String(p.thickness));
    setUnit(p.unit);
  };

  const savePreset = async () => {
    const name = prompt("Preset name (e.g. 'MDF 2440 x 1220 x 18'):");
    if (!name?.trim()) return;
    try {
      const created = await createBoardPreset({
        name: name.trim(),
        materialType,
        length: parseFloat(boardLength) || 0,
        width: parseFloat(boardWidth) || 0,
        thickness: parseFloat(boardThickness) || null,
        unit,
      });
      setPresets((prev) => [
        ...prev,
        {
          id: created.id,
          name: name.trim(),
          materialType,
          length: parseFloat(boardLength) || 0,
          width: parseFloat(boardWidth) || 0,
          thickness: parseFloat(boardThickness) || null,
          unit,
        } as (typeof presets)[number],
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preset");
    }
  };

  // ---------- import ----------
  const handleImportFile = async (file: File) => {
    setImportErrors([]);
    const text = await file.text();
    const errs: string[] = [];
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text);
        // Full exported plan (JSON reimport) or plain pieces array
        const plan = parsed?.plan ?? parsed;
        if (plan && typeof plan === "object" && (plan.boardLength !== undefined || plan.pieces)) {
          // Merge into the existing plan: keep the current plan's name when
          // editing a saved plan, only adopt the imported name when starting
          // fresh (so importing does not spawn a newly-named/numbered plan).
          if (plan.name) {
            setPlanName((cur) =>
              mode === "edit" && cur.trim() ? cur : String(plan.name).replace(/ \(Copy\)$/, "")
            );
          }
          if (plan.materialName) setMaterialName(String(plan.materialName));
          if (plan.materialType) setMaterialType(String(plan.materialType));
          if (plan.boardLength !== undefined) setBoardLength(String(plan.boardLength));
          if (plan.boardWidth !== undefined) setBoardWidth(String(plan.boardWidth));
          if (plan.boardThickness !== undefined) setBoardThickness(plan.boardThickness === null ? "" : String(plan.boardThickness));
          if (plan.boardQuantity !== undefined) setBoardQuantity(String(plan.boardQuantity));
          if (plan.unit) setUnit(String(plan.unit));
          if (plan.boardPrice !== undefined) setBoardPrice(plan.boardPrice === null ? "" : String(plan.boardPrice));
          if (plan.kerf !== undefined) setKerf(String(plan.kerf));
          if (plan.trimTop !== undefined) {
            setUniformTrim(false);
            setTrimTop(String(plan.trimTop));
            setTrimBottom(String(plan.trimBottom));
            setTrimLeft(String(plan.trimLeft));
            setTrimRight(String(plan.trimRight));
          }
          if (plan.direction) setDirection(String(plan.direction));
          if (plan.allowRotation !== undefined) setAllowRotation(Boolean(plan.allowRotation));
          if (plan.grainStrategy) setGrainStrategy(String(plan.grainStrategy));
          if (plan.strategy) setStrategy(String(plan.strategy));
          if (Array.isArray(plan.pieces)) {
            const imported: Partial<PieceRow>[] = [];
            plan.pieces.forEach((p: any, i: number) => {
              if (!(Number(p.length) > 0) || !(Number(p.width) > 0) || !(Number(p.quantity) >= 1)) {
                errs.push(`Row ${i + 1}: invalid dimensions or quantity`);
                return;
              }
              imported.push({
                name: String(p.name || `Piece ${i + 1}`),
                length: String(p.length),
                width: String(p.width),
                quantity: String(p.quantity),
                thickness: p.thickness == null ? "" : String(p.thickness),
                grain: parseGrain(p.grain ?? ""),
                allowRotation: p.allowRotation !== false && p.rotation !== "false",
                notes: p.notes ? String(p.notes) : "",
              });
            });
            if (imported.length) pieceRows(imported);
          }
          setResult(null);
        } else if (Array.isArray(parsed)) {
          const imported: Partial<PieceRow>[] = [];
          parsed.forEach((p: any, i: number) => {
            if (!(Number(p.length) > 0) || !(Number(p.width) > 0) || !(Number(p.quantity ?? 1) >= 1)) {
              errs.push(`Row ${i + 1}: invalid dimensions or quantity`);
              return;
            }
            imported.push({
              name: String(p.name || `Piece ${i + 1}`),
              length: String(p.length),
              width: String(p.width),
              quantity: String(p.quantity ?? 1),
              grain: parseGrain(p.grain ?? ""),
              allowRotation: p.allowRotation !== false && p.rotation !== "false",
            });
          });
          if (imported.length) pieceRows(imported);
        } else {
          errs.push("Unrecognized JSON format — expected an exported plan or an array of pieces.");
        }
      } else {
        // CSV
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) errs.push("CSV must have a header row and at least one data row");
        else {
          const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
          const idx = (name: string) => header.indexOf(name);
          const iName = idx("name"), iLen = idx("length"), iW = idx("width"), iQty = idx("quantity");
          const iGrain = idx("grain"), iRot = idx("rotation"), iNotes = idx("notes");
          if (iName === -1 || iLen === -1 || iW === -1 || iQty === -1) {
            errs.push("CSV header must include: name,length,width,quantity[,grain,rotation,notes]");
          } else {
            const imported: Partial<PieceRow>[] = [];
            lines.slice(1).forEach((line, i) => {
              const cols = line.split(",");
              const length = parseFloat(cols[iLen]);
              const width = parseFloat(cols[iW]);
              const quantity = parseInt(cols[iQty]);
              if (!(length > 0) || !(width > 0) || !(quantity >= 1)) {
                errs.push(`Row ${i + 2}: invalid dimensions or quantity (${line})`);
                return;
              }
              imported.push({
                name: (cols[iName] || `Piece ${i + 1}`).trim(),
                length: String(length),
                width: String(width),
                quantity: String(quantity),
                grain: iGrain >= 0 ? parseGrain(cols[iGrain] ?? "") : "NONE",
                allowRotation: iRot >= 0 ? String(cols[iRot]).trim().toLowerCase() !== "false" : true,
                notes: iNotes >= 0 ? (cols[iNotes] ?? "").trim() : "",
              });
            });
            if (imported.length) pieceRows(imported);
          }
        }
        setResult(null);
      }
    } catch {
      errs.push("Could not parse file — is it valid CSV/JSON?");
    }
    setImportErrors(errs);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ---------- export ----------
  const exportPieces = (as: "csv" | "json") => {
    const list = rows.filter((r) => parseFloat(r.length) > 0 && parseFloat(r.width) > 0);
    if (as === "json") {
      download(
        "cutting-list.json",
        JSON.stringify(
          list.map((r, i) => ({
            name: pieceLabel(r, i),
            length: parseFloat(r.length) || 0,
            width: parseFloat(r.width) || 0,
            quantity: parseInt(r.quantity) || 1,
            grain: r.grain,
            rotation: r.allowRotation,
            notes: r.notes || undefined,
          })),
          null,
          2
        ),
        "application/json"
      );
    } else {
      const header = "name,length,width,quantity,grain,rotation,notes";
      const body = list.map((r, i) => `${pieceLabel(r, i)},${r.length},${r.width},${r.quantity},${r.grain},${r.allowRotation},${r.notes}`);
      download("cutting-list.csv", [header, ...body].join("\n"), "text/csv");
    }
  };

  const exportFullPlan = () => {
    download(
      `${(planName || "cutting-plan").replace(/\s+/g, "-").toLowerCase()}.json`,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          app: "HONOBI Cutting Optimizer",
          version: 1,
          plan: {
            name: planName,
            materialName,
            materialType,
            boardLength: parseFloat(boardLength) || 0,
            boardWidth: parseFloat(boardWidth) || 0,
            boardThickness: parseFloat(boardThickness) || null,
            boardQuantity: parseInt(boardQuantity) || 0,
            unit,
            boardPrice: parseFloat(boardPrice) || null,
            kerf: parseFloat(kerf) || 0,
            ...effTrim,
            direction,
            allowRotation,
            grainStrategy,
            strategy,
            pieces: rows
              .filter((r) => parseFloat(r.length) > 0 && parseFloat(r.width) > 0)
              .map((r, i) => ({
                name: pieceLabel(r, i),
                length: parseFloat(r.length) || 0,
                width: parseFloat(r.width) || 0,
                quantity: parseInt(r.quantity) || 1,
                grain: r.grain,
                allowRotation: r.allowRotation,
                notes: r.notes || null,
              })),
          },
          result,
        },
        null,
        2
      ),
      "application/json"
    );
  };

  const can = (perm: Parameters<typeof hasPermission>[1]) => hasPermission(userRole, perm);
  const totalPieces = rows.reduce((s, r) => s + (parseInt(r.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:block">
        <div>
          <h1 className="text-2xl font-bold print:mb-0">
            {mode === "edit" ? `Cutting Plan — ${initialData?.planNumber}` : "New Cutting Plan"}
          </h1>
          <p className="text-sm text-muted-foreground print:hidden">
            Optimize how stock boards are cut into required pieces with minimum waste.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {mode === "edit" && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || ""}`}>
              {status}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          {mode === "edit" && can("cuttingPlans:approve") && status === "GENERATED" && (
            <Button size="sm" variant="secondary" onClick={() => changeStatus("APPROVED")}>Approve</Button>
          )}
          {mode === "edit" && status === "APPROVED" && can("cuttingPlans:print") && (
            <Button size="sm" variant="secondary" onClick={() => changeStatus("PRINTED")}>Mark Printed</Button>
          )}
          {mode === "edit" && (status === "PRINTED" || status === "GENERATED") && (
            <Button size="sm" variant="secondary" onClick={() => changeStatus("COMPLETED")}>Complete</Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/cutting-plans">Back</Link>
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive print:hidden">{error}</p>}

      {/* ============ SECTION A: Stock board / sheet settings ============ */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">A — Stock Board / Sheet Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Plan Name *</Label>
              <Input id="planName" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Wardrobe set — Akwomia house" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)} options={[{ value: "", label: "— None —" }, ...projects]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job">Job</Label>
              <Select id="job" value={jobId} onChange={(e) => setJobId(e.target.value)} options={[{ value: "", label: "— None —" }, ...jobs]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialName">Material Name *</Label>
              <Input id="materialName" value={materialName} onChange={(e) => setMaterialName(e.target.value)} placeholder="MDF" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialType">Material Type</Label>
              <Select id="materialType" value={materialType} onChange={(e) => setMaterialType(e.target.value)} options={MATERIALS} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select id="supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={[{ value: "", label: "— None —" }, ...suppliers]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardLength">Board Length *</Label>
              <Input id="boardLength" type="number" step="any" value={boardLength} onChange={(e) => setBoardLength(e.target.value)} placeholder="2440" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardWidth">Board Width *</Label>
              <Input id="boardWidth" type="number" step="any" value={boardWidth} onChange={(e) => setBoardWidth(e.target.value)} placeholder="1220" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardThickness">Thickness</Label>
              <Input id="boardThickness" type="number" step="any" value={boardThickness} onChange={(e) => setBoardThickness(e.target.value)} placeholder="18" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardQuantity">Quantity Available (0 = unlimited)</Label>
              <Input id="boardQuantity" type="number" min="0" value={boardQuantity} onChange={(e) => setBoardQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} options={UNITS} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardPrice">Board Price (GHS)</Label>
              <Input id="boardPrice" type="number" step="0.01" value={boardPrice} onChange={(e) => setBoardPrice(e.target.value)} placeholder="180.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer / Reference</Label>
              <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Board grade, grain side, etc." />
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Saved sizes:</span>
            {presets.map((p) => (
              <Button key={p.id} size="sm" variant="outline" type="button" onClick={() => applyPreset(p)}>
                {p.name}
              </Button>
            ))}
            <Button size="sm" variant="ghost" type="button" onClick={savePreset}>
              <Save className="h-3 w-3 mr-1" /> Save current as preset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============ SECTION B: Cutting settings ============ */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">B — Cutting Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kerf">Saw Kerf ({unit})</Label>
            <Input id="kerf" type="number" step="any" min="0" value={kerf} onChange={(e) => setKerf(e.target.value)} placeholder="3" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Edge Trim ({unit})</Label>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input type="checkbox" checked={uniformTrim} onChange={(e) => setUniformTrim(e.target.checked)} className="h-4 w-4" />
              Uniform trim for all edges
            </label>
            {uniformTrim ? (
              <Input type="number" step="any" min="0" value={trimUniformVal} onChange={(e) => setTrimUniformVal(e.target.value)} placeholder="0" />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <Input aria-label="Top trim" type="number" step="any" min="0" value={trimTop} onChange={(e) => setTrimTop(e.target.value)} placeholder="Top" />
                <Input aria-label="Bottom trim" type="number" step="any" min="0" value={trimBottom} onChange={(e) => setTrimBottom(e.target.value)} placeholder="Bottom" />
                <Input aria-label="Left trim" type="number" step="any" min="0" value={trimLeft} onChange={(e) => setTrimLeft(e.target.value)} placeholder="Left" />
                <Input aria-label="Right trim" type="number" step="any" min="0" value={trimRight} onChange={(e) => setTrimRight(e.target.value)} placeholder="Right" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="direction">Cutting Direction</Label>
            <Select id="direction" value={direction} onChange={(e) => setDirection(e.target.value)} options={DIRECTIONS} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grainStrategy">Grain Direction (default)</Label>
            <Select id="grainStrategy" value={grainStrategy} onChange={(e) => setGrainStrategy(e.target.value)} options={GRAINS} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strategy">Cutting Strategy</Label>
            <Select id="strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)} options={STRATEGIES} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-3">
            <input type="checkbox" checked={allowRotation} onChange={(e) => setAllowRotation(e.target.checked)} className="h-4 w-4" />
            Allow piece rotation (global switch — per-piece rules still apply)
          </label>
        </CardContent>
      </Card>

      {/* ============ SECTION C: Required pieces ============ */}
      <Card className="print:hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">C — Required Pieces ({totalPieces} total)</CardTitle>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                }}
              />
              <span className="cursor-pointer inline-flex items-center gap-1 rounded-md border px-3 py-1 text-sm font-medium hover:bg-accent">
                <Upload className="h-4 w-4" /> Import CSV / JSON
              </span>
            </label>
            <Button size="sm" variant="outline" type="button" onClick={() => exportPieces("csv")}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button size="sm" variant="outline" type="button" onClick={() => exportPieces("json")}>
              <FileJson className="h-4 w-4 mr-1" /> Export JSON
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setRows([emptyRow(), emptyRow(), emptyRow()])}>
              <Eraser className="h-4 w-4 mr-1" /> Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {importErrors.length > 0 && (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <p className="font-semibold text-destructive mb-1">Import issues ({importErrors.length}):</p>
              <ul className="list-disc pl-5 text-destructive/90 max-h-32 overflow-auto">
                {importErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-2 w-24">Length *</th>
                  <th className="py-2 pr-2 w-24">Width *</th>
                  <th className="py-2 pr-2 w-20">Qty *</th>
                  <th className="py-2 pr-2 w-24">Thick.</th>
                  <th className="py-2 pr-2 w-36">Grain</th>
                  <th className="py-2 pr-2 w-20">Rotate</th>
                  <th className="py-2 pr-2">Notes</th>
                  <th className="py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b align-middle">
                    <td className="py-1 pr-2">
                      <Input type="number" step="any" value={r.length} onChange={(e) => updateRow(r.key, { length: e.target.value })} />
                    </td>
                    <td className="py-1 pr-2">
                      <Input type="number" step="any" value={r.width} onChange={(e) => updateRow(r.key, { width: e.target.value })} />
                    </td>
                    <td className="py-1 pr-2">
                      <Input type="number" min="1" value={r.quantity} onChange={(e) => updateRow(r.key, { quantity: e.target.value })} />
                    </td>
                    <td className="py-1 pr-2">
                      <Input type="number" step="any" value={r.thickness} onChange={(e) => updateRow(r.key, { thickness: e.target.value })} />
                    </td>
                    <td className="py-1 pr-2">
                      <Select value={r.grain} onChange={(e) => updateRow(r.key, { grain: e.target.value as GrainOption })} options={GRAINS} className="h-10 text-sm" />
                    </td>
                    <td className="py-1 pr-2 text-center">
                      <input type="checkbox" checked={r.allowRotation} onChange={(e) => updateRow(r.key, { allowRotation: e.target.checked })} className="h-4 w-4" />
                    </td>
                    <td className="py-1 pr-2">
                      <Input value={r.notes} onChange={(e) => updateRow(r.key, { notes: e.target.value })} placeholder="—" />
                    </td>
                    <td className="py-1">
                      <div className="flex">
                        <Button size="sm" variant="ghost" type="button" title="Duplicate piece" onClick={() => duplicateRow(r.key)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" type="button" title="Remove piece" onClick={() => removeRow(r.key)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="outline"
            type="button"
            className="mt-3 w-full border-dashed"
            onClick={() => setRows((p) => [...p, emptyRow()])}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Piece
          </Button>
        </CardContent>
      </Card>

      {/* ============ Generate / Save ============ */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button size="lg" onClick={handleGenerate} disabled={generating}>
          <Sparkles className={`h-5 w-5 mr-2 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Optimizing…" : "GENERATE CUTTING PLAN"}
        </Button>
        <Button size="lg" variant="secondary" onClick={handleSave} disabled={saving}>
          <Save className="h-5 w-5 mr-2" />
          {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Save Plan"}
        </Button>
        <Button size="lg" variant="outline" onClick={exportFullPlan}>
          <Download className="h-5 w-5 mr-2" /> Export Full Plan (JSON)
        </Button>
      </div>

      {/* ============ Results ============ */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optimization Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Boards used</p>
                <p className="text-xl font-bold">{result.boardsUsed}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Efficiency</p>
                <p className="text-xl font-bold">{result.efficiency}%</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Material used</p>
                <p className="text-xl font-bold">{(result.usedArea / 1_000_000).toFixed(2)} m²</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Waste</p>
                <p className="text-xl font-bold text-orange-600">{(result.wasteArea / 1_000_000).toFixed(2)} m²</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Unplaced</p>
                <p className={`text-xl font-bold ${result.unplaced.length ? "text-destructive" : ""}`}>{result.unplaced.length}</p>
              </div>
            </div>

            {(result.totalCuts !== undefined || result.largestOffcut) && (
              <p className="text-sm text-muted-foreground">
                {result.totalCuts !== undefined && <>Total saw cuts: <strong>{result.totalCuts}</strong></>}
                {result.largestOffcut && (
                  <> · Largest reusable offcut: <strong>{Math.round(result.largestOffcut.length)} × {Math.round(result.largestOffcut.width)}</strong></>
                )}
              </p>
            )}

            {result.unplaced.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <p className="font-semibold text-destructive mb-1">Could not place:</p>
                <ul className="list-disc pl-5">
                  {result.unplaced.map((u, i) => (
                    <li key={i}>{u.name} ×{u.quantity} — {u.reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => setPrintOpen(true)}>
                <Printer className="h-4 w-4 mr-2" /> View &amp; Print Sheet (A4)
              </Button>
              <span className="text-sm text-muted-foreground">
                Opens a black-and-white canvas beside the page — one tab per board ({result.boardsUsed}).
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <CuttingPrintPanel
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          result={result}
          unit={unit}
          planName={planName}
          materialName={materialName}
        />
      )}
    </div>
  );
}
