"use client";

import { useEffect, useMemo, useState } from "react";
import type { OptimizerResult } from "@/lib/cutting-optimizer";
import { CuttingSheetView, groupIdenticalBoards, type EdgeBands, type SheetGroup } from "./cutting-sheet-view";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  result: OptimizerResult;
  unit: string;
  planName?: string;
  materialName?: string;
  /** full stock sheet size and edge trims, so the print matches the workspace drawing */
  boardLength: number;
  boardWidth: number;
  trim: { top: number; bottom: number; left: number; right: number };
  /** edge bands per piece row (keyed like the layout's piece refs) */
  edges: EdgeBands;
  refOrder: string[];
}

/**
 * Right-side canvas that previews the optimisation as printable A4 sheets.
 * Boards with an identical layout share one sheet (with a quantity), exactly like the workspace tabs.
 * Edge bands (# / HD …) print on the banded sides. Output is clean black-and-white.
 */
export function CuttingPrintPanel({
  open,
  onClose,
  result,
  unit,
  planName,
  materialName,
  boardLength,
  boardWidth,
  trim,
  edges,
  refOrder,
}: Props) {
  const [active, setActive] = useState(0);
  const groups = useMemo(() => groupIdenticalBoards(result), [result]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = groups[Math.min(active, groups.length - 1)];

  const handlePrint = () => {
    // Defer so the (possibly newly generated) print root is laid out first.
    requestAnimationFrame(() => window.print());
  };

  const sheet = (g: SheetGroup, index: number) => {
    const util = (g.layout.usedArea / (result.usableLength * result.usableWidth)) * 100;
    return (
      <div className="text-black">
        <div className="mb-2 flex items-baseline justify-between border-b-2 border-black pb-1">
          <h3 className="text-sm font-bold tracking-wide">
            {planName || "Cut Plan"}
            {materialName ? ` — ${materialName}` : ""}
          </h3>
          <span className="text-xs">
            Sheet #{index + 1}
            {groups.length > 1 ? ` of ${groups.length}` : ""}
            {g.quantity > 1 ? ` · ×${g.quantity}` : ""}
          </span>
        </div>

        <CuttingSheetView
          mono
          layout={g.layout}
          boardLength={boardLength || result.usableLength}
          boardWidth={boardWidth || result.usableWidth}
          trim={trim}
          refOrder={refOrder}
          edges={edges}
          showSizes
          showLabels
          usableLength={result.usableLength}
          usableWidth={result.usableWidth}
        />

        <p className="mt-1 text-center text-xs">
          Quantity= {g.quantity}; Material= {materialName || "—"}; Utilization= {util.toFixed(2)}%;
          {g.quantity > 1 && <> (sheets {g.boards.map((b) => `#${b}`).join(", ")})</>}
        </p>
        <div className="mt-1 flex justify-between text-[11px]">
          <span>
            Sheet: {boardLength || result.usableLength} × {boardWidth || result.usableWidth} {unit}
          </span>
          <span>
            Used {(g.layout.usedArea / 1_000_000).toFixed(2)} m² · Waste {(g.layout.wasteArea / 1_000_000).toFixed(2)} m²
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Print-only styles (A4 landscape, one page per sheet) */}
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        .cut-print-root { position: fixed; left: -100000px; top: 0; }
        @media print {
          body * { visibility: hidden !important; }
          .cut-print-root, .cut-print-root * { visibility: visible !important; }
          .cut-print-root { position: absolute !important; left: 0 !important; top: 0 !important; }
          .cut-print-root .a4-page {
            width: 297mm; min-height: 210mm; box-sizing: border-box;
            padding: 10mm; page-break-after: always; background: #fff; color: #000;
          }
          .cut-print-root .a4-page:last-child { page-break-after: auto; }
        }
      `}</style>

      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30 print:hidden" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-4xl flex-col bg-background shadow-2xl print:hidden">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h2 className="text-base font-semibold">Print Sheet (A4 Landscape)</h2>
            <p className="text-xs text-muted-foreground">
              {result.boardsUsed} board{result.boardsUsed === 1 ? "" : "s"} · {groups.length} layout{groups.length === 1 ? "" : "s"} · one page per layout
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint}>
              <Printer className="mr-1 h-4 w-4" /> Print
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Sheet tabs */}
        <div className="flex gap-1 overflow-x-auto border-b px-2 py-2">
          {groups.map((g, i) => (
            <button
              key={g.boards.join("-")}
              onClick={() => setActive(i)}
              className={
                "shrink-0 rounded-md border px-3 py-1.5 text-sm transition-colors " +
                (i === active ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-muted/40 hover:bg-muted")
              }
            >
              #{i + 1}
              {g.quantity > 1 ? ` ×${g.quantity}` : ""}
            </button>
          ))}
        </div>

        {/* Canvas preview */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4">
          <div className="mx-auto min-h-[210mm] w-full max-w-[297mm] rounded-sm bg-white p-[10mm] text-black shadow-md">
            {current ? sheet(current, Math.min(active, groups.length - 1)) : <p className="text-sm">No sheets to display.</p>}
          </div>
        </div>
      </aside>

      {/* Off-screen print root: every layout on its own A4 page */}
      <div className="cut-print-root" aria-hidden="true">
        {groups.map((g, i) => (
          <div key={g.boards.join("-")} className="a4-page">
            {sheet(g, i)}
          </div>
        ))}
      </div>
    </>
  );
}
