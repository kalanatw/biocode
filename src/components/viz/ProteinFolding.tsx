import { useEffect, useRef, useState } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useInView } from "../../hooks/useInView";

type Pt = [number, number];

/** H = hydrophobic, P = polar. Cartoon sequence; helix region and strand region are amphipathic/alternating. */
const SEQ = "PPHPPHHPPHHPPHPHPHPP";
const HELIX: Pt = [3, 10]; // residues 4-11 (1-based)
const STRAND: Pt = [13, 18]; // residues 14-19 (1-based)
const H_TOTAL = [...SEQ].filter((c) => c === "H").length;

const STAGES = [
  { name: "Random coil", text: "Unfolded chain: countless shapes, no fixed structure. Hydrophobic side chains are exposed to water." },
  { name: "Secondary structure", text: "Backbone hydrogen bonds form local patterns: an α-helix (residues 4–11) and a β-strand (residues 14–19)." },
  { name: "Hydrophobic collapse", text: "Hydrophobic side chains cluster inward, away from water; polar residues stay on the surface. Burying them frees ordered water molecules (entropy gain)." },
  { name: "Native tertiary structure", text: "Tight packing, salt bridges and hydrogen bonds settle the chain into one lowest-free-energy shape: the native state." },
];

function coilLayout(): Pt[] {
  const turns = [0, 40, -70, 100, -20, 60, -110, 30, 90, -60, 20, -100, 70, -30, 120, -50, 10, 80, -90];
  let a = 0, x = 0, y = 0;
  const raw: Pt[] = [[0, 0]];
  for (const t of turns) {
    a += (t * Math.PI) / 180;
    x += 34 * Math.cos(a);
    y += 34 * Math.sin(a);
    raw.push([x, y]);
  }
  const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  const s = Math.min(1.3, 500 / w, 250 / h);
  const mx = (Math.max(...xs) + Math.min(...xs)) / 2, my = (Math.max(...ys) + Math.min(...ys)) / 2;
  return raw.map(([px, py]) => [300 + (px - mx) * s, 150 + (py - my) * s]);
}

function secondaryLayout(): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < SEQ.length; i++) {
    if (i < HELIX[0]) pts.push([135 + i * 20, 130 - i * 14]);
    else if (i <= HELIX[1]) {
      const k = i - HELIX[0];
      pts.push([200 + k * 28, 80 + 20 * Math.sin((k * 2 * Math.PI) / 3.6)]);
    } else if (i < STRAND[0]) pts.push([i === 11 ? 440 : 465, i === 11 ? 105 : 150]);
    else if (i <= STRAND[1]) {
      const m = i - STRAND[0];
      pts.push([440 - m * 34, 200 + (m % 2 ? 10 : -10)]);
    } else pts.push([232, 232]);
  }
  return pts;
}

function ringLayout(rh: number, rp: number, step: number, a0: number): Pt[] {
  return [...SEQ].map((c, i) => {
    const r = c === "H" ? rh : rp;
    const a = a0 + i * step;
    return [300 + r * 1.3 * Math.cos(a), 150 + r * 0.9 * Math.sin(a)];
  });
}

const LAYOUTS: Pt[][] = [coilLayout(), secondaryLayout(), ringLayout(54, 102, 0.38, 0.5), ringLayout(44, 82, 0.38, 0.5)];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Cartoon free-energy curve, 0..1 -> 0..1 (high = unfolded). Rugged near the top, funnel-like near the bottom. */
const energy = (t: number) => 1 - Math.pow(t, 0.85) + 0.035 * Math.sin(t * 34) * (1 - t);

export default function ProteinFolding() {
  const reduced = useReducedMotion();
  const [wrapRef, inView] = useInView<HTMLDivElement>();
  const [progress, setProgress] = useState(0);
  const [urea, setUrea] = useState(false);
  const [anim, setAnim] = useState(0);
  const cur = useRef(0);

  const target = urea ? 0 : progress;
  useEffect(() => {
    if (reduced || !inView) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const d = target - cur.current;
      const step = 2.4 * dt;
      cur.current = Math.abs(d) <= step ? target : cur.current + Math.sign(d) * step;
      setAnim(cur.current);
      if (cur.current !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced, inView]);
  const shown = reduced ? target : anim;

  const lo = Math.min(2, Math.floor(shown));
  const f = smooth(clamp(shown - lo, 0, 1));
  const pts = LAYOUTS[lo].map((p, i): Pt => [p[0] + (LAYOUTS[lo + 1][i][0] - p[0]) * f, p[1] + (LAYOUTS[lo + 1][i][1] - p[1]) * f]);
  const stage = clamp(Math.round(target), 0, 3);
  const buried = Math.round(H_TOTAL * clamp(shown - 1, 0, 1));
  const ssOpacity = clamp(shown, 0, 1) * 0.22;
  const coreO = clamp(shown - 1, 0, 1);
  const path = (a: number, b: number) => "M" + pts.slice(a, b + 1).map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L");
  const t = clamp(shown / 3, 0, 1);
  const curve = Array.from({ length: 41 }, (_, i) => `${i ? "L" : "M"}${(20 + (i / 40) * 170).toFixed(1)} ${(20 + energy(i / 40) * 120).toFixed(1)}`).join(" ");

  return (
    <VizFrame
      title="Protein folding: from chain to shape"
      caption="Drag the slider to fold the chain; add urea to watch it unfold again. Note where the hydrophobic (H) residues end up."
      simplified="This is a cartoon in 2D, not a simulation. Real proteins fold in microseconds to seconds, secondary structure and collapse overlap and are not separate steps, and many proteins need chaperones. Anfinsen's experiment (ribonuclease A, 1961) showed that after urea and a reducing agent were removed, the chain refolded by itself: the amino-acid sequence alone encodes the native fold."
      controls={
        <>
          <label>
            Folding progress
            <input type="range" min={0} max={3} step={0.01} value={progress} disabled={urea} aria-valuetext={STAGES[clamp(Math.round(progress), 0, 3)].name} onChange={(e) => setProgress(Number(e.target.value))} />
          </label>
          {STAGES.map((s, i) => (
            <button key={s.name} type="button" className="btn sm" disabled={urea} aria-pressed={!urea && stage === i} onClick={() => setProgress(i)} style={!urea && stage === i ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}>
              {i + 1}. {s.name}
            </button>
          ))}
          <label>
            <input type="checkbox" checked={urea} onChange={(e) => setUrea(e.target.checked)} />
            Add denaturant (urea)
          </label>
        </>
      }
    >
      <div ref={wrapRef}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <svg viewBox="0 0 600 290" role="img" aria-label={`Cartoon chain of 20 residues, ${H_TOTAL} hydrophobic. Current state: ${urea ? "denatured by urea, random coil" : STAGES[stage].name}.`} style={{ flex: "1 1 360px", minWidth: 0 }}>
            <ellipse cx={300} cy={150} rx={78 - 20 * clamp(shown - 2, 0, 1)} ry={56 - 14 * clamp(shown - 2, 0, 1)} fill="none" stroke="var(--gold)" strokeWidth={1.5} strokeDasharray="5 4" opacity={coreO} />
            <path d={path(HELIX[0], HELIX[1])} fill="none" stroke="var(--pink)" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" opacity={ssOpacity} />
            <path d={path(STRAND[0], STRAND[1])} fill="none" stroke="var(--info)" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" opacity={ssOpacity} />
            <path d={path(0, SEQ.length - 1)} fill="none" stroke="var(--ink-dim)" strokeWidth={3} strokeLinejoin="round" />
            {pts.map((p, i) =>
              SEQ[i] === "H" ? (
                <g key={i}>
                  <circle cx={p[0]} cy={p[1]} r={9} fill="var(--gold)" />
                  <text x={p[0]} y={p[1] + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1a1200">H</text>
                </g>
              ) : (
                <g key={i}>
                  <circle cx={p[0]} cy={p[1]} r={9} fill="var(--bg)" stroke="var(--info)" strokeWidth={2.5} />
                  <text x={p[0]} y={p[1] + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">P</text>
                </g>
              ),
            )}
            <text x={300} y={282} textAnchor="middle" fontSize={12} fill="var(--ink-dim)" opacity={coreO}>dashed ring = hydrophobic core, away from water</text>
          </svg>
          <svg viewBox="0 0 210 190" role="img" aria-label="Cartoon energy landscape: free energy falls as the chain folds, ending at the native state." style={{ flex: "0 1 210px", minWidth: 150 }}>
            <text x={105} y={12} textAnchor="middle" fontSize={11} fill="var(--gold)">Energy funnel (cartoon)</text>
            <path d={curve} fill="none" stroke="var(--ink-dim)" strokeWidth={2} />
            <line x1={20} y1={145} x2={190} y2={145} stroke="var(--line)" />
            <line x1={20} y1={20} x2={20} y2={145} stroke="var(--line)" />
            <circle cx={20 + t * 170} cy={20 + energy(t) * 120} r={6} fill="var(--pink)" />
            <text x={105} y={165} textAnchor="middle" fontSize={10} fill="var(--ink-dim)">more folded →</text>
            <text x={105} y={180} textAnchor="middle" fontSize={10} fill="var(--ink-dim)">y: free energy (high at top)</text>
          </svg>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
          <span className="chip gold">● H = hydrophobic (filled)</span>
          <span className="chip">○ P = polar (ring)</span>
          <span className="chip pink">pink band = α-helix</span>
          <span className="chip">blue band = β-strand</span>
          <span className="chip gold">Hydrophobic residues buried: {buried} / {H_TOTAL}</span>
        </div>
        <p aria-live="polite" style={{ margin: 0 }}>
          <b>{urea ? "Denatured" : `Stage ${stage + 1} of 4: ${STAGES[stage].name}`}.</b>{" "}
          {urea ? "Urea disrupts the non-covalent bonds and the hydrophobic effect, so the chain unfolds into a coil. Remove the urea (and keep the sequence intact) and many small proteins refold on their own — Anfinsen's point." : STAGES[stage].text}
        </p>
      </div>
    </VizFrame>
  );
}
