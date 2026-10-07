import { useEffect, useState } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useInView } from "../../hooks/useInView";

interface Step {
  enzyme: string;
  reaction: string;
  note: string;
  tag?: string;
}

/** Step i (1-based) converts METAB[i-1] into METAB[i]. */
const METAB = [
  "Glucose (6C)",
  "Glucose 6-phosphate",
  "Fructose 6-phosphate",
  "Fructose 1,6-bisphosphate",
  "DHAP + G3P",
  "2 × glyceraldehyde 3-P",
  "2 × 1,3-bisphosphoglycerate",
  "2 × 3-phosphoglycerate",
  "2 × 2-phosphoglycerate",
  "2 × phosphoenolpyruvate",
  "2 × pyruvate (3C)",
];

const STEPS: Step[] = [
  { enzyme: "Hexokinase", reaction: "Glucose + ATP → glucose 6-phosphate + ADP", tag: "−1 ATP", note: "Spends ATP and traps glucose in the cell (the phosphate makes it charged). Essentially irreversible. Inhibited by its own product, glucose 6-phosphate." },
  { enzyme: "Phosphoglucose isomerase", reaction: "Glucose 6-P ⇌ fructose 6-P", note: "Rearranges the aldose into a ketose so the next step can split the ring symmetrically. Freely reversible." },
  { enzyme: "Phosphofructokinase-1 (PFK-1)", reaction: "Fructose 6-P + ATP → fructose 1,6-bisphosphate + ADP", tag: "−1 ATP", note: "The main control point. Inhibited by high ATP and by citrate; activated by AMP and fructose 2,6-bisphosphate. Commits the sugar to glycolysis." },
  { enzyme: "Aldolase", reaction: "Fructose 1,6-bisP → DHAP + glyceraldehyde 3-P", note: "Splits the 6-carbon sugar into two 3-carbon phosphates. From here on, everything counts twice per glucose." },
  { enzyme: "Triose phosphate isomerase", reaction: "DHAP ⇌ glyceraldehyde 3-P", note: "Converts the other half (DHAP) into G3P, so one glucose gives 2 G3P. This ends the investment phase." },
  { enzyme: "Glyceraldehyde 3-P dehydrogenase (GAPDH)", reaction: "G3P + NAD⁺ + Pᵢ → 1,3-bisphosphoglycerate + NADH + H⁺", tag: "+2 NADH", note: "First energy-conserving step: an aldehyde is oxidised and NAD⁺ is reduced. Happens twice per glucose (once per G3P)." },
  { enzyme: "Phosphoglycerate kinase", reaction: "1,3-BPG + ADP → 3-phosphoglycerate + ATP", tag: "+2 ATP", note: "Substrate-level phosphorylation: a high-energy phosphate goes straight to ADP. Pays back the 2 ATP invested." },
  { enzyme: "Phosphoglycerate mutase", reaction: "3-phosphoglycerate ⇌ 2-phosphoglycerate", note: "Moves the phosphate from carbon 3 to carbon 2, setting up a high-energy enol phosphate." },
  { enzyme: "Enolase", reaction: "2-phosphoglycerate ⇌ phosphoenolpyruvate + H₂O", note: "Removes water, making phosphoenolpyruvate (PEP), whose phosphate has a very high transfer potential." },
  { enzyme: "Pyruvate kinase", reaction: "PEP + ADP → pyruvate + ATP", tag: "+2 ATP", note: "Second substrate-level phosphorylation, strongly favourable and irreversible. Pyruvate then enters the citric acid cycle (with O₂) or is fermented." },
];

const COL_L = 100;
const COL_R = 440;
const rowY = (r: number) => 38 + r * 70;
const NODE_W = 170;

function pos(i: number): { x: number; y: number } {
  return i <= 5 ? { x: COL_L, y: rowY(i) } : { x: COL_R, y: rowY(11 - i) };
}

export default function GlycolysisFlow() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [done, setDone] = useState(0); // reactions completed = index of the metabolite holding the particle
  const [sel, setSel] = useState<number | null>(null);
  const [inhib, setInhib] = useState(false);
  const [auto, setAuto] = useState(false);

  const blocked = inhib && done === 2;
  const finished = done >= 10;
  const running = auto && inView && !reduced && !blocked && !finished;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setDone((d) => Math.min(10, d + 1)), 1100);
    return () => window.clearInterval(id);
  }, [running]);

  const next = () => {
    if (!blocked && !finished) setDone(done + 1);
  };
  const reset = () => { setDone(0); setSel(null); setAuto(false); };

  const spent = (done >= 1 ? 1 : 0) + (done >= 3 ? 1 : 0);
  const made = (done >= 7 ? 2 : 0) + (done >= 10 ? 2 : 0);
  const nadh = done >= 6 ? 2 : 0;
  const pyr = done >= 10 ? 2 : 0;

  const infoIdx = sel ?? (done > 0 ? done : null);
  const info = infoIdx ? STEPS[infoIdx - 1] : null;
  const phase = done === 0 ? "Ready: one glucose molecule enters." : done <= 5 ? "Energy investment phase (steps 1–5): ATP is spent." : "Energy payoff phase (steps 6–10): ATP and NADH are made.";
  const p = pos(done);

  const readout = blocked
    ? `PFK-1 is inhibited: the particle is stuck at fructose 6-phosphate and upstream sugar phosphates back up.`
    : `Step ${done} of 10 complete. Currently ${METAB[done]}. ATP spent ${spent}, ATP made ${made}, NADH ${nadh}, pyruvate ${pyr}.`;

  return (
    <VizFrame
      title="Glycolysis: one glucose, ten steps"
      caption="Step the glucose down the left side (invest 2 ATP) and up the right side (earn 4 ATP + 2 NADH), then block PFK-1 to see the bottleneck."
      simplified="Every step is shown as a one-way arrow, but steps 2, 4, 5, 6, 8 and 9 are reversible in the cell and only steps 1, 3 and 10 are effectively one-way. Cofactors (Mg²⁺), water and most protons are omitted, and a real pathway is a crowd of molecules, not one particle. Nothing here runs in time: the particle just marks which reaction we are discussing."
      controls={
        <>
          <button type="button" className="btn sm" onClick={next} disabled={blocked || finished}>Next step ▸</button>
          <button type="button" className="btn sm" onClick={() => setAuto((a) => !a)} disabled={reduced} aria-pressed={auto}>
            {running ? "Pause" : "Auto-run"}
          </button>
          <button type="button" className="btn sm" onClick={reset}>Reset</button>
          <label>
            <input type="checkbox" checked={inhib} onChange={(e) => setInhib(e.target.checked)} /> Inhibit PFK-1 (high ATP / citrate)
          </label>
        </>
      }
    >
      <div ref={ref}>
        <svg viewBox="0 0 720 440" role="img" aria-label={`Glycolysis pathway as a U-shaped track. ${readout}`} style={{ fontFamily: "var(--font-body)" }}>
          <text x={COL_L} y="14" textAnchor="middle" fontSize="12" fill="var(--gold)">Investment phase</text>
          <text x={COL_R} y="14" textAnchor="middle" fontSize="12" fill="var(--good)">Payoff phase</text>
          {STEPS.map((s, idx) => {
            const i = idx + 1;
            const a = pos(i - 1);
            const b = pos(i);
            const horiz = i === 6;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const passed = done >= i;
            const isSel = sel === i;
            const lx = horiz ? mx : i <= 5 ? a.x + 14 : b.x + 14;
            const stuck = inhib && i === 3;
            const tx = horiz ? mx : a.x - 55;
            return (
              <g key={i}>
                <line
                  x1={horiz ? a.x + NODE_W / 2 : a.x} y1={horiz ? a.y : a.y + (b.y > a.y ? 17 : -17)}
                  x2={horiz ? b.x - NODE_W / 2 : b.x} y2={horiz ? b.y : b.y + (b.y > a.y ? -17 : 17)}
                  stroke={stuck ? "var(--red)" : passed ? "var(--pink)" : "var(--line)"} strokeWidth={stuck ? 4 : 3} strokeDasharray={stuck ? "6 4" : undefined} />
                {stuck && <text x={a.x + 70} y={my + 4} fontSize="16" fill="var(--red)" fontWeight="bold">✕</text>}
                {s.tag && (
                  <g>
                    <rect x={tx - 36} y={(horiz ? my + 18 : my) - 9} width="72" height="18" rx="9" fill="#14090c"
                      stroke={s.tag.startsWith("−") ? "var(--red)" : "var(--good)"} />
                    <text x={tx} y={(horiz ? my + 18 : my) + 4} textAnchor="middle" fontSize="11" fill="var(--ink)">{s.tag}</text>
                  </g>
                )}
                <g role="button" tabIndex={0} aria-pressed={isSel} aria-label={`Step ${i}: ${s.enzyme}`}
                  style={{ cursor: "pointer", outlineOffset: 2 }}
                  onClick={() => setSel(isSel ? null : i)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(isSel ? null : i); } }}>
                  {horiz ? (
                    <text x={lx} y={my - 8} textAnchor="middle" fontSize="11.5" fill={isSel ? "var(--gold)" : "var(--ink)"} textDecoration="underline">{i}. {s.enzyme.split(" (")[0]}</text>
                  ) : (
                    <>
                      <circle cx={lx + 8} cy={my} r="10" fill={isSel ? "var(--gold)" : "var(--glass)"} stroke="var(--line)" />
                      <text x={lx + 8} y={my + 4} textAnchor="middle" fontSize="11" fill={isSel ? "#000" : "var(--ink)"}>{i}</text>
                      <text x={lx + 24} y={my + 4} fontSize="11.5" fill={isSel ? "var(--gold)" : "var(--ink)"} textDecoration="underline">
                        {s.enzyme.split(" (")[0].replace("Glyceraldehyde 3-P dehydrogenase", "GAP dehydrogenase")}
                      </text>
                    </>
                  )}
                </g>
              </g>
            );
          })}

          {METAB.map((m, i) => {
            const q = pos(i);
            const here = done === i;
            const dim = inhib && done < 3 && i > 2;
            return (
              <g key={m} opacity={dim ? 0.4 : 1}>
                <rect x={q.x - NODE_W / 2} y={q.y - 17} width={NODE_W} height="34" rx="10"
                  fill={here ? "rgba(255,77,141,0.25)" : "var(--glass)"} stroke={here ? "var(--pink)" : "var(--line)"} strokeWidth={here ? 2 : 1} />
                <text x={q.x} y={q.y + 4} textAnchor="middle" fontSize="12" fill="var(--ink)">{m}</text>
              </g>
            );
          })}

          {/* back-up of sugar phosphates behind a blocked PFK-1 */}
          {inhib && done >= 2 && [0, 1, 2, 3, 4].map((k) => (
            <circle key={k} cx={COL_L - 40 + k * 11} cy={rowY(2) - 26} r="4" fill="var(--gold)" />
          ))}
          {inhib && done >= 2 && <text x="8" y={rowY(2) - 36} fontSize="11" fill="var(--gold)">backing up</text>}

          <text x={COL_R} y={rowY(0) + 4} textAnchor="middle" fontSize="11.5" fill="var(--ink-dim)">→ pyruvate goes on to the citric acid cycle (O₂) or fermentation</text>

          {/* the glucose particle */}
          <g style={{ transform: `translate(${p.x - NODE_W / 2 + 16}px, ${p.y}px)`, transition: reduced ? "none" : "transform .9s var(--ease)" }}>
            <circle r="9" fill="var(--gold)" stroke="#000" strokeWidth="1.5" />
            <text y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#000">C</text>
          </g>
        </svg>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }} aria-hidden="true">
        <span className="chip">ATP spent: {spent}</span>
        <span className="chip">ATP made: {made}</span>
        <span className="chip gold">Net ATP: {made - spent >= 0 ? "+" : ""}{made - spent}</span>
        <span className="chip">NADH: {nadh}</span>
        <span className="chip">Pyruvate: {pyr}</span>
      </div>
      <div role="status" aria-live="polite" style={{ fontSize: "0.92rem" }}>
        <b style={{ color: blocked ? "var(--red)" : "var(--gold)" }}>{blocked ? "Bottleneck! " : ""}</b>
        {blocked
          ? "PFK-1 is inhibited, so fructose 6-phosphate (and, via reversible step 2, glucose 6-phosphate) backs up; high glucose 6-phosphate then inhibits hexokinase and the whole pathway slows."
          : finished
            ? "Per glucose: 2 ATP spent, 4 ATP made = net 2 ATP, plus 2 NADH and 2 pyruvate."
            : phase}
      </div>
      {info && infoIdx && (
        <div className="notice" style={{ marginTop: 8 }}>
          <b>Step {infoIdx}: {info.enzyme}.</b> <span className="mono">{info.reaction}</span>. {info.note}
        </div>
      )}
      {!info && <p className="dim" style={{ fontSize: "0.88rem", margin: "8px 0 0" }}>Tip: click any numbered enzyme on the track to read about that step.</p>}
    </VizFrame>
  );
}
