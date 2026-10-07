import { useEffect, useMemo, useState } from "react";
import { VizFrame } from "./VizFrame";
import { useInView } from "../../hooks/useInView";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cellCandidates, cleanSequence, needlemanWunsch, partialAlignment } from "./SequenceAlignment.logic";

const ARROW = { diag: "↖", up: "↑", left: "←", start: "" } as const;
const sgn = (x: number) => (x > 0 ? `+${x}` : x < 0 ? `−${Math.abs(x)}` : "0");

function NumField(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label>
      {props.label}
      <input type="number" min={-9} max={9} step={1} value={props.value}
        onChange={(e) => props.onChange(Math.max(-9, Math.min(9, Math.round(Number(e.target.value) || 0))))}
        style={{ width: 58, background: "var(--glass)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px", fontFamily: "var(--font-mono)" }} />
    </label>
  );
}

function SeqField(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      {props.label}
      <input type="text" value={props.value} maxLength={12} spellCheck={false} autoCapitalize="characters"
        onChange={(e) => props.onChange(cleanSequence(e.target.value))}
        style={{ width: 150, background: "var(--glass)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 10px", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }} />
    </label>
  );
}

export default function SequenceAlignment() {
  const [a, setA] = useState("GATTACA");
  const [b, setB] = useState("GCATGCU");
  const [match, setMatch] = useState(1);
  const [mismatch, setMismatch] = useState(-1);
  const [gap, setGap] = useState(-1);
  const [prog, setProg] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();

  const m = a.length;
  const n = b.length;
  const res = useMemo(() => needlemanWunsch(a, b, { match, mismatch, gap }), [a, b, match, mismatch, gap]);
  const total = m * n;
  const end = total + res.path.length;
  const fill = Math.min(prog, total);
  const tb = Math.max(0, prog - total);
  const done = prog >= end;

  const reset = () => { setProg(0); setPlaying(false); };
  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); reset(); };

  useEffect(() => {
    if (!playing || !inView || done || reduced) return;
    const id = setInterval(() => setProg((p) => Math.min(p + 1, end)), 140);
    return () => clearInterval(id);
  }, [playing, inView, done, reduced, end]);

  const onPath = new Map<string, number>();
  res.path.slice(0, tb).forEach(([i, j], k) => onPath.set(`${i},${j}`, k));
  const curIdx = fill - 1;
  const cur: [number, number] | null = tb === 0 && fill > 0 ? [Math.floor(curIdx / n) + 1, (curIdx % n) + 1] : null;
  const part = partialAlignment(a, b, res.ptr, res.path, Math.max(0, tb - 1));
  const width = Math.max(m, n) + Math.abs(m - n) + 1;

  let readout: string;
  if (m === 0 || n === 0) readout = "Enter two non-empty sequences.";
  else if (prog === 0) readout = "First row and column are the gap penalty × position (aligning a prefix against nothing). Press Step or Play to fill the rest.";
  else if (cur) {
    const [i, j] = cur;
    const c = cellCandidates(res.H, a, b, i, j, { match, mismatch, gap });
    const same = a[i - 1] === b[j - 1];
    readout = `Cell (${a[i - 1]}, ${b[j - 1]}): diagonal ${res.H[i - 1][j - 1]} ${sgn(same ? match : mismatch)} (${same ? "match" : "mismatch"}) = ${c.diag}; up ${res.H[i - 1][j]} ${sgn(gap)} (gap) = ${c.up}; left ${res.H[i][j - 1]} ${sgn(gap)} (gap) = ${c.left}. Best = ${c.best}.`;
  } else if (tb === 0) readout = `Matrix filled. Optimal global score = bottom-right cell = ${res.score}. Press Step to trace back.`;
  else if (!done) readout = `Traceback: following the arrows from the bottom-right cell (${tb} of ${res.path.length} cells).`;
  else readout = `Traceback complete. Global alignment score ${res.score}.`;

  const cell: React.CSSProperties = { width: 36, height: 34, textAlign: "center", border: "1px solid var(--line)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", position: "relative", padding: 0 };

  return (
    <VizFrame
      title="Needleman–Wunsch global alignment"
      caption="Each cell holds the best score for aligning the prefixes ending there; the traceback from the corner reads off the best overall alignment."
      simplified="Uses a single linear gap penalty and one score for every match/mismatch; real aligners use substitution matrices (BLOSUM, PAM), affine gap costs (opening > extension) and often local alignment (Smith–Waterman). Ties are broken arbitrarily (diagonal first), so other equally optimal alignments may exist."
      controls={
        <>
          <SeqField label="Sequence 1 (rows)" value={a} onChange={edit(setA)} />
          <SeqField label="Sequence 2 (columns)" value={b} onChange={edit(setB)} />
          <NumField label="Match" value={match} onChange={edit(setMatch)} />
          <NumField label="Mismatch" value={mismatch} onChange={edit(setMismatch)} />
          <NumField label="Gap" value={gap} onChange={edit(setGap)} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!reduced && (
              <button type="button" className="btn sm" disabled={m === 0 || n === 0}
                onClick={() => { if (done) setProg(0); setPlaying(!(playing && !done)); }}>
                {playing && !done ? "Pause" : "Play"}
              </button>
            )}
            <button type="button" className="btn sm" disabled={done || m === 0 || n === 0}
              onClick={() => { setPlaying(false); setProg((p) => Math.min(p + 1, end)); }}>Step</button>
            <button type="button" className="btn sm" disabled={done || m === 0 || n === 0}
              onClick={() => { setPlaying(false); setProg(end); }}>Show result</button>
            <button type="button" className="btn sm" onClick={reset}>Reset</button>
          </div>
        </>
      }
    >
      <div ref={ref}>
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <table role="table" aria-label={`Dynamic programming matrix for ${a} against ${b}`} style={{ borderCollapse: "collapse", margin: "0 auto" }}>
            <thead>
              <tr>
                <th style={cell} scope="col"><span className="sr-only" style={{ position: "absolute", left: -9999 }}>start</span></th>
                <th style={cell} scope="col">–</th>
                {[...b].map((ch, j) => <th key={j} scope="col" style={{ ...cell, color: "var(--info)" }}>{ch}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: m + 1 }, (_, i) => (
                <tr key={i}>
                  <th scope="row" style={{ ...cell, color: "var(--info)" }}>{i === 0 ? "–" : a[i - 1]}</th>
                  {Array.from({ length: n + 1 }, (_, j) => {
                    const border = i === 0 || j === 0;
                    const shown = border || (i - 1) * n + (j - 1) < fill;
                    const pk = onPath.get(`${i},${j}`);
                    const isCur = cur !== null && cur[0] === i && cur[1] === j;
                    return (
                      <td key={j} style={{
                        ...cell,
                        background: pk !== undefined ? "rgba(255,77,141,0.28)" : isCur ? "var(--gold-soft)" : "transparent",
                        outline: isCur ? "2px solid var(--gold)" : pk !== undefined ? "2px solid var(--pink)" : undefined,
                        outlineOffset: -2,
                        color: shown ? "var(--ink)" : "transparent",
                        fontWeight: pk !== undefined ? 700 : 400,
                      }}>
                        {shown ? res.H[i][j] : "·"}
                        {pk !== undefined && ARROW[res.ptr[i][j][0]] && (
                          <span aria-hidden="true" style={{ position: "absolute", top: 0, left: 2, fontSize: "0.7rem", color: "var(--pink)" }}>{ARROW[res.ptr[i][j][0]]}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div aria-live="polite" style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <div className="dim" style={{ fontSize: "0.9rem", minHeight: "2.6em" }}>{readout}</div>
          {tb > 1 && (
            <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "1.05rem", lineHeight: 1.25, color: "var(--ink)", overflowX: "auto" }}
              aria-label={`Alignment: ${part.top} over ${part.bottom}`}>
              {part.top.padStart(width)}{"\n"}{part.mid.padStart(width)}{"\n"}{part.bottom.padStart(width)}
            </pre>
          )}
          {done && (
            <div style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}>
              Score = {res.score} ({[...res.mid].filter((c) => c === "|").length} matches, {[...res.top].filter((c, k) => c !== "-" && res.bottom[k] !== "-" && c !== res.bottom[k]).length} mismatches, {[...res.top].filter((c, k) => c === "-" || res.bottom[k] === "-").length} gaps)
            </div>
          )}
        </div>
      </div>
    </VizFrame>
  );
}
