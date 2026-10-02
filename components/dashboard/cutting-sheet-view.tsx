"use client";

import { useId } from "react";
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

export type EdgeBands = Record<string, { top?: string; left?: string; bottom?: string; right?: string }>;

export function CuttingSheetView({
  layout,
  boardLength,
  boardWidth,
  trim,
  refOrder,
  edges = {},
  mono = false,
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
  edges?: EdgeBands;
  /** black-and-white drawing for printing */
  mono?: boolean;
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
  const hatchId = `hatch${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

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
        <rect x={0} y={0} width={boardLength} height={boardWidth} fill={`url(#${hatchId})`} stroke={mono ? "#000" : "#dc2626"} strokeWidth={fs * 0.14} />
        {/* usable area outline (inside the trim) */}
        {(trim.left > 0 || trim.right > 0 || trim.top > 0 || trim.bottom > 0) && (
          <rect x={trim.left} y={trim.top} width={usableLength} height={usableWidth} fill="none" stroke={mono ? "#6b7280" : "#16a34a"} strokeWidth={fs * 0.08} strokeDasharray={`${fs * 0.5} ${fs * 0.35}`} />
        )}

        {/* pieces */}
        {layout.placements.map((p, i) => {
          const x = trim.left + p.x;
          const y = trim.top + (usableWidth - p.y - p.width);
          const idx = Math.max(0, refOrder.indexOf(p.ref));

          // Edge bands are defined for the piece as entered; a rotated piece turns clockwise
          const e = edges[p.ref] ?? {};
          const side = p.rotated
            ? { top: e.left, right: e.top, bottom: e.right, left: e.bottom }
            : { top: e.top, right: e.right, bottom: e.bottom, left: e.left };
          const banded = [side.top, side.right, side.bottom, side.left].filter(Boolean) as string[];

          const pieceFs = Math.min(fs, p.width * 0.28, p.length * 0.28);
          const tiny = pieceFs < fs * 0.32;
          const tall = p.width > p.length * 1.6 && p.width > fs * 3;
          // very thin strips get one combined "L x W" line instead of separate labels
          const thinH = !tiny && p.width < fs * 3.4;
          const thinV = !tiny && !thinH && p.length < fs * 3.4;
          const cx = x + p.length / 2;
          const cy = y + p.width / 2;
          const combined = `${fmt(p.length)}x${fmt(p.width)}${banded.length ? "\u00A0\u00A0" + Array.from(new Set(banded)).join("\u00A0") : ""}`;

          // Band markers (# or a name like HD) sit on the banded side only:
          //   top    -> centred under the length number
          //   bottom -> centred on the bottom edge
          //   left   -> rotated, side by side with the width number
          //   right  -> rotated, on the right edge
          const mFs = pieceFs * 0.85;
          const gap = mFs * 1.2;
          const edgeInset = mFs * 0.45;
          const markers = !tiny && !thinH && !thinV && showSizes;
          const widthNumX = x + pieceFs * 1.15;

          return (
            <g key={`${p.ref}-${i}`}>
              <rect x={x} y={y} width={p.length} height={p.width} fill={mono ? "#fff" : tint(idx)} stroke={mono ? "#000" : "#15803d"} strokeWidth={fs * 0.1} />

              {!tiny && thinH && showSizes && (
                <text x={cx} y={cy + Math.min(fs, p.width * 0.5) * 0.35} textAnchor="middle" fontSize={Math.min(fs, p.width * 0.5)} fill="#111">
                  {combined}
                </text>
              )}
              {!tiny && thinV && showSizes && (
                <text x={cx} y={cy} textAnchor="middle" fontSize={Math.min(fs, p.length * 0.5)} fill="#111" transform={`rotate(-90 ${cx} ${cy})`}>
                  {combined}
                </text>
              )}

              {!tiny && !thinH && !thinV && (
                <>
                  {showSizes && (
                    <>
                      <text x={cx} y={y + pieceFs * 1.15} textAnchor="middle" fontSize={pieceFs} fill="#111">
                        {fmt(p.length)}
                      </text>
                      <text x={widthNumX} y={cy} textAnchor="middle" fontSize={pieceFs} fill="#111" transform={`rotate(-90 ${widthNumX} ${cy})`}>
                        {fmt(p.width)}
                      </text>
                    </>
                  )}
                  {showLabels && p.name && (
                    <text
                      x={cx}
                      y={cy + pieceFs * 0.35}
                      textAnchor="middle"
                      fontSize={pieceFs * 0.95}
                      fontWeight="600"
                      fill="#111"
                      transform={tall ? `rotate(-90 ${cx} ${cy})` : undefined}
                    >
                      {p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name}
                    </text>
                  )}
                </>
              )}

              {markers && side.top && (
                <text x={cx} y={y + pieceFs * 1.15 + gap} textAnchor="middle" fontSize={mFs} fill="#111">
                  {side.top}
                </text>
              )}
              {markers && side.bottom && (
                <text x={cx} y={y + p.width - edgeInset} textAnchor="middle" fontSize={mFs} fill="#111">
                  {side.bottom}
                </text>
              )}
              {markers && side.left && (
                <text
                  x={widthNumX + gap}
                  y={cy}
                  textAnchor="middle"
                  fontSize={mFs}
                  fill="#111"
                  transform={`rotate(-90 ${widthNumX + gap} ${cy})`}
                >
                  {side.left}
                </text>
              )}
              {markers && side.right && (
                <text
                  x={x + p.length - edgeInset}
                  y={cy}
                  textAnchor="middle"
                  fontSize={mFs}
                  fill="#111"
                  transform={`rotate(-90 ${x + p.length - edgeInset} ${cy})`}
                >
                  {side.right}
                </text>
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
