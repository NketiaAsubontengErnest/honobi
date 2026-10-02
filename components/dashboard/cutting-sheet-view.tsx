"use client";

import { useMemo } from "react";
import type { BoardLayout, OptimizerResult } from "@/lib/cutting-optimizer";

export interface SheetGroup {
  /** 1-based sheet numbers that share this exact layout */
  boards: number[];
  layout: BoardLayout;
  quantity: number;
}

/** Boards with an identical cut layout are shown once, with a quantity (like professional cutting software). */
export function groupIdenticalBoards(result: OptimizerResult): SheetGroup[] {
  const map = new Map<string, SheetGroup>();
  for (const b of result.boards) {
    const sig = b.placements
      .map((p) => `${p.ref}:${Math.round(p.x * 100)}:${Math.round(p.y * 100)}:${Math.round(p.length * 100)}:${Math.round(p.width * 100)}`)
      .sort()
      .join("|");
    const found = map.get(sig);
    if (found) {
      found.boards.push(b.boardIndex);
      found.quantity += 1;
    } else {
      map.set(sig, { boards: [b.boardIndex], layout: b, quantity: 1 });
    }
  }
  return Array.from(map.values());
}

const fmt = (n: number) => (Math.abs(n - Math.round(n)) < 0.005 ? String(Math.round(n)) : n.toFixed(1));

/** Soft, print-friendly tint per piece row so identical pieces are easy to spot. */
function tint(index: number) {
  const hues = [210, 140, 35, 280, 175, 0, 60, 320];
  return `hsl(${hues[index % hues.length]} 70% 94%)`;
}

export function CuttingSheetView({
  layout,
  boardLength,
  boardWidth,
  trim,
  refOrder,
  showSizes,
  showLabels,
  usableLength,
  usableWidth,
}: {
  layout: BoardLayout;
  boardLength: number;
  boardWidth: number;
  trim: { top: number; bottom: number; left: number; right: number };
  refOrder: string[];
  showSizes: boolean;
  showLabels: boolean;
  usableLength: number;
  usableWidth: number;
}) {
  // viewBox leaves room around the sheet for the dimension labels
  const base = Math.max(boardLength, boardWidth);
  const fs = base / 60;
  const margin = fs * 3.2;
  const vbW = boardLength + margin * 2;
  const vbH = boardWidth + margin * 2;
  const hatchId = useMemo(() => `hatch-${layout.boardIndex}-${Math.round(boardLength)}`, [layout.boardIndex, boardLength]);

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className="h-auto w-full bg-white" role="img" aria-label={`Cutting layout for sheet ${layout.boardIndex}`}>
      <defs>
        <pattern id={hatchId} width={fs * 0.9} height={fs * 0.9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={fs * 0.9} height={fs * 0.9} fill="#fff" />
          <line x1="0" y1="0" x2="0" y2={fs * 0.9} stroke="#6b7280" strokeWidth={fs * 0.09} />
        </pattern>
      </defs>

      {/* sheet dimensions */}
      <text x={margin + boardLength / 2} y={margin - fs * 0.9} textAnchor="middle" fontSize={fs * 1.25} fontWeight="600" fill="#111">
        {fmt(boardLength)}
      </text>
      <text
        x={margin - fs * 0.9}
        y={margin + boardWidth / 2}
        textAnchor="middle"
        fontSize={fs * 1.25}
        fontWeight="600"
        fill="#111"
        transform={`rotate(-90 ${margin - fs * 0.9} ${margin + boardWidth / 2})`}
      >
        {fmt(boardWidth)}
      </text>

      <g transform={`translate(${margin} ${margin})`}>
        {/* whole sheet = waste (hatched) with a red outline */}
        <rect x={0} y={0} width={boardLength} height={boardWidth} fill={`url(#${hatchId})`} stroke="#dc2626" strokeWidth={fs * 0.14} />
        {/* usable area outline (inside the trim) */}
        {(trim.left > 0 || trim.right > 0 || trim.top > 0 || trim.bottom > 0) && (
          <rect x={trim.left} y={trim.top} width={usableLength} height={usableWidth} fill="none" stroke="#16a34a" strokeWidth={fs * 0.08} strokeDasharray={`${fs * 0.5} ${fs * 0.35}`} />
        )}

        {/* pieces */}
        {layout.placements.map((p, i) => {
          const x = trim.left + p.x;
          const y = trim.top + (usableWidth - p.y - p.width);
          const idx = Math.max(0, refOrder.indexOf(p.ref));
          const pieceFs = Math.min(fs, p.width * 0.28, p.length * 0.28);
          const tiny = pieceFs < fs * 0.32;
          const tall = p.width > p.length * 1.6 && p.width > fs * 3;
          return (
            <g key={`${p.ref}-${i}`}>
              <rect x={x} y={y} width={p.length} height={p.width} fill={tint(idx)} stroke="#15803d" strokeWidth={fs * 0.1} />
              {!tiny && (
                <>
                  {showSizes && (
                    <>
                      <text x={x + p.length / 2} y={y + pieceFs * 1.15} textAnchor="middle" fontSize={pieceFs} fill="#111">
                        {fmt(p.length)}
                      </text>
                      <text
                        x={x + pieceFs * 1.15}
                        y={y + p.width / 2}
                        textAnchor="middle"
                        fontSize={pieceFs}
                        fill="#111"
                        transform={`rotate(-90 ${x + pieceFs * 1.15} ${y + p.width / 2})`}
                      >
                        {fmt(p.width)}
                      </text>
                    </>
                  )}
                  {showLabels && p.name && (
                    <text
                      x={x + p.length / 2}
                      y={y + p.width / 2 + pieceFs * 0.35}
                      textAnchor="middle"
                      fontSize={pieceFs * 0.95}
                      fontWeight="600"
                      fill="#111"
                      transform={tall ? `rotate(-90 ${x + p.length / 2} ${y + p.width / 2})` : undefined}
                    >
                      {p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}

        {/* reusable offcuts: show their size inside the hatched area */}
        {showSizes &&
          (layout.offcuts ?? []).slice(0, 4).map((o, i) => {
            const x = trim.left + o.x;
            const y = trim.top + (usableWidth - o.y - o.width);
            const label = `${fmt(o.length)} × ${fmt(o.width)}`;
            const fits = o.length > fs * 6 && o.width > fs * 2.2;
            if (!fits) return null;
            return (
              <g key={`off-${i}`}>
                <rect x={x + o.length / 2 - fs * 3.6} y={y + o.width / 2 - fs * 0.95} width={fs * 7.2} height={fs * 1.7} fill="#fff" opacity="0.92" />
                <text x={x + o.length / 2} y={y + o.width / 2 + fs * 0.3} textAnchor="middle" fontSize={fs * 0.95} fill="#374151">
                  {label}
                </text>
              </g>
            );
          })}
      </g>
    </svg>
  );
}
