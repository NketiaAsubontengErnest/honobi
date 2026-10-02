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
import { CuttingSheetView, groupIdenticalBoards, type EdgeBands } from "@/components/dashboard/cutting-sheet-view";
import {
  createCuttingPlan,
  updateCuttingPlan,
  createBoardPreset,
  updateCuttingPlanStatus,
} from "@/actions/cutting-plans";
import { hasPermission } from "@/lib/permissions";
import type { CuttingMaterialRow } from "@/actions/cutting-materials";
import { optimizeCuttingPlan, type OptimizerResult, type GrainOption } from "@/lib/cutting-optimizer";
import { Check, Download, FileSpreadsheet, Plus, Trash2, Eraser, Play, Printer, Sparkles, Save, Upload } from "lucide-react";
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
  edgeTop: string;
  edgeLeft: string;
  edgeBottom: string;
  edgeRight: string;
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
  materialId?: string | null;
  deductStock?: boolean;
  stockDeducted?: number;
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
    edgeTop?: string | null;
    edgeLeft?: string | null;
    edgeBottom?: string | null;
    edgeRight?: string | null;
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
  edgeTop: "",
  edgeLeft: "",
  edgeBottom: "",
  edgeRight: "",
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
  materials = [],
  userRole,
}: {
  mode: "create" | "edit";
  initialData?: InitialPlanData | null;
  projects: Option[];
  jobs: Option[];
  suppliers: Option[];
  presets: (BoardPreset & { length: number; width: number; thickness: number | null })[];
  materials?: CuttingMaterialRow[];
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
  const [materialId, setMaterialId] = useState(initialData?.materialId ?? "");
  const [deductStock, setDeductStock] = useState(initialData?.deductStock ?? false);

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
          edgeTop: p.edgeTop ?? "",
          edgeLeft: p.edgeLeft ?? "",
          edgeBottom: p.edgeBottom ?? "",
          edgeRight: p.edgeRight ?? "",
        }))
      : [emptyRow(), emptyRow(), emptyRow()]
  );

  // ---------- results / ui ----------
  const [result, setResult] = useState<OptimizerResult | null>(() => {
    const saved = initialData?.layout ?? null;
    if (!saved || !initialData) return saved;
    // Layouts saved from the browser reference pieces by position ("idx:N"); map them back to the loaded rows
    const keys = initialData.pieces.map((p) => p.id);
    const remap = (ref: string) => (ref.startsWith("idx:") ? keys[Number(ref.slice(4))] ?? ref : ref);
    return { ...saved, boards: saved.boards.map((b) => ({ ...b, placements: b.placements.map((pl) => ({ ...pl, ref: remap(pl.ref) })) })) };
  });
  const [printOpen, setPrintOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [presets, setPresets] = useState(initialPresets);
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");

  // workspace view state
  const [selected, setSelected] = useState<string | null>(null);
  const [showSizes, setShowSizes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [tab, setTab] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
      setTab(0);
      if (res.unplaced.length) toast.warning(`${res.unplaced.length} piece type(s) could not be placed`);
      else toast.success(`Layout ready: ${res.boardsUsed} sheet${res.boardsUsed === 1 ? "" : "s"}, ${res.efficiency}% utilization`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setGenerating(false);
    }
  };

  // Placements reference pieces by row key in the browser; store positions so a reload can re-link them
  const storableResult = (res: OptimizerResult): OptimizerResult => {
    const valid = rows.filter((r) => parseFloat(r.length) > 0 && parseFloat(r.width) > 0).map((r) => r.key);
    return {
      ...res,
      boards: res.boards.map((b) => ({
        ...b,
        placements: b.placements.map((pl) => {
          const i = valid.indexOf(pl.ref);
          return i === -1 ? pl : { ...pl, ref: `idx:${i}` };
        }),
      })),
    };
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
        materialId: materialId || null,
        deductStock: !!materialId && deductStock,
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
            edgeTop: r.edgeTop.trim() || null,
            edgeLeft: r.edgeLeft.trim() || null,
            edgeBottom: r.edgeBottom.trim() || null,
            edgeRight: r.edgeRight.trim() || null,
          })),
        result: result ? storableResult(result) : null,
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
                edgeTop: p.edgeTop ? String(p.edgeTop) : "",
                edgeLeft: p.edgeLeft ? String(p.edgeLeft) : "",
                edgeBottom: p.edgeBottom ? String(p.edgeBottom) : "",
                edgeRight: p.edgeRight ? String(p.edgeRight) : "",
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
              edgeTop: p.edgeTop ? String(p.edgeTop) : "",
              edgeLeft: p.edgeLeft ? String(p.edgeLeft) : "",
              edgeBottom: p.edgeBottom ? String(p.edgeBottom) : "",
              edgeRight: p.edgeRight ? String(p.edgeRight) : "",
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
          const iET = idx("edgetop"), iEL = idx("edgeleft"), iEB = idx("edgebottom"), iER = idx("edgeright");
          const edge = (cols: string[], i: number) => (i >= 0 ? (cols[i] ?? "").trim() : "");
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
                edgeTop: edge(cols, iET),
                edgeLeft: edge(cols, iEL),
                edgeBottom: edge(cols, iEB),
                edgeRight: edge(cols, iER),
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
            edgeTop: r.edgeTop || undefined,
            edgeLeft: r.edgeLeft || undefined,
            edgeBottom: r.edgeBottom || undefined,
            edgeRight: r.edgeRight || undefined,
          })),
          null,
          2
        ),
        "application/json"
      );
    } else {
      const header = "name,length,width,quantity,grain,rotation,notes,edgeTop,edgeLeft,edgeBottom,edgeRight";
      const body = list.map((r, i) => `${pieceLabel(r, i)},${r.length},${r.width},${r.quantity},${r.grain},${r.allowRotation},${r.notes},${r.edgeTop},${r.edgeLeft},${r.edgeBottom},${r.edgeRight}`);
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
                edgeTop: r.edgeTop || null,
                edgeLeft: r.edgeLeft || null,
                edgeBottom: r.edgeBottom || null,
                edgeRight: r.edgeRight || null,
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

  // ---------- workspace helpers ----------
  const groups = useMemo(() => (result ? groupIdenticalBoards(result) : []), [result]);
  const activeIndex = Math.min(tab, Math.max(0, groups.length - 1));
  const activeGroup = groups[activeIndex];
  const refOrder = useMemo(() => rows.map((r) => r.key), [rows]);

  // ---------- cutting material / stock ----------
  const selectedMaterial = materials.find((m) => m.id === materialId) ?? null;
  // A plan that already deducted sheets from this material "holds" them, so they count as available to it
  const heldByThisPlan = initialData && initialData.materialId === materialId ? initialData.stockDeducted ?? 0 : 0;
  const availableStock = selectedMaterial ? selectedMaterial.quantity + heldByThisPlan : null;
  const sheetsNeeded = result?.boardsUsed ?? 0;

  const chooseMaterial = (id: string) => {
    setMaterialId(id);
    const m = materials.find((x) => x.id === id);
    if (!m) {
      setDeductStock(false);
      return;
    }
    const held = initialData && initialData.materialId === id ? initialData.stockDeducted ?? 0 : 0;
    setMaterialName(m.name);
    setMaterialType(m.materialType);
    setBoardLength(String(m.length));
    setBoardWidth(String(m.width));
    setBoardThickness(m.thickness === null ? "" : String(m.thickness));
    setUnit(m.unit);
    if (m.price !== null) setBoardPrice(String(m.price));
    // the quantity cell shows what is in stock (0 = no limit)
    setBoardQuantity(String(m.quantity + held));
    setResult(null);
  };
  const edgeMap = useMemo<EdgeBands>(
    () => Object.fromEntries(rows.map((r) => [r.key, { top: r.edgeTop.trim(), left: r.edgeLeft.trim(), bottom: r.edgeBottom.trim(), right: r.edgeRight.trim() }])),
    [rows]
  );
  const edgeCodes = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => [r.edgeTop, r.edgeLeft, r.edgeBottom, r.edgeRight]).map((v) => v.trim()).filter(Boolean))),
    [rows]
  );
  // Total edge banding needed per band code, in metres
  const edgeTotals = useMemo(() => {
    const toMetres = unit === "cm" ? 0.01 : unit === "in" ? 0.0254 : 0.001;
    const totals = new Map<string, number>();
    for (const r of rows) {
      const L = parseFloat(r.length);
      const W = parseFloat(r.width);
      const q = Math.max(1, parseInt(r.quantity) || 1);
      if (!(L > 0) || !(W > 0)) continue;
      const add = (code: string, len: number) => {
        const c = code.trim();
        if (c) totals.set(c, (totals.get(c) ?? 0) + len * q * toMetres);
      };
      add(r.edgeTop, L);
      add(r.edgeBottom, L);
      add(r.edgeLeft, W);
      add(r.edgeRight, W);
    }
    return Array.from(totals.entries());
  }, [rows, unit]);

  const appendRow = (focus = true) => {
    const nr = emptyRow();
    setRows((p) => [...p, nr]);
    setSelected(nr.key);
    if (focus) setTimeout(() => document.getElementById(`len-${nr.key}`)?.focus(), 0);
  };
  const deleteSelected = () => {
    if (rows.length === 0) return;
    const key = selected && rows.some((r) => r.key === selected) ? selected : rows[rows.length - 1].key;
    removeRow(key);
    setSelected(null);
  };

  const cell =
    "h-8 w-full border-0 bg-transparent px-2 text-sm tabular-nums focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary";
  const th = "border border-sky-200 bg-sky-100 px-2 py-1 text-left text-xs font-semibold text-sky-900";
  const tdBase = "border border-slate-200 p-0";
  const toolBtn =
    "flex min-w-14 flex-col items-center gap-0.5 rounded px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40";

  const pricePerSheet = parseFloat(boardPrice) || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:block">
        <div>
          <h1 className="text-2xl font-bold print:mb-0">
            {mode === "edit" ? `Cutting Plan — ${initialData?.planNumber}` : "New Cutting Plan"}
          </h1>
          <p className="text-sm text-muted-foreground print:hidden">
            Enter the pieces and the stock sheet, press Start, and review each sheet on the right.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {mode === "edit" && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || ""}`}>{status}</span>
          )}
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
            <Link href="/dashboard/cutting-plans/materials">Materials</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/cutting-plans">Back</Link>
          </Button>
        </div>
      </div>

      {/* Plan name + details */}
      <Card className="print:hidden">
        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-64 flex-1 space-y-1">
              <Label htmlFor="planName">Plan name *</Label>
              <Input id="planName" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Wardrobe set — Akwomia house" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setDetailsOpen((o) => !o)}>
              {detailsOpen ? "Hide details" : "Project, job & notes"}
            </Button>
          </div>
          {detailsOpen && (
            <div className="grid grid-cols-1 gap-3 border-t pt-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="project">Project</Label>
                <Select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)} options={[{ value: "", label: "— None —" }, ...projects]} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="job">Job</Label>
                <Select id="job" value={jobId} onChange={(e) => setJobId(e.target.value)} options={[{ value: "", label: "— None —" }, ...jobs]} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="supplier">Supplier</Label>
                <Select id="supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={[{ value: "", label: "— None —" }, ...suppliers]} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customerName">Customer / reference</Label>
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Board grade, grain side, etc." />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive print:hidden">{error}</p>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,700px)_minmax(0,1fr)] print:hidden">
        {/* ================= LEFT: PIECES + STOCK ================= */}
        <div className="space-y-4">
          {/* ---- PIECES ---- */}
          <div className="overflow-hidden rounded-md border bg-white">
            <div className="flex items-center gap-1 border-b bg-slate-50 px-2 py-1">
              <span className="mr-2 rounded bg-sky-100 px-2 py-1 text-[11px] font-bold tracking-wide text-sky-900">PIECES</span>
              <button type="button" className={toolBtn} onClick={() => appendRow()}>
                <Plus className="h-4 w-4 text-green-600" /> Append
              </button>
              <button type="button" className={toolBtn} onClick={deleteSelected} disabled={rows.length === 0}>
                <Trash2 className="h-4 w-4 text-red-600" /> Delete
              </button>
              <button type="button" className={toolBtn} onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 text-emerald-700" /> Import
              </button>
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
              <button type="button" className={toolBtn} onClick={() => { setRows([emptyRow(), emptyRow(), emptyRow()]); setSelected(null); }}>
                <Eraser className="h-4 w-4 text-slate-600" /> Clear
              </button>
              <button type="button" className={toolBtn} onClick={() => exportPieces("csv")}>
                <FileSpreadsheet className="h-4 w-4 text-slate-600" /> Export
              </button>
              <span className="ml-auto pr-1 text-xs text-muted-foreground">{totalPieces} pcs</span>
            </div>

            {importErrors.length > 0 && (
              <div className="border-b bg-destructive/5 p-2 text-xs text-destructive">
                <p className="font-semibold">Import issues ({importErrors.length}):</p>
                <ul className="max-h-24 list-disc overflow-auto pl-5">
                  {importErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            <datalist id="edge-band-codes">
              {edgeCodes.map((c) => <option key={c} value={c} />)}
            </datalist>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th rowSpan={2} className={`${th} w-9 text-center`}>#</th>
                    <th rowSpan={2} className={`${th} w-20`}>Length</th>
                    <th rowSpan={2} className={`${th} w-20`}>Width</th>
                    <th rowSpan={2} className={`${th} w-16`}>Qty</th>
                    <th rowSpan={2} className={`${th} min-w-20`}>Label</th>
                    <th rowSpan={2} className={`${th} w-24`}>Texture</th>
                    <th rowSpan={2} className={`${th} w-10 text-center`}>Rot.</th>
                    <th colSpan={4} className={`${th} text-center`}>Edge bands (name)</th>
                  </tr>
                  <tr>
                    <th className={`${th} w-16`}>Top</th>
                    <th className={`${th} w-16`}>Left</th>
                    <th className={`${th} w-16`}>Bottom</th>
                    <th className={`${th} w-16`}>Right</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const isSel = selected === r.key;
                    return (
                      <tr key={r.key} onClick={() => setSelected(r.key)} className={isSel ? "bg-amber-50" : i % 2 ? "bg-slate-50/60" : ""}>
                        <td className={`${tdBase} bg-sky-100 text-center text-xs font-medium text-sky-900`}>{i + 1}</td>
                        <td className={tdBase}>
                          <input id={`len-${r.key}`} className={cell} type="number" step="any" value={r.length} onChange={(e) => updateRow(r.key, { length: e.target.value })} />
                        </td>
                        <td className={tdBase}>
                          <input className={cell} type="number" step="any" value={r.width} onChange={(e) => updateRow(r.key, { width: e.target.value })} />
                        </td>
                        <td className={tdBase}>
                          <input
                            className={cell}
                            type="number"
                            min="1"
                            value={r.quantity}
                            onChange={(e) => updateRow(r.key, { quantity: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && i === rows.length - 1) {
                                e.preventDefault();
                                appendRow();
                              }
                            }}
                          />
                        </td>
                        <td className={tdBase}>
                          <input className={cell} value={r.name} onChange={(e) => updateRow(r.key, { name: e.target.value })} placeholder={`Piece ${i + 1}`} />
                        </td>
                        <td className={tdBase}>
                          <select className={cell} value={r.grain} onChange={(e) => updateRow(r.key, { grain: e.target.value as GrainOption })}>
                            <option value="NONE">None</option>
                            <option value="LENGTH">Along length</option>
                            <option value="WIDTH">Along width</option>
                          </select>
                        </td>
                        <td className={`${tdBase} text-center`}>
                          <input type="checkbox" className="h-4 w-4" checked={r.allowRotation} onChange={(e) => updateRow(r.key, { allowRotation: e.target.checked })} />
                        </td>
                        {(["edgeTop", "edgeLeft", "edgeBottom", "edgeRight"] as const).map((f) => (
                          <td key={f} className={tdBase}>
                            <input
                              className={cell}
                              list="edge-band-codes"
                              value={r[f]}
                              onChange={(e) => updateRow(r.key, { [f]: e.target.value } as Partial<PieceRow>)}
                              placeholder="—"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-sm text-muted-foreground">
                        No pieces yet. Press Append, or Import a CSV / JSON list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t bg-slate-50 px-2 py-1 text-[11px] text-muted-foreground">
              Tip: press Enter in the last Quantity cell to add the next row. Edge bands: type a band name (e.g. HD) on any side; leave empty for no band. Import columns: name,length,width,quantity[,grain,rotation,notes,edgeTop,edgeLeft,edgeBottom,edgeRight].
            </p>
          </div>

          {/* ---- STOCK ---- */}
          <div className="overflow-hidden rounded-md border bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50 px-2 py-1">
              <span className="mr-2 rounded bg-emerald-100 px-2 py-1 text-[11px] font-bold tracking-wide text-emerald-900">STOCK</span>
              {presets.map((p) => (
                <button key={p.id} type="button" className="rounded border bg-white px-2 py-1 text-[11px] hover:bg-accent" onClick={() => applyPreset(p)}>
                  {p.name}
                </button>
              ))}
              <button type="button" className={`${toolBtn} ml-auto`} onClick={savePreset}>
                <Save className="h-4 w-4 text-slate-600" /> Save size
              </button>
            </div>
            <div className="space-y-2 border-b bg-white p-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-56 flex-1 space-y-1">
                  <Label className="text-xs" htmlFor="materialPick">Cutting material</Label>
                  <Select
                    id="materialPick"
                    value={materialId}
                    onChange={(e) => chooseMaterial(e.target.value)}
                    options={[
                      { value: "", label: "— Custom size (not from the list) —" },
                      ...materials.map((m) => ({
                        value: m.id,
                        label: `${m.name} · ${m.length}×${m.width}${m.thickness ? "×" + m.thickness : ""} · ${m.quantity} in stock`,
                      })),
                    ]}
                  />
                </div>
                <Link href="/dashboard/cutting-plans/materials" className="pb-2 text-xs text-primary underline">
                  Manage materials
                </Link>
              </div>

              {selectedMaterial && (
                <div className="space-y-2 rounded-md border bg-slate-50 p-2 text-sm">
                  <p>
                    In stock:{" "}
                    <strong className={availableStock === 0 ? "text-destructive" : ""}>
                      {availableStock} sheet{availableStock === 1 ? "" : "s"}
                    </strong>
                    {availableStock === 0 && <span className="ml-1 text-xs text-destructive">(out of stock)</span>}
                  </p>
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-0.5 h-4 w-4" checked={deductStock} onChange={(e) => setDeductStock(e.target.checked)} />
                    <span>
                      <strong>Deduct the sheets this plan uses from stock</strong> when I press Accept
                      <span className="block text-xs text-muted-foreground">
                        Leave unticked to plan without changing stock. Changing or archiving the plan later returns the sheets.
                      </span>
                    </span>
                  </label>
                  {result && deductStock && availableStock !== null && (
                    <p className={sheetsNeeded > availableStock ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>
                      This plan uses <strong>{sheetsNeeded}</strong> sheet{sheetsNeeded === 1 ? "" : "s"} →{" "}
                      {sheetsNeeded > availableStock
                        ? `not enough stock (short by ${sheetsNeeded - availableStock})`
                        : `stock after: ${availableStock - sheetsNeeded}`}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={`${th} w-9 text-center`}>#</th>
                    <th className={`${th} w-24`}>Length</th>
                    <th className={`${th} w-24`}>Width</th>
                    <th className={`${th} w-20`}>Quantity</th>
                    <th className={th}>Material</th>
                    <th className={`${th} w-20`}>Thick.</th>
                    <th className={`${th} w-24`}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdBase} bg-emerald-100 text-center text-xs font-medium text-emerald-900`}>1</td>
                    <td className={tdBase}>
                      <input className={cell} type="number" step="any" value={boardLength} onChange={(e) => setBoardLength(e.target.value)} placeholder="2440" />
                    </td>
                    <td className={tdBase}>
                      <input className={cell} type="number" step="any" value={boardWidth} onChange={(e) => setBoardWidth(e.target.value)} placeholder="1220" />
                    </td>
                    <td className={tdBase}>
                      <input className={cell} type="number" min="0" value={boardQuantity} onChange={(e) => setBoardQuantity(e.target.value)} title="0 = unlimited" />
                    </td>
                    <td className={tdBase}>
                      <input className={cell} value={materialName} onChange={(e) => setMaterialName(e.target.value)} placeholder="e.g. wooden colour" />
                    </td>
                    <td className={tdBase}>
                      <input className={cell} type="number" step="any" value={boardThickness} onChange={(e) => setBoardThickness(e.target.value)} placeholder="18" />
                    </td>
                    <td className={tdBase}>
                      <input className={cell} type="number" step="0.01" value={boardPrice} onChange={(e) => setBoardPrice(e.target.value)} placeholder="0.00" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t p-3 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="materialType">Material type</Label>
                <Select id="materialType" value={materialType} onChange={(e) => setMaterialType(e.target.value)} options={MATERIALS} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="unit">Unit</Label>
                <Select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} options={UNITS} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="kerf">Saw kerf ({unit})</Label>
                <Input id="kerf" type="number" step="any" min="0" value={kerf} onChange={(e) => setKerf(e.target.value)} placeholder="3" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Edge trim ({unit})</Label>
                {uniformTrim ? (
                  <Input type="number" step="any" min="0" value={trimUniformVal} onChange={(e) => setTrimUniformVal(e.target.value)} placeholder="0" />
                ) : (
                  <p className="pt-2 text-xs text-muted-foreground">Set per side below</p>
                )}
              </div>
              <label className="col-span-2 flex items-center gap-2 text-xs md:col-span-4">
                <input type="checkbox" checked={!uniformTrim} onChange={(e) => setUniformTrim(!e.target.checked)} className="h-4 w-4" />
                Different trim on each edge
              </label>
              {!uniformTrim && (
                <div className="col-span-2 grid grid-cols-4 gap-2 md:col-span-4">
                  <Input aria-label="Top trim" type="number" step="any" min="0" value={trimTop} onChange={(e) => setTrimTop(e.target.value)} placeholder="Top" />
                  <Input aria-label="Left trim" type="number" step="any" min="0" value={trimLeft} onChange={(e) => setTrimLeft(e.target.value)} placeholder="Left" />
                  <Input aria-label="Bottom trim" type="number" step="any" min="0" value={trimBottom} onChange={(e) => setTrimBottom(e.target.value)} placeholder="Bottom" />
                  <Input aria-label="Right trim" type="number" step="any" min="0" value={trimRight} onChange={(e) => setTrimRight(e.target.value)} placeholder="Right" />
                </div>
              )}
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs" htmlFor="direction">Cutting direction</Label>
                <Select id="direction" value={direction} onChange={(e) => setDirection(e.target.value)} options={DIRECTIONS} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs" htmlFor="grainStrategy">Default grain</Label>
                <Select id="grainStrategy" value={grainStrategy} onChange={(e) => setGrainStrategy(e.target.value)} options={GRAINS} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs" htmlFor="strategy">Cutting strategy</Label>
                <Select id="strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)} options={STRATEGIES} />
              </div>
              <label className="col-span-2 flex items-center gap-2 text-xs md:col-span-2 md:pt-6">
                <input type="checkbox" checked={allowRotation} onChange={(e) => setAllowRotation(e.target.checked)} className="h-4 w-4" />
                Allow piece rotation
              </label>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: RESULT ================= */}
        <div className="min-w-0 overflow-hidden rounded-md border bg-white">
          <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50 px-2 py-1">
            <button type="button" className={toolBtn} onClick={handleGenerate} disabled={generating}>
              <Play className={`h-5 w-5 text-green-600 ${generating ? "animate-pulse" : ""}`} /> {generating ? "Working…" : "Start"}
            </button>
            <button type="button" className={toolBtn} onClick={handleSave} disabled={saving}>
              <Check className="h-5 w-5 text-green-700" /> {saving ? "Saving…" : "Accept"}
            </button>
            <button type="button" className={toolBtn} onClick={() => setPrintOpen(true)} disabled={!result}>
              <Printer className="h-5 w-5 text-slate-600" /> Print
            </button>
            <button type="button" className={toolBtn} onClick={exportFullPlan}>
              <Download className="h-5 w-5 text-slate-600" /> Export
            </button>
            <div className="ml-auto flex flex-wrap items-center gap-3 pr-1 text-xs">
              <label className="flex items-center gap-1"><input type="checkbox" checked={showSizes} onChange={(e) => setShowSizes(e.target.checked)} /> Sizes</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} /> Labels</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} /> Statistics</label>
              <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-7 rounded border bg-white px-1 text-xs" aria-label="Zoom">
                {[50, 75, 100, 125, 150, 200].map((z) => <option key={z} value={z}>{z}%</option>)}
              </select>
            </div>
          </div>

          {!result ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <Sparkles className="h-8 w-8" />
              <p className="font-medium text-foreground">No layout yet</p>
              <p className="max-w-sm text-sm">
                Enter your pieces and the stock sheet size, then press <strong>Start</strong>. Each sheet appears here as a tab,
                with waste hatched and every piece dimensioned.
              </p>
            </div>
          ) : (
            <div>
              {/* sheet tabs */}
              <div role="tablist" className="flex flex-wrap gap-1 border-b bg-slate-50 px-2 pt-2">
                {groups.map((g, i) => (
                  <button
                    key={g.boards.join("-")}
                    role="tab"
                    aria-selected={i === activeIndex}
                    onClick={() => setTab(i)}
                    className={`rounded-t border border-b-0 px-3 py-1 text-xs font-medium ${i === activeIndex ? "bg-white text-primary" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    #{i + 1}{g.quantity > 1 ? ` ×${g.quantity}` : ""}
                  </button>
                ))}
              </div>

              {activeGroup && (
                <div className="p-3">
                  <div className="overflow-auto rounded border bg-white">
                    <div style={{ width: `${zoom}%`, minWidth: zoom >= 100 ? undefined : "40%" }}>
                      <CuttingSheetView
                        layout={activeGroup.layout}
                        boardLength={parseFloat(boardLength) || result.usableLength}
                        boardWidth={parseFloat(boardWidth) || result.usableWidth}
                        trim={{ top: effTrim.trimTop, bottom: effTrim.trimBottom, left: effTrim.trimLeft, right: effTrim.trimRight }}
                        refOrder={refOrder}
                        edges={edgeMap}
                        showSizes={showSizes}
                        showLabels={showLabels}
                        usableLength={result.usableLength}
                        usableWidth={result.usableWidth}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-center text-sm">
                    Quantity= {activeGroup.quantity}; Material= {materialName || materialType.toLowerCase()}; Utilization={" "}
                    {((activeGroup.layout.usedArea / (result.usableLength * result.usableWidth)) * 100).toFixed(2)}%;
                    {activeGroup.quantity > 1 && (
                      <span className="text-muted-foreground"> (sheets {activeGroup.boards.map((b) => `#${b}`).join(", ")} are identical)</span>
                    )}
                  </p>
                </div>
              )}

              {result.unplaced.length > 0 && (
                <div className="mx-3 mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <p className="mb-1 font-semibold text-destructive">Could not place:</p>
                  <ul className="list-disc pl-5">
                    {result.unplaced.map((u, i) => (
                      <li key={i}>{u.name} ×{u.quantity} — {u.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {showStats && (
                <div className="mx-3 mb-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  {[
                    ["Sheets used", String(result.boardsUsed)],
                    ["Layouts", String(groups.length)],
                    ["Pieces placed", String(result.boards.reduce((s, b) => s + b.placements.length, 0))],
                    ["Utilization", `${result.efficiency}%`],
                    ["Material used", `${(result.usedArea / 1_000_000).toFixed(2)} m²`],
                    ["Waste", `${(result.wasteArea / 1_000_000).toFixed(2)} m²`],
                    ["Saw cuts", String(result.totalCuts ?? "—")],
                    [
                      "Largest offcut",
                      result.largestOffcut ? `${Math.round(result.largestOffcut.length)} × ${Math.round(result.largestOffcut.width)}` : "—",
                    ],
                    ...(pricePerSheet > 0 ? [["Material cost", `GHS ${(pricePerSheet * result.boardsUsed).toFixed(2)}`]] : []),
                    ...edgeTotals.map(([code, m]) => [`Edge band ${code}`, `${m.toFixed(2)} m`]),
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border p-2">
                      <p className="text-xs text-muted-foreground">{k}</p>
                      <p className="font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
