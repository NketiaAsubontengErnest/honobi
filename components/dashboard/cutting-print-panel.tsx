"use client";

import { useEffect, useState } from "react";
import type { OptimizerResult } from "@/lib/cutting-optimizer";
import { BoardDocument } from "./cutting-layout-diagram";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  result: OptimizerResult;
  unit: string;
  planName?: string;
  materialName?: string;
}

/**
 * Right-side canvas that previews the optimisation as printable A4 sheets.
 * Each board becomes its own tab / sheet. Printing outputs one A4 page per
 * board in clean black-and-white.
 */
export function CuttingPrintPanel({ open, onClose, result, unit, planName, materialName }: Props) {
  const [active, setActive] = useState(0);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const boards = result.boards;
  const current = boards[Math.min(active, boards.length - 1)];

  const handlePrint = () => {
    // Defer so the (possibly newly generated) print root is laid out first.
    requestAnimationFrame(() => window.print());
  };

  return (
    <>
      {/* Print-only styles (A4 landscape, one page per board) */}
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
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-4xl bg-background shadow-2xl flex flex-col print:hidden">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h2 className="text-base font-semibold">Print Sheet (A4 Landscape)</h2>
            <p className="text-xs text-muted-foreground">
              {result.boardsUsed} board{result.boardsUsed === 1 ? "" : "s"} · one sheet per board
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Board tabs */}
        <div className="flex gap-1 overflow-x-auto border-b px-2 py-2">
          {boards.map((b, i) => (
            <button
              key={b.boardIndex}
              onClick={() => setActive(i)}
              className={
                "shrink-0 rounded-md px-3 py-1.5 text-sm border transition-colors " +
                (i === active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 hover:bg-muted border-transparent")
              }
            >
              Board {b.boardIndex}
            </button>
          ))}
        </div>

        {/* Canvas preview */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4">
          <div className="mx-auto w-full max-w-[297mm] bg-white text-black shadow-md rounded-sm p-[10mm] min-h-[210mm]">
            {current ? (
              <BoardDocument
                board={current}
                result={result}
                unit={unit}
                planName={planName}
                materialName={materialName}
              />
            ) : (
              <p className="text-sm">No boards to display.</p>
            )}
          </div>
        </div>
      </aside>

      {/* Off-screen print root: every board on its own A4 page */}
      <div className="cut-print-root" aria-hidden="true">
        {boards.map((b) => (
          <div key={b.boardIndex} className="a4-page">
            <BoardDocument
              board={b}
              result={result}
              unit={unit}
              planName={planName}
              materialName={materialName}
            />
          </div>
        ))}
      </div>
    </>
  );
}
