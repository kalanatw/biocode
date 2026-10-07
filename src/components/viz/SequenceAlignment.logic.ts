export interface Scoring {
  match: number;
  mismatch: number;
  gap: number;
}

export type Move = "diag" | "up" | "left" | "start";

export interface Alignment {
  /** H[i][j] = best score aligning a[0..i) with b[0..j). */
  H: number[][];
  /** Traceback pointer cells (all optimal predecessors). */
  ptr: Move[][][];
  /** Path of cells from (m,n) back to (0,0). */
  path: [number, number][];
  top: string;
  mid: string;
  bottom: string;
  score: number;
}

/** Score of a single cell and the three candidate values. */
export function cellCandidates(H: number[][], a: string, b: string, i: number, j: number, s: Scoring) {
  const diag = H[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? s.match : s.mismatch);
  const up = H[i - 1][j] + s.gap;
  const left = H[i][j - 1] + s.gap;
  return { diag, up, left, best: Math.max(diag, up, left) };
}

/** Needleman–Wunsch global alignment with linear gap penalty. Traceback preference: diagonal, up, left. */
export function needlemanWunsch(a: string, b: string, s: Scoring): Alignment {
  const m = a.length;
  const n = b.length;
  const H: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  const ptr: Move[][][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => [] as Move[]));
  for (let i = 1; i <= m; i++) {
    H[i][0] = i * s.gap;
    ptr[i][0] = ["up"];
  }
  for (let j = 1; j <= n; j++) {
    H[0][j] = j * s.gap;
    ptr[0][j] = ["left"];
  }
  ptr[0][0] = ["start"];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = cellCandidates(H, a, b, i, j, s);
      H[i][j] = c.best;
      const moves: Move[] = [];
      if (c.diag === c.best) moves.push("diag");
      if (c.up === c.best) moves.push("up");
      if (c.left === c.best) moves.push("left");
      ptr[i][j] = moves;
    }
  }
  const path: [number, number][] = [[m, n]];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const mv = ptr[i][j][0];
    if (mv === "diag") {
      i--;
      j--;
    } else if (mv === "up") i--;
    else j--;
    path.push([i, j]);
  }
  const { top, mid, bottom } = partialAlignment(a, b, ptr, path, path.length - 1);
  return { H, ptr, path, top, mid, bottom, score: H[m][n] };
}

/** Alignment rows produced by the first `moves` traceback steps (built from the end backwards). */
export function partialAlignment(a: string, b: string, ptr: Move[][][], path: [number, number][], moves: number) {
  let top = "";
  let mid = "";
  let bottom = "";
  for (let k = 0; k < moves && k < path.length - 1; k++) {
    const [i, j] = path[k];
    const mv = ptr[i][j][0];
    if (mv === "diag") {
      top = a[i - 1] + top;
      bottom = b[j - 1] + bottom;
      mid = (a[i - 1] === b[j - 1] ? "|" : " ") + mid;
    } else if (mv === "up") {
      top = a[i - 1] + top;
      bottom = "-" + bottom;
      mid = " " + mid;
    } else {
      top = "-" + top;
      bottom = b[j - 1] + bottom;
      mid = " " + mid;
    }
  }
  return { top, mid, bottom };
}

/** Uppercase, letters only, max length. */
export function cleanSequence(raw: string, max = 12): string {
  return raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, max);
}
