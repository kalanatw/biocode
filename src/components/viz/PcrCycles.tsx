import { useState } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const MAX_CYCLES = 30;
const PHASES = [
  { name: "Denaturation", temp: "95 °C", text: "Heat breaks the hydrogen bonds between the two strands, so the duplex melts into two single strands." },
  { name: "Annealing", temp: "≈55–65 °C", text: "Cooling lets the short primers (added in huge excess) base-pair with their matching sites at each end of the target. Each primer's 3′ end is the starting point for copying." },
  { name: "Extension", temp: "72 °C", text: "Heat-stable Taq polymerase (from Thermus aquaticus) adds nucleotides to each primer's 3′ end, copying 5′→3′ (about 1 kb per minute). Each duplex has become two." },
];
const C = { old: "var(--ink)", new: "var(--pink)", prime: "var(--info)", target: "var(--gold)" };

function cycleNote(n: number): string {
  if (n === 0) return "Start: one double-stranded template molecule.";
  if (n === 1) return "After cycle 1: 2 duplexes, each = one old strand + one new 'long' strand that runs past the other primer's site. No target-length product yet.";
  if (n === 2) return "After cycle 2: target-length strands exist for the first time (a primer copied a 'long' strand only up to its end), but they are still paired with long strands.";
  if (n === 3) return "After cycle 3: the first pure target-length double-stranded amplicons appear (2 of 8).";
  return "From here on target-length amplicons dominate: they double every cycle while the long products only grow by 2 per cycle.";
}

const fmt = (v: number) => v.toLocaleString("en-US");
const tempY = (T: number) => 100 - (T - 50) * 1.6;

function Arrow({ x, y, dir, color }: { x: number; y: number; dir: 1 | -1; color: string }) {
  return <polygon points={`${x},${y} ${x - 8 * dir},${y - 5} ${x - 8 * dir},${y + 5}`} fill={color} />;
}

export default function PcrCycles() {
  const reduced = useReducedMotion();
  const [s, setS] = useState(0);
  const cycle = s === 0 ? 0 : Math.ceil(s / 3);
  const phase = s === 0 ? -1 : (s - 1) % 3;
  const n = Math.floor(s / 3);
  const copies = Math.pow(2, n);
  const target = n >= 1 ? copies - 2 * n : 0;
  const tr = reduced ? "none" : "transform .5s, opacity .4s";
  const op = reduced ? "none" : "opacity .4s";
  const apart = phase >= 0;

  // Tiles: one per duplex at the end of the last completed cycle (first 4 cycles only).
  const shownN = Math.min(n, 4);
  const types: string[] = shownN === 0 ? ["T"] : [...Array<string>(2).fill("OL"), ...Array<string>(2 * (shownN - 1)).fill("LS"), ...Array<string>(Math.pow(2, shownN) - 2 * shownN).fill("SS")];

  const strand = (y: number, x1: number, x2: number, color: string, w = 5) => <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={w} strokeLinecap="round" />;

  const statusLabel = s === 0 ? "start, one double-stranded template" : `cycle ${cycle}, ${PHASES[phase].name} at ${PHASES[phase].temp}`;

  return (
    <VizFrame
      title="PCR: doubling DNA with heat and a polymerase"
      caption="Step through one cycle (denature, anneal, extend), then drag the slider to see how fast doubling adds up."
      simplified="The strand diagram shows only one template, and the tiles show the ideal case (100 % efficiency, one starting molecule, only the first four cycles). Real reactions run at roughly 80–95 % efficiency per cycle, start from many template copies, and plateau after about 25–35 cycles as primers, nucleotides and polymerase run out. Also not drawn: the one-off initial denaturation, the final extension step, and the real ramp times."
      controls={
        <>
          <button type="button" className="btn sm" onClick={() => setS(Math.max(0, s - 1))} disabled={s === 0}>← Back</button>
          <button type="button" className="btn sm" onClick={() => setS(Math.min(3 * MAX_CYCLES, s + 1))} disabled={s === 3 * MAX_CYCLES}>Next step →</button>
          <button type="button" className="btn sm" onClick={() => setS(0)}>Reset</button>
          <label>
            Cycles completed: {n}
            <input type="range" min={0} max={MAX_CYCLES} step={1} value={n} onChange={(e) => setS(3 * Number(e.target.value))} />
          </label>
        </>
      }
    >
      <svg viewBox="0 0 640 120" role="img" aria-label={`Thermocycler temperature profile for one cycle: 95 °C, then about 55 to 65 °C, then 72 °C. Current: ${statusLabel}.`}>
        {PHASES.map((p, i) => (
          <rect key={p.name} x={20 + i * 200} y={6} width={200} height={108} rx={6} fill="var(--pink)" opacity={phase === i ? 0.18 : 0} stroke={phase === i ? "var(--pink)" : "none"} style={{ transition: op }} />
        ))}
        <path d={`M20 ${tempY(95)} H170 L230 ${tempY(60)} H380 L430 ${tempY(72)} H580`} fill="none" stroke="var(--ink-dim)" strokeWidth={2.5} />
        <text x={95} y={20} textAnchor="middle" fontSize={13} fill="var(--ink)">1 Denature 95 °C</text>
        <text x={300} y={108} textAnchor="middle" fontSize={13} fill="var(--ink)">2 Anneal ≈55–65 °C</text>
        <text x={500} y={56} textAnchor="middle" fontSize={13} fill="var(--ink)">3 Extend 72 °C</text>
      </svg>

      <svg viewBox="0 0 640 235" role="img" aria-label={`Diagram of DNA strands during ${statusLabel}.`}>
        <g style={{ transform: `translateY(${apart ? 0 : 45}px)`, transition: tr }}>
          {strand(60, 40, 600, C.old)}
          <text x={22} y={65} fontSize={12} fill="var(--ink-dim)">5′</text>
          <text x={608} y={65} fontSize={12} fill="var(--ink-dim)">3′</text>
        </g>
        <g style={{ transform: `translateY(${apart ? 0 : -45}px)`, transition: tr }}>
          {strand(170, 40, 600, C.old)}
          <text x={22} y={175} fontSize={12} fill="var(--ink-dim)">3′</text>
          <text x={608} y={175} fontSize={12} fill="var(--ink-dim)">5′</text>
        </g>
        <g opacity={s === 0 ? 1 : 0} style={{ transition: op }} stroke="var(--ink-dim)" strokeWidth={1.5}>
          {Array.from({ length: 29 }, (_, i) => <line key={i} x1={48 + i * 19.5} y1={108} x2={48 + i * 19.5} y2={122} />)}
        </g>
        <g opacity={phase >= 1 ? 1 : 0} style={{ transition: op }}>
          {strand(158, 150, 190, C.prime, 7)}
          <Arrow x={196} y={158} dir={1} color={C.prime} />
          <text x={170} y={145} textAnchor="middle" fontSize={12} fill={C.prime}>forward primer</text>
          {strand(72, 450, 490, C.prime, 7)}
          <Arrow x={444} y={72} dir={-1} color={C.prime} />
          <text x={470} y={95} textAnchor="middle" fontSize={12} fill={C.prime}>reverse primer</text>
        </g>
        <g opacity={phase === 2 ? 1 : 0} style={{ transition: op }}>
          {strand(158, 190, 340, C.new, 5)}
          <line x1={340} y1={158} x2={600} y2={158} stroke={C.new} strokeWidth={5} strokeDasharray="3 8" opacity={0.6} />
          <ellipse cx={346} cy={158} rx={24} ry={14} fill="var(--gold)" opacity={0.9} />
          <text x={346} y={162} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1a1200">Taq</text>
          {strand(72, 300, 450, C.new, 5)}
          <line x1={40} y1={72} x2={300} y2={72} stroke={C.new} strokeWidth={5} strokeDasharray="3 8" opacity={0.6} />
          <ellipse cx={294} cy={72} rx={24} ry={14} fill="var(--gold)" opacity={0.9} />
          <text x={294} y={76} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1a1200">Taq</text>
          <text x={470} y={196} textAnchor="middle" fontSize={11} fill={C.new}>new DNA grows 5′→3′ from each primer</text>
        </g>
        <g opacity={apart ? 1 : 0} style={{ transition: op }}>
          <path d="M150 222 V228 H490 V222" fill="none" stroke={C.target} strokeWidth={2} />
          <text x={320} y={226} textAnchor="middle" fontSize={11} fill={C.target} dy={-5}>target region (amplicon)</text>
        </g>
        {s === 0 && <text x={320} y={150} textAnchor="middle" fontSize={13} fill="var(--ink-dim)">double-stranded template (rungs = hydrogen bonds)</text>}
      </svg>

      <p aria-live="polite" style={{ margin: "8px 0" }}>
        <b>{s === 0 ? "Start." : `Cycle ${cycle}, step ${phase + 1}: ${PHASES[phase].name} (${PHASES[phase].temp}).`}</b>{" "}
        {s === 0 ? "Press “Next step” to begin cycle 1." : PHASES[phase].text}
      </p>

      <svg viewBox="0 0 640 82" role="img" aria-label={`Duplex molecules after ${shownN} completed cycles${n > 4 ? " (picture limited to 4 cycles)" : ""}: ${types.filter((t) => t === "SS").length} pure target-length, the rest contain a longer strand or an original strand.`}>
        {types.map((t, i) => {
          const x = (i % 8) * 79 + 4, y = Math.floor(i / 8) * 40 + 2;
          const full = (yy: number, c: string) => <line x1={x} y1={yy} x2={x + 70} y2={yy} stroke={c} strokeWidth={4} strokeLinecap="round" />;
          const short = (yy: number) => <line x1={x + 18} y1={yy} x2={x + 52} y2={yy} stroke={C.target} strokeWidth={4} strokeLinecap="round" />;
          return (
            <g key={i}>
              {t === "T" && <>{full(y + 10, C.old)}{full(y + 24, C.old)}</>}
              {t === "OL" && <>{full(y + 10, C.old)}{full(y + 24, C.new)}</>}
              {t === "LS" && <>{full(y + 10, C.new)}{short(y + 24)}</>}
              {t === "SS" && <>{short(y + 10)}{short(y + 24)}</>}
            </g>
          );
        })}
      </svg>

      <p className="dim" style={{ margin: "2px 0", fontSize: "0.85rem" }}>{n > 4 ? "First 4 cycles shown. " : ""}Each pair of lines is one duplex. Grey = original strand, pink = new long strand, gold (shorter line) = new target-length strand.</p>
      <p style={{ margin: "4px 0" }}>{cycleNote(n)}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
        <span className="chip gold">Double-stranded copies = 2^{n} = {fmt(copies)}</span>
        <span className="chip">Pure target-length duplexes = 2^{n} − 2×{n} = {fmt(target)}</span>
        <span className="chip pink">{((100 * target) / copies).toFixed(1)} % of copies</span>
      </div>

      <svg viewBox="0 0 640 62" role="img" aria-label={`Logarithmic scale bar: after ${n} cycles there are about ${fmt(copies)} copies; full scale is 2 to the 30, about 1.07 billion.`}>
        <rect x={20} y={10} width={600} height={14} rx={7} fill="var(--glass)" stroke="var(--line)" />
        <rect x={20} y={10} width={Math.max(0.1, (600 * n) / MAX_CYCLES)} height={14} rx={7} fill="var(--pink)" style={{ transition: reduced ? "none" : "width .3s" }} />
        {[0, 3, 6, 9].map((k) => {
          const x = 20 + (600 * k * Math.log2(10)) / MAX_CYCLES;
          return (
            <g key={k}>
              <line x1={x} y1={26} x2={x} y2={32} stroke="var(--ink-dim)" />
              <text x={x} y={46} textAnchor="middle" fontSize={11} fill="var(--ink-dim)">{k === 0 ? "1" : `10^${k}`}</text>
            </g>
          );
        })}
        <text x={620} y={58} textAnchor="end" fontSize={11} fill="var(--ink-dim)">log scale of copy number (30 cycles ≈ 1.07 × 10^9)</text>
      </svg>
    </VizFrame>
  );
}
