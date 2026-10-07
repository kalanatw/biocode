import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface Stage { id: string; name: string; sizeM: number; sizeLabel: string; blurb: string; art: () => ReactElement }

const L = { stroke: "#f5f0f1", pink: "#ff4d8d", gold: "#ffc300", info: "#5eb8ff", good: "#4ade80", dim: "#b9aeb2" };

const STAGES: Stage[] = [
  { id: "human", name: "Human body", sizeM: 1.7, sizeLabel: "~1.7 m", blurb: "An adult is about 1.5–2 m tall and is built from tens of trillions of cells (~3.7 × 10¹³).",
    art: () => (<g stroke={L.stroke} strokeWidth={4} fill="none" strokeLinecap="round"><circle cx={120} cy={28} r={16} fill="rgba(255,77,141,0.25)" /><path d="M120 46V110M120 58L88 92M120 58L152 92M120 110L98 166M120 110L142 166" /></g>) },
  { id: "organ", name: "Organ (heart)", sizeM: 0.12, sizeLabel: "~12 cm", blurb: "The heart is roughly fist-sized, about 12 cm long: a muscle organ made of billions of cardiac cells.",
    art: () => (<g strokeLinejoin="round"><path d="M120 160C70 130 52 100 62 70C72 42 108 44 120 70C132 44 168 42 178 70C188 100 170 130 120 160Z" fill="rgba(217,4,41,0.4)" stroke={L.pink} strokeWidth={4} /><path d="M120 70V138M96 86C104 100 104 116 100 128M144 86C136 100 136 116 140 128" fill="none" stroke={L.stroke} strokeWidth={2.5} /><path d="M120 70C120 40 140 24 160 24" fill="none" stroke={L.info} strokeWidth={9} strokeLinecap="round" /></g>) },
  { id: "cell", name: "Cell", sizeM: 1e-5, sizeLabel: "~10 µm", blurb: "A typical animal cell is 10–30 µm across (a red blood cell is ~7–8 µm). Inside: nucleus, mitochondria and more.",
    art: () => (<g><ellipse cx={120} cy={90} rx={96} ry={72} fill="rgba(255,255,255,0.05)" stroke={L.pink} strokeWidth={4} /><circle cx={112} cy={86} r={30} fill="rgba(94,184,255,0.25)" stroke={L.info} strokeWidth={3} /><circle cx={118} cy={92} r={8} fill={L.info} /><g fill="rgba(255,195,0,0.3)" stroke={L.gold} strokeWidth={2}><ellipse cx={172} cy={62} rx={13} ry={7} transform="rotate(-30 172 62)" /><ellipse cx={176} cy={120} rx={13} ry={7} transform="rotate(25 176 120)" /><ellipse cx={62} cy={122} rx={13} ry={7} transform="rotate(-20 62 122)" /></g><text x={112} y={134} textAnchor="middle" fontSize={11} fill={L.info}>nucleus</text></g>) },
  { id: "mito", name: "Organelle (mitochondrion)", sizeM: 1e-6, sizeLabel: "~1 µm", blurb: "A mitochondrion is about 1 µm long, bacterium-sized: a double membrane whose folded inner cristae host the ATP-making machinery.",
    art: () => (<g><rect x={26} y={44} width={188} height={92} rx={46} fill="rgba(255,195,0,0.12)" stroke={L.gold} strokeWidth={4} /><path d="M60 58V100M82 122V84M104 58V100M126 122V84M148 58V100M170 122V84" stroke={L.pink} strokeWidth={3} fill="none" strokeLinecap="round" /><text x={120} y={160} textAnchor="middle" fontSize={11} fill={L.gold}>inner membrane folds (cristae)</text></g>) },
  { id: "protein", name: "Protein", sizeM: 5e-9, sizeLabel: "~5 nm", blurb: "Typical globular proteins are 3–10 nm across (haemoglobin is ~5.5 nm), folded chains of amino acids.",
    art: () => (<g fill="none" strokeLinecap="round"><path d="M40 120C60 60 90 140 110 80C120 52 150 40 168 70C190 104 150 150 120 128C100 112 130 96 150 106" stroke={L.good} strokeWidth={8} /><path d="M52 130 q8 -22 18 0 q10 22 18 0 q8 -22 18 0" stroke={L.pink} strokeWidth={7} transform="translate(40 14)" /></g>) },
  { id: "dna", name: "DNA double helix", sizeM: 2e-9, sizeLabel: "2 nm wide", blurb: "The B-DNA double helix is 2 nm in diameter, with 0.34 nm between stacked base pairs.",
    art: () => (<g fill="none" strokeLinecap="round">{Array.from({ length: 11 }, (_, i) => { const x = 28 + i * 18, y1 = 90 + 45 * Math.sin(i * 0.6), y2 = 90 - 45 * Math.sin(i * 0.6); return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={L.gold} strokeWidth={3} opacity={0.8} />; })}<path d={`M28 90 ${Array.from({ length: 41 }, (_, i) => `L${28 + i * 4.5} ${90 + 45 * Math.sin(i * 0.15)}`).join(" ")}`} stroke={L.pink} strokeWidth={6} /><path d={`M28 90 ${Array.from({ length: 41 }, (_, i) => `L${28 + i * 4.5} ${90 - 45 * Math.sin(i * 0.15)}`).join(" ")}`} stroke={L.info} strokeWidth={6} /></g>) },
  { id: "atom", name: "Atom", sizeM: 1e-10, sizeLabel: "~0.1 nm", blurb: "Atoms are about 0.1–0.3 nm across (a hydrogen atom ≈ 0.1 nm; carbon ≈ 0.15 nm), almost all empty space around a tiny nucleus.",
    art: () => (<g fill="none"><circle cx={120} cy={90} r={70} fill="rgba(94,184,255,0.1)" stroke={L.info} strokeWidth={2} strokeDasharray="5 6" /><circle cx={120} cy={90} r={42} stroke={L.info} strokeWidth={2} strokeDasharray="5 6" /><circle cx={120} cy={90} r={9} fill={L.pink} stroke={L.stroke} strokeWidth={2} /><circle cx={162} cy={90} r={6} fill={L.gold} /><circle cx={77} cy={110} r={6} fill={L.gold} /><circle cx={160} cy={50} r={5} fill={L.gold} /><text x={120} y={178} textAnchor="middle" fontSize={11} fill={L.dim}>nucleus ~10⁻⁵ of the width</text></g>) },
];

const LOGS = STAGES.map((s) => Math.log10(s.sizeM));
const MIN = -10.4, MAX = 0.5;
const W = 640, PAD = 30;
const xOf = (lg: number) => PAD + ((MAX - lg) / (MAX - MIN)) * (W - 2 * PAD);
const UNITS: [number, string][] = [[1, "m"], [1e-3, "mm"], [1e-6, "µm"], [1e-9, "nm"]];
const TICKS = [[0, "1 m"], [-1, "10 cm"], [-2, "1 cm"], [-3, "1 mm"], [-4, "100 µm"], [-5, "10 µm"], [-6, "1 µm"], [-7, "100 nm"], [-8, "10 nm"], [-9, "1 nm"], [-10, "0.1 nm"]] as const;

function fmt(lg: number): string {
  const m = 10 ** lg;
  const [f, u] = UNITS.find(([f2]) => m >= f2 * 0.9995) ?? UNITS[3];
  const v = m / f;
  return `${v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(0) : v.toFixed(1)} ${u}`;
}
const nearest = (lg: number) => LOGS.reduce((b, v, i) => (Math.abs(v - lg) < Math.abs(LOGS[b] - lg) ? i : b), 0);

export default function CellScaleZoom(): ReactElement {
  const reduced = useReducedMotion();
  const [lg, setLg] = useState(LOGS[0]);
  const raf = useRef(0);
  const cur = useRef(lg);
  useEffect(() => { cur.current = lg; }, [lg]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const goTo = (target: number) => {
    cancelAnimationFrame(raf.current);
    if (reduced) { setLg(target); return; }
    const from = cur.current, t0 = performance.now(), dur = Math.min(1800, 500 + Math.abs(target - from) * 220);
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      setLg(from + (target - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const idx = nearest(lg);
  const st = STAGES[idx];
  const times = Math.round(LOGS[0] - LOGS[idx]);
  const sup = String(times).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]).join("");
  const exact = Math.abs(lg - LOGS[idx]) < 0.05;
  const readout = `Scale ${fmt(lg)}. Nearest stage: ${st.name}, ${st.sizeLabel}. ${st.blurb}`;

  return (
    <VizFrame
      title="Powers of ten: from you to an atom"
      caption="Drag the slider (or pick a stage) to zoom down a logarithmic scale. Every tick on the bar is ten times smaller than the last."
      simplified="Sizes are typical textbook values and vary a lot (cells span ~1 µm bacteria to metre-long neurons; proteins range from ~2 to 100+ nm). The drawings are cartoons, not to scale inside each frame, and the stages skip many levels (tissues, ribosomes, chromosomes, molecules)."
      controls={
        <>
          <label style={{ flex: "1 1 260px" }}>
            Scale
            <input type="range" min={MIN + 0.4} max={LOGS[0]} step={0.01} value={lg} style={{ flex: 1, minWidth: 140 }}
              onChange={(e) => { cancelAnimationFrame(raf.current); setLg(+e.target.value); }}
              aria-label="Zoom level, logarithmic scale from 1.7 metres down to 0.1 nanometres" aria-valuetext={`${fmt(lg)}, near ${st.name}`} />
          </label>
          <span role="group" aria-label="Jump to stage" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STAGES.map((s, i) => (
              <button key={s.id} className="btn sm" aria-pressed={i === idx && exact} onClick={() => goTo(LOGS[i])}
                style={i === idx && exact ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}>{s.name.split(" (")[0]}</button>
            ))}
          </span>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, alignItems: "center" }}>
        <svg viewBox="0 0 240 180" role="img" aria-label={`Cartoon of: ${st.name}, ${st.sizeLabel}`} style={{ background: "#0e0b10", borderRadius: 10, border: "1px solid var(--line)" }}>
          <g key={st.id} style={{ opacity: exact ? 1 : 0.6, transition: reduced ? "none" : "opacity 0.3s" }}>{st.art()}</g>
        </svg>
        <div aria-live="polite" aria-atomic="true">
          <div className="mono" style={{ fontSize: "2rem", color: "var(--gold)", lineHeight: 1.1 }}>{fmt(lg)}</div>
          <div className="dim" style={{ fontSize: "0.8rem" }}>current scale ≈ 10<sup>{lg.toFixed(1)}</sup> m</div>
          <h5 style={{ margin: "10px 0 4px", fontSize: "1.05rem" }}>{st.name} <span className="chip gold">{st.sizeLabel}</span></h5>
          <p style={{ margin: 0, fontSize: "0.92rem" }}>{st.blurb}</p>
          <p className="dim" style={{ fontSize: "0.82rem", margin: "6px 0 0" }}>
            {idx === 0 ? "Start here: this is your own scale." : `About 10${sup} times smaller than the human body.`}{!exact && " (Between stages: showing the nearest one.)"}
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} 74`} role="img" aria-label={readout} style={{ marginTop: 12 }}>
        <line x1={PAD} x2={W - PAD} y1={30} y2={30} stroke="#3a3040" strokeWidth={2} />
        {TICKS.map(([p, t]) => (
          <g key={t}>
            <line x1={xOf(p)} x2={xOf(p)} y1={24} y2={36} stroke={L.dim} />
            <text x={Math.min(Math.max(xOf(p), 22), W - 22)} y={52} textAnchor="middle" fontSize={10.5} fill={L.dim} fontFamily="var(--font-mono)">{t}</text>
          </g>
        ))}
        {LOGS.map((v, i) => (
          <circle key={i} cx={xOf(v)} cy={30} r={i === idx ? 6 : 4} fill={i === idx ? L.gold : "#17121a"} stroke={L.gold} strokeWidth={2} />
        ))}
        <path d={`M${xOf(lg)} 27 l-7 -14 h14 z`} fill={L.pink} />
      </svg>
      <p className="dim" style={{ fontSize: "0.8rem", margin: "2px 0 0" }}>Gold dots mark the seven stages on the log scale (human → atom spans about 10 orders of magnitude); the pink arrow is your current zoom.</p>
    </VizFrame>
  );
}
