"use client";

import { useId } from "react";
import type { OptimizerResult, BoardLayout } from "@/lib/cutting-optimizer";

/**
 * Black-and-white, PDF-style board renderer.
 * No colour fills, no red cut markers, no numbered badges — just thin black
 * outlines and labels so the layout prints cleanly like a technical drawing.
 * Free (uncut) space is shaded with a light diagonal hatch; placed pieces
 * stay solid white.
 */
function formatDims(p: { length: number; width: number }): string {
  return `${p.length}×${p.width}`;
}

export function BoardSheet({
  board,
  usableLength,
  usableWidth,
  className,
}: {
  board: BoardLayout;
  usableLength: number;
  usableWidth: number;
  className?: string;
}) {
  const strokeW = Math.max(usableLength / 600, 0.8);
  const cutW = Math.max(usableLength / 450, 1);
  const fontSize = Math.max(9, usableWidth / 32);
  const hatchId = `hatch-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const hatchGap = Math.max(usableLength / 60, 12);

  return (
    <svg
      viewBox={`0 0 ${usableLength} ${usableWidth}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      <defs>
        <pattern
          id={hatchId}
          width={hatchGap}
          height={hatchGap}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={hatchGap} height={hatchGap} fill="#ffffff" />
          <line x1={0} y1={0} x2={0} y2={hatchGap} stroke="#9ca3af" strokeWidth={hatchGap / 6} />
        </pattern>
      </defs>
      {/* board outline — hatched fill shows through wherever nothing is placed */}
      <rect x={0} y={0} width={usableLength} height={usableWidth} fill={`url(#${hatchId})`} stroke="#000000" strokeWidth={strokeW * 1.4} />

      {/* pieces */}
      {board.placements.map((p, i) => {
        const top = usableWidth - p.y - p.width;
        return (
          <g key={i}>
            <rect
              x={p.x}
              y={top}
              width={p.length}
              height={p.width}
              fill="#ffffff"
              stroke="#000000"
              strokeWidth={strokeW}
            />
            <text
              x={p.x + p.length / 2}
              y={top + p.width / 2 - fontSize * 0.35}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fill="#000000"
            >
              {p.name.length > 16 ? `${p.name.slice(0, 15)}…` : p.name}
            </text>
            <text
              x={p.x + p.length / 2}
              y={top + p.width / 2 + fontSize * 0.85}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize * 0.8}
              fill="#000000"
            >
              {formatDims(p)}
            </text>
          </g>
        );
      })}

      {/* cut lines — thin black, no numbers, no red */}
      {board.cuts.map((c) => {
        if (c.orientation === "HORIZONTAL") {
          const y = usableWidth - c.position;
          return (
            <line
              key={`c${c.order}`}
              x1={c.spanStart}
              y1={y}
              x2={c.spanEnd}
              y2={y}
              stroke="#000000"
              strokeWidth={cutW}
              strokeDasharray={`${usableLength / 80} ${usableLength / 120}`}
            />
          );
        }
        const x = c.position;
        return (
          <line
            key={`c${c.order}`}
            x1={x}
            y1={usableWidth - c.spanStart}
            x2={x}
            y2={usableWidth - c.spanEnd}
            stroke="#000000"
            strokeWidth={cutW}
            strokeDasharray={`${usableLength / 80} ${usableLength / 120}`}
          />
        );
      })}
    </svg>
  );
}

/**
 * A full "document" for one board: title block + sheet (no cut list).
 * Reused both by the on-screen preview and the A4 print sheet.
 */
export function BoardDocument({
  board,
  result,
  unit,
  planName,
  materialName,
}: {
  board: BoardLayout;
  result: OptimizerResult;
  unit: string;
  planName?: string;
  materialName?: string;
}) {
  return (
    <div className="text-black">
      <div className="flex items-baseline justify-between border-b-2 border-black pb-1 mb-2">
        <h3 className="text-sm font-bold tracking-wide">
          {planName || "Cut Plan"}
          {materialName ? ` — ${materialName}` : ""}
        </h3>
        <span className="text-xs">
          Sheet {board.boardIndex}/{result.boardsUsed}
        </span>
      </div>

      <BoardSheet
        board={board}
        usableLength={result.usableLength}
        usableWidth={result.usableWidth}
        className="w-full h-auto border border-black"
      />

      <div className="flex justify-between text-[11px] mt-1">
        <span>
          Board: {result.usableLength} × {result.usableWidth} {unit}
        </span>
        <span>
          Used {(board.usedArea / 1_000_000).toFixed(2)} m² · Waste {(board.wasteArea / 1_000_000).toFixed(2)} m²
        </span>
      </div>
    </div>
  );
}

/** Compact grid of all boards (kept for backward compatibility), B/W, un-numbered. */
export function CuttingLayoutDiagram({
  result,
  unit = "mm",
}: {
  result: OptimizerResult;
  unit?: string;
}) {
  if (!result.boards.length) {
    return <p className="text-sm text-muted-foreground">No placements generated.</p>;
  }
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {result.boards.map((b) => (
        <div key={b.boardIndex} className="space-y-1">
          <p className="text-sm font-semibold">Sheet {b.boardIndex}</p>
          <BoardSheet
            board={b}
            usableLength={result.usableLength}
            usableWidth={result.usableWidth}
            className="w-full h-auto border rounded bg-white"
          />
          <p className="text-xs text-muted-foreground">
            Used {(b.usedArea / 1_000_000).toFixed(2)} m² · Waste {(b.wasteArea / 1_000_000).toFixed(2)} m² · Unit {unit}
          </p>
        </div>
      ))}
    </div>
  );
}
