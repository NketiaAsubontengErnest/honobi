// ============================================================
// HONOBI Wood Cutting Optimizer — 2D guillotine nesting engine
// Pure TypeScript, usable on both the server (actions) and the
// client (live preview in the plan builder). No DB imports here.
//
// Strategy: a multi-start guillotine packer.
//  * every piece is tried on ALL open boards (not just the last one),
//    so small pieces back-fill the leftovers of earlier boards
//  * several piece orderings x fit rules x guillotine split rules are
//    evaluated, plus seeded random restarts
//  * the best result wins: fewest unplaced pieces -> fewest boards ->
//    largest reusable offcut -> fewest cuts
// The output is deterministic for a given input.
// ============================================================

export type GrainOption = "NONE" | "LENGTH" | "WIDTH";
export type DirectionOption = "HORIZONTAL" | "VERTICAL" | "AUTOMATIC";

export interface OptimizerPiece {
  /** stable key referencing the piece row in the form */
  ref: string;
  name: string;
  length: number;
  width: number;
  quantity: number;
  grain: GrainOption;
  allowRotation: boolean;
}

export interface OptimizerSettings {
  boardLength: number;
  boardWidth: number;
  boardQuantity: number; // max boards available (0 = unlimited)
  kerf: number;
  trimTop: number;
  trimBottom: number;
  trimLeft: number;
  trimRight: number;
  direction: DirectionOption;
  allowRotation: boolean; // global rotation switch
  grainStrategy: GrainOption; // plan-level default grain rule
}

export interface Placement {
  ref: string;
  name: string;
  x: number; // distance along board length (from trimLeft edge)
  y: number; // distance along board width (from trimBottom edge)
  length: number; // actual footprint length after orientation applied
  width: number;
  rotated: boolean;
}

export interface CutStep {
  order: number;
  orientation: "HORIZONTAL" | "VERTICAL";
  /** position of the cut line (blade centre), measured in board coordinates */
  position: number;
  /** the cut spans from this coordinate to spanEnd (cross axis) */
  spanStart: number;
  spanEnd: number;
}

/** A leftover rectangle that is large enough to be worth keeping. */
export interface Offcut {
  x: number;
  y: number;
  length: number;
  width: number;
}

export interface BoardLayout {
  boardIndex: number;
  placements: Placement[];
  usedArea: number;
  wasteArea: number;
  cuts: CutStep[];
  /** reusable remnants left on this board, largest first */
  offcuts?: Offcut[];
}

export interface UnplacedPiece {
  ref: string;
  name: string;
  length: number;
  width: number;
  quantity: number;
  reason: string;
}

export interface OptimizerResult {
  boards: BoardLayout[];
  boardsUsed: number;
  boardsAvailable: number;
  totalPieceArea: number;
  totalBoardArea: number;
  usedArea: number;
  wasteArea: number;
  efficiency: number; // %
  usableLength: number;
  usableWidth: number;
  unplaced: UnplacedPiece[];
  /** total number of saw cuts across all boards */
  totalCuts?: number;
  /** the biggest single reusable remnant across all boards */
  largestOffcut?: Offcut | null;
  /** how many packing variants were evaluated */
  variantsTried?: number;
}

interface Rect {
  x: number;
  y: number;
  length: number;
  width: number;
}

interface Orientation {
  length: number;
  width: number;
  rotated: boolean;
}

interface Unit {
  piece: OptimizerPiece;
  orientations: Orientation[];
  area: number;
  longSide: number;
  shortSide: number;
}

type FitRule = "BSSF" | "BLSF" | "BAF"; // best short / long side / area fit
type SplitRule = "H" | "V" | "SLAS" | "LLAS" | "MAXA" | "BAL";
type SortRule = "AREA" | "LONG" | "SHORT" | "PERIM";

const MIN_SLIVER = 0.01; // ignore leftover rects thinner than this
const FITS: FitRule[] = ["BSSF", "BAF", "BLSF"];
const SPLITS: SplitRule[] = ["SLAS", "LLAS", "MAXA", "BAL", "H", "V"];
const SORTS: SortRule[] = ["AREA", "LONG", "SHORT", "PERIM"];

/** Allowed footprints (length x width) for a piece given rotation/grain/direction rules */
function allowedOrientations(p: OptimizerPiece, s: OptimizerSettings): Orientation[] {
  const grain = p.grain !== "NONE" ? p.grain : s.grainStrategy;
  const canRotate = p.allowRotation && s.allowRotation;

  const normal = { length: p.length, width: p.width, rotated: false };
  const turned = { length: p.width, width: p.length, rotated: true };

  let options: Orientation[];

  if (grain === "LENGTH") options = [normal];
  else if (grain === "WIDTH") options = [turned];
  else options = canRotate ? [normal, turned] : [normal];

  if (s.direction === "HORIZONTAL") options = options.filter((o) => !o.rotated);
  else if (s.direction === "VERTICAL") options = options.filter((o) => o.rotated);

  // If constraints contradict (e.g. grain WIDTH + HORIZONTAL), fall back to the
  // grain-respecting footprint rather than silently dropping the piece.
  if (options.length === 0) {
    if (grain === "LENGTH") options = [normal];
    else if (grain === "WIDTH") options = [turned];
    else options = [normal];
  }
  // A square piece has one distinct footprint
  return options.filter((o, i) => i === 0 || o.length !== options[0].length || o.width !== options[0].width);
}

/** Small deterministic PRNG so results are repeatable. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface WorkBoard {
  open: Rect[];
  placements: Placement[];
  used: number;
  cuts: CutStep[];
  order: number;
}

interface PackOutcome {
  boards: WorkBoard[];
  unplaced: { piece: OptimizerPiece; reason: string }[];
  totalCuts: number;
  largestFree: number;
}

interface Candidate {
  board: WorkBoard;
  rectIndex: number;
  o: Orientation;
  p1: number;
  p2: number;
}

function fitScore(rect: Rect, o: Orientation, fit: FitRule): [number, number] {
  const dl = rect.length - o.length;
  const dw = rect.width - o.width;
  const short = Math.min(dl, dw);
  const long = Math.max(dl, dw);
  if (fit === "BSSF") return [short, long];
  if (fit === "BLSF") return [long, short];
  return [rect.length * rect.width - o.length * o.width, short];
}

function bestInBoard(board: WorkBoard, unit: Unit, fit: FitRule): Candidate | null {
  let best: Candidate | null = null;
  for (let i = 0; i < board.open.length; i++) {
    const rect = board.open[i];
    for (const o of unit.orientations) {
      if (o.length > rect.length + MIN_SLIVER || o.width > rect.width + MIN_SLIVER) continue;
      const [p1, p2] = fitScore(rect, o, fit);
      if (
        !best ||
        p1 < best.p1 - MIN_SLIVER ||
        (Math.abs(p1 - best.p1) <= MIN_SLIVER && p2 < best.p2 - MIN_SLIVER)
      ) {
        best = { board, rectIndex: i, o, p1, p2 };
      }
    }
  }
  return best;
}

/** true => cut across the full rect first (top strip is full length) */
function horizontalFirst(split: SplitRule, rect: Rect, o: Orientation, kerf: number): boolean {
  const dl = rect.length - o.length;
  const dw = rect.width - o.width;
  switch (split) {
    case "H":
      return true;
    case "V":
      return false;
    case "SLAS":
      return dl < dw;
    case "LLAS":
      return dl >= dw;
    default: {
      const top = Math.max(0, dw - kerf);
      const right = Math.max(0, dl - kerf);
      const areasH = [rect.length * top, right * o.width];
      const areasV = [right * rect.width, o.length * top];
      if (split === "MAXA") return Math.max(...areasH) >= Math.max(...areasV);
      return Math.min(...areasH) >= Math.min(...areasV); // BAL: most balanced pair
    }
  }
}

function place(c: Candidate, unit: Unit, kerf: number, split: SplitRule) {
  const { board, o } = c;
  const rect = board.open[c.rectIndex];

  board.placements.push({
    ref: unit.piece.ref,
    name: unit.piece.name,
    x: rect.x,
    y: rect.y,
    length: o.length,
    width: o.width,
    rotated: o.rotated,
  });
  board.used += o.length * o.width;
  board.open.splice(c.rectIndex, 1);

  const topHeight = rect.width - o.width - kerf;
  const rightLength = rect.length - o.length - kerf;
  const hCutPos = rect.y + o.width + kerf / 2;
  const vCutPos = rect.x + o.length + kerf / 2;

  if (horizontalFirst(split, rect, o, kerf)) {
    // 1) cut across the whole rect above the piece, 2) cut beside it in the lower band
    if (topHeight > MIN_SLIVER) {
      board.cuts.push({ order: ++board.order, orientation: "HORIZONTAL", position: hCutPos, spanStart: rect.x, spanEnd: rect.x + rect.length });
      board.open.push({ x: rect.x, y: rect.y + o.width + kerf, length: rect.length, width: topHeight });
    }
    if (rightLength > MIN_SLIVER) {
      board.cuts.push({ order: ++board.order, orientation: "VERTICAL", position: vCutPos, spanStart: rect.y, spanEnd: rect.y + o.width });
      board.open.push({ x: rect.x + o.length + kerf, y: rect.y, length: rightLength, width: o.width });
    }
  } else {
    // 1) cut down the whole rect beside the piece, 2) cut above it in the left column
    if (rightLength > MIN_SLIVER) {
      board.cuts.push({ order: ++board.order, orientation: "VERTICAL", position: vCutPos, spanStart: rect.y, spanEnd: rect.y + rect.width });
      board.open.push({ x: rect.x + o.length + kerf, y: rect.y, length: rightLength, width: rect.width });
    }
    if (topHeight > MIN_SLIVER) {
      board.cuts.push({ order: ++board.order, orientation: "HORIZONTAL", position: hCutPos, spanStart: rect.x, spanEnd: rect.x + o.length });
      board.open.push({ x: rect.x, y: rect.y + o.width + kerf, length: o.length, width: topHeight });
    }
  }
}

function pack(
  units: Unit[],
  s: OptimizerSettings,
  usableLength: number,
  usableWidth: number,
  maxBoards: number,
  fit: FitRule,
  split: SplitRule
): PackOutcome {
  const boards: WorkBoard[] = [];
  const unplaced: PackOutcome["unplaced"] = [];

  for (const unit of units) {
    let best: Candidate | null = null;
    for (const b of boards) {
      const cand = bestInBoard(b, unit, fit);
      if (cand && (!best || cand.p1 < best.p1 - MIN_SLIVER || (Math.abs(cand.p1 - best.p1) <= MIN_SLIVER && cand.p2 < best.p2 - MIN_SLIVER))) {
        best = cand;
      }
    }

    if (!best) {
      const fitsFresh = unit.orientations.some((o) => o.length <= usableLength + MIN_SLIVER && o.width <= usableWidth + MIN_SLIVER);
      if (!fitsFresh) {
        unplaced.push({ piece: unit.piece, reason: `Piece does not fit on a ${usableLength} x ${usableWidth} board` });
        continue;
      }
      if (boards.length >= maxBoards) {
        unplaced.push({ piece: unit.piece, reason: `Ran out of available boards (${maxBoards})` });
        continue;
      }
      const fresh: WorkBoard = {
        open: [{ x: 0, y: 0, length: usableLength, width: usableWidth }],
        placements: [],
        used: 0,
        cuts: [],
        order: 0,
      };
      boards.push(fresh);
      best = bestInBoard(fresh, unit, fit);
      if (!best) continue; // unreachable: fitsFresh guarantees a candidate
    }

    place(best, unit, s.kerf, split);
  }

  let totalCuts = 0;
  let largestFree = 0;
  for (const b of boards) {
    totalCuts += b.cuts.length;
    for (const r of b.open) largestFree = Math.max(largestFree, r.length * r.width);
  }
  return { boards, unplaced, totalCuts, largestFree };
}

function isBetter(a: PackOutcome, b: PackOutcome | null): boolean {
  if (!b) return true;
  if (a.unplaced.length !== b.unplaced.length) return a.unplaced.length < b.unplaced.length;
  if (a.boards.length !== b.boards.length) return a.boards.length < b.boards.length;
  if (Math.abs(a.largestFree - b.largestFree) > 1) return a.largestFree > b.largestFree;
  return a.totalCuts < b.totalCuts;
}

function sortKey(u: Unit, rule: SortRule): number {
  switch (rule) {
    case "LONG":
      return u.longSide * 1e6 + u.area;
    case "SHORT":
      return u.shortSide * 1e6 + u.area;
    case "PERIM":
      return (u.longSide + u.shortSide) * 1e6 + u.area;
    default:
      return u.area;
  }
}

/**
 * Optimise a cutting plan. Pieces are expanded to individual units and packed
 * by several guillotine heuristics; the best layout found is returned.
 */
export function optimizeCuttingPlan(
  pieces: OptimizerPiece[],
  settings: OptimizerSettings
): OptimizerResult {
  const usableLength = settings.boardLength - settings.trimLeft - settings.trimRight;
  const usableWidth = settings.boardWidth - settings.trimTop - settings.trimBottom;

  const result: OptimizerResult = {
    boards: [],
    boardsUsed: 0,
    boardsAvailable: settings.boardQuantity,
    totalPieceArea: 0,
    totalBoardArea: 0,
    usedArea: 0,
    wasteArea: 0,
    efficiency: 0,
    usableLength,
    usableWidth,
    unplaced: [],
    totalCuts: 0,
    largestOffcut: null,
    variantsTried: 0,
  };

  if (usableLength <= 0 || usableWidth <= 0) {
    for (const p of pieces) {
      result.unplaced.push({ ref: p.ref, name: p.name, length: p.length, width: p.width, quantity: p.quantity, reason: "Board usable area is zero — check trim values" });
    }
    return result;
  }

  // Expand to individual units
  const units: Unit[] = [];
  const invalid: UnplacedPiece[] = [];
  for (const p of pieces) {
    const total = Math.max(1, Math.floor(p.quantity));
    if (!(p.length > 0) || !(p.width > 0)) {
      invalid.push({ ref: p.ref, name: p.name, length: p.length, width: p.width, quantity: total, reason: "Invalid dimensions" });
      continue;
    }
    const orientations = allowedOrientations(p, settings);
    const unit: Unit = {
      piece: p,
      orientations,
      area: p.length * p.width,
      longSide: Math.max(p.length, p.width),
      shortSide: Math.min(p.length, p.width),
    };
    for (let i = 0; i < total; i++) units.push(unit);
  }

  const maxBoards = settings.boardQuantity > 0 ? settings.boardQuantity : Number.MAX_SAFE_INTEGER;
  const boardArea = usableLength * usableWidth;
  const lowerBound = Math.max(1, Math.ceil(units.reduce((s, u) => s + u.area, 0) / boardArea));

  let best: PackOutcome | null = null;
  let tried = 0;
  const consider = (ordered: Unit[], fit: FitRule, split: SplitRule): boolean => {
    const outcome = pack(ordered, settings, usableLength, usableWidth, maxBoards, fit, split);
    tried++;
    if (isBetter(outcome, best)) best = outcome;
    // Reached the theoretical minimum number of boards with everything placed
    return !!best && best.unplaced.length === 0 && best.boards.length <= lowerBound;
  };

  if (units.length > 0) {
    // 1) deterministic grid: sort rule x fit rule x split rule
    let done = false;
    for (const sortRule of SORTS) {
      const ordered = [...units].sort((a, b) => sortKey(b, sortRule) - sortKey(a, sortRule));
      for (const fit of FITS) {
        for (const split of SPLITS) {
          if (consider(ordered, fit, split)) {
            done = true;
            break;
          }
        }
        if (done) break;
      }
      if (done) break;
    }

    // 2) seeded random restarts (perturbed orderings), budget scales down with size
    if (!done) {
      const iterations = units.length <= 40 ? 300 : units.length <= 120 ? 120 : units.length <= 400 ? 30 : 8;
      const rand = mulberry32(units.length * 2654435761 + Math.round(boardArea));
      for (let i = 0; i < iterations && !done; i++) {
        const rule = SORTS[Math.floor(rand() * SORTS.length)];
        const noise = 0.1 + rand() * 0.5;
        const keyed = units.map((u) => ({ u, k: sortKey(u, rule) * (1 - noise / 2 + rand() * noise) }));
        keyed.sort((a, b) => b.k - a.k);
        done = consider(
          keyed.map((x) => x.u),
          FITS[Math.floor(rand() * FITS.length)],
          SPLITS[Math.floor(rand() * SPLITS.length)]
        );
      }
    }
  }

  const final = best as PackOutcome | null;
  const boards: BoardLayout[] = (final?.boards ?? [])
    .filter((b) => b.placements.length > 0)
    .map((b, i) => {
      const offcuts = b.open
        .filter((r) => r.length * r.width >= boardArea * 0.005)
        .sort((a, c) => c.length * c.width - a.length * a.width)
        .slice(0, 8)
        .map((r) => ({ x: r.x, y: r.y, length: r.length, width: r.width }));
      return {
        boardIndex: i + 1,
        placements: b.placements,
        usedArea: b.used,
        wasteArea: boardArea - b.used,
        cuts: b.cuts,
        offcuts,
      };
    });

  result.boards = boards;
  result.boardsUsed = boards.length;
  result.totalBoardArea = boards.length * boardArea;
  result.usedArea = boards.reduce((s, b) => s + b.usedArea, 0);
  result.totalPieceArea = result.usedArea;
  result.wasteArea = result.totalBoardArea - result.usedArea;
  result.efficiency =
    result.totalBoardArea > 0 ? Math.round((result.usedArea / result.totalBoardArea) * 10000) / 100 : 0;
  result.totalCuts = boards.reduce((s, b) => s + b.cuts.length, 0);
  result.variantsTried = tried;

  let biggest: Offcut | null = null;
  for (const b of boards) {
    for (const o of b.offcuts ?? []) {
      if (!biggest || o.length * o.width > biggest.length * biggest.width) biggest = o;
    }
  }
  result.largestOffcut = biggest;

  // Collect unplaced pieces, merged by ref
  const merged = new Map<string, UnplacedPiece>();
  const addUnplaced = (u: UnplacedPiece) => {
    const existing = merged.get(u.ref);
    if (existing) existing.quantity += u.quantity;
    else merged.set(u.ref, { ...u });
  };
  invalid.forEach(addUnplaced);
  for (const u of final?.unplaced ?? []) {
    addUnplaced({ ref: u.piece.ref, name: u.piece.name, length: u.piece.length, width: u.piece.width, quantity: 1, reason: u.reason });
  }
  result.unplaced = Array.from(merged.values());

  return result;
}
