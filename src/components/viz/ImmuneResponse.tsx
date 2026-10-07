import { useState } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const SHAPE_NAMES = ["square", "circle", "triangle", "diamond", "pentagon"];
const MATCH = 2; // clone 3 carries the triangle receptor that fits the antigen

const TEXT: { head: string; innate: boolean; body: string }[][] = [
  [
    { head: "Pathogen arrives", innate: true, body: "Bacteria enter tissue. Their surface carries antigens (shown as triangles), molecules the immune system can recognise." },
    { head: "Macrophage engulfs and presents", innate: true, body: "A macrophage (innate, no prior exposure needed) eats the bacteria, chops them up and displays antigen fragments on MHC class II molecules. It is now an antigen-presenting cell." },
    { head: "Helper T cell recognises the antigen", innate: false, body: "The one helper T cell whose receptor (TCR) fits this antigen–MHC complex binds it and becomes activated. Rare, so finding it takes days." },
    { head: "Clonal selection of a B cell", innate: false, body: "Of five B-cell clones, each with a different receptor, only the one whose receptor fits the antigen binds it. With T-cell help it divides rapidly into a clone. The other four are untouched." },
    { head: "Plasma cells and memory cells", innate: false, body: "Most of the clone becomes plasma cells that secrete antibodies (first IgM, later IgG). A few become long-lived memory cells that persist after the infection is cleared." },
  ],
  [
    { head: "Same pathogen returns", innate: true, body: "Memory B cells for this antigen are already waiting, thousands of times more numerous than the single naive cell was." },
    { head: "Macrophage engulfs and presents", innate: true, body: "The innate response is similar to the first time; it does not remember. Memory B cells also catch and present antigen efficiently." },
    { head: "Memory helper T cells respond", innate: false, body: "Memory T cells are already primed, so they activate within hours to a day or two instead of about a week." },
    { head: "Memory clone expands fast", innate: false, body: "The pre-expanded clone divides at once: far more cells, sooner. Other clones still stay out of it." },
    { head: "Many plasma cells, better antibodies", innate: false, body: "A larger and faster antibody burst, mostly IgG, with higher affinity (selected by somatic hypermutation earlier). It lasts longer too." },
  ],
];

const DAYS = [[0, 1, 3, 6, 14], [40, 40.5, 41, 42, 46]];
const smooth = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
/** log10 of relative antibody titre (arbitrary units; baseline 1). Primary peaks ~day 14 at 100; secondary re-exposure at day 40 peaks ~day 46 at 5000. */
function logTitre(t: number): number {
  const prim = t < 6 ? 0 : t <= 14 ? 2 * smooth((t - 6) / 8) : 2 - (t - 14) * (0.301 / 20);
  if (t < 41.5) return prim;
  const b = 2 - (41.5 - 14) * (0.301 / 20);
  if (t <= 46) return b + (3.7 - b) * smooth((t - 41.5) / 4.5);
  return 3.7 - (t - 46) * (0.301 / 45);
}
const PX = (d: number) => 60 + (d / 70) * 620;
const PY = (l: number) => 190 - (l / 4) * 170;

function Shape({ k, x, y, s = 7, fill = "var(--gold)" }: { k: number; x: number; y: number; s?: number; fill?: string }) {
  const common = { fill, stroke: "#000", strokeWidth: 0.8 };
  if (k === 0) return <rect x={x - s} y={y - s} width={2 * s} height={2 * s} {...common} />;
  if (k === 1) return <circle cx={x} cy={y} r={s} {...common} />;
  if (k === 2) return <polygon points={`${x},${y - s} ${x + s},${y + s} ${x - s},${y + s}`} {...common} />;
  if (k === 3) return <polygon points={`${x},${y - s * 1.2} ${x + s},${y} ${x},${y + s * 1.2} ${x - s},${y}`} {...common} />;
  const pts = [0, 1, 2, 3, 4].map((i) => `${x + s * 1.1 * Math.sin((i * 2 * Math.PI) / 5)},${y - s * 1.1 * Math.cos((i * 2 * Math.PI) / 5)}`).join(" ");
  return <polygon points={pts} {...common} />;
}

function Ab({ x, y }: { x: number; y: number }) {
  return <path d={`M${x},${y + 9} V${y} M${x},${y} L${x - 5},${y - 8} M${x},${y} L${x + 5},${y - 8}`} stroke="var(--info)" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
}

export default function ImmuneResponse() {
  const reduced = useReducedMotion();
  const [exp, setExp] = useState(0); // 0 = primary, 1 = secondary
  const [step, setStep] = useState(0);
  const t = reduced ? "none" : "opacity .6s var(--ease)";
  const info = TEXT[exp][step];
  const day = DAYS[exp][step];

  // cluster of cells for the matching clone
  const cells: ("naive" | "dividing" | "plasma" | "memory")[] =
    exp === 0
      ? step <= 2 ? ["naive"] : step === 3 ? Array(6).fill("dividing") : [...Array(4).fill("plasma"), ...Array(2).fill("memory")]
      : step <= 2 ? ["memory", "memory"] : step === 3 ? Array(12).fill("dividing") : [...Array(9).fill("plasma"), ...Array(3).fill("memory")];
  const nAb = step < 4 ? 0 : exp === 0 ? 5 : 14;

  const pts: string[] = [];
  for (let d = exp === 1 ? 40 : 0; d <= day + 1e-6; d += 0.5) pts.push(`${PX(d).toFixed(1)},${PY(logTitre(d)).toFixed(1)}`);
  const primDone = exp === 1 ? Array.from({ length: 81 }, (_, i) => `${PX(i * 0.5).toFixed(1)},${PY(logTitre(i * 0.5)).toFixed(1)}`).join(" ") : "";

  const aria = `Immune response scene, ${exp === 0 ? "first" : "second"} exposure, step ${step + 1} of 5: ${info.head}. ${info.body}`;

  return (
    <VizFrame
      title="Innate to adaptive: clonal selection"
      caption="Step through a first infection, then trigger a second exposure and compare how fast and how big the antibody response is."
      simplified="Five B-cell clones stand in for the roughly 10⁹ receptor variants a person carries. Where the cybersecurity analogy breaks: there is no central controller or signature database. Each cell's 'signature' is generated at random by gene shuffling before any threat exists, matching cells are physically copied (and their receptors mutate to improve, which software signatures do not do), memory is a living cell population that fades, and false positives become allergy or autoimmunity. Dendritic cells, NK cells, complement, CD8 killer T cells and fever are left out, and the time axis is schematic (titre is in arbitrary units on a log scale)."
      controls={
        <>
          <button type="button" className="btn sm" onClick={() => setStep(step - 1)} disabled={step === 0}>◂ Back</button>
          <button type="button" className="btn sm" onClick={() => setStep(step + 1)} disabled={step === 4}>Next step ▸</button>
          <button type="button" className="btn sm" onClick={() => { setExp(1); setStep(0); }} disabled={exp === 1 || step < 4}>
            Second exposure (day 40)
          </button>
          <button type="button" className="btn sm" onClick={() => { setExp(0); setStep(0); }}>Reset</button>
        </>
      }
    >
      <svg viewBox="0 0 700 275" role="img" aria-label={aria} style={{ fontFamily: "var(--font-body)" }}>
        <text x="10" y="16" fontSize="12" fill="var(--ink-dim)">Tissue</text>
        <line x1="0" y1="138" x2="700" y2="138" stroke="var(--line)" strokeDasharray="4 4" />
        <text x="10" y="154" fontSize="12" fill="var(--ink-dim)">Lymph node: B-cell clones (receptor shape on top of each cell)</text>

        {/* pathogens */}
        {step <= 1 && [[45, 50], [85, 95], [40, 110]].slice(0, step === 0 ? 3 : 1).map(([x, y]) => (
          <g key={x}>
            <ellipse cx={x} cy={y} rx="20" ry="10" fill="rgba(74,222,128,0.3)" stroke="var(--good)" strokeWidth="2" />
            <Shape k={2} x={x - 24} y={y} s={5} /><Shape k={2} x={x + 24} y={y} s={5} />
          </g>
        ))}
        <text x="60" y="130" textAnchor="middle" fontSize="11" fill="var(--ink)">{step <= 1 ? "bacteria + antigen" : ""}</text>

        {/* macrophage */}
        <circle cx="230" cy="75" r="38" fill="rgba(255,77,141,0.22)" stroke="var(--pink)" strokeWidth="2" />
        <text x="230" y="124" textAnchor="middle" fontSize="11" fill="var(--ink)">Macrophage</text>
        {step === 1 && <ellipse cx="226" cy="75" rx="16" ry="8" fill="rgba(74,222,128,0.3)" stroke="var(--good)" />}
        {step >= 2 && <circle cx="226" cy="75" r="4" fill="var(--ink-dim)" />}
        <g style={{ opacity: step >= 2 ? 1 : 0, transition: t }}>
          <path d="M266,75 H284" stroke="var(--pink)" strokeWidth="3" />
          <Shape k={2} x={290} y={75} s={5} />
          <text x="298" y="100" textAnchor="middle" fontSize="10" fill="var(--ink)">antigen + MHC II</text>
        </g>

        {/* helper T cell */}
        <g style={{ opacity: step >= 2 ? 1 : 0, transition: t }}>
          <circle cx="345" cy="75" r="26" fill="rgba(255,195,0,0.18)" stroke="var(--gold)" strokeWidth="2" />
          <Shape k={2} x={312} y={75} s={6} fill="none" />
          <text x="345" y="79" textAnchor="middle" fontSize="11" fill="var(--ink)">T</text>
          <text x="345" y="124" textAnchor="middle" fontSize="11" fill="var(--ink)">Helper T cell</text>
        </g>
        {step >= 3 && (
          <g>
            <path d={`M345,102 C345,125 ${60 + MATCH * 135},125 ${60 + MATCH * 135},150`} stroke="var(--gold)" strokeWidth="2" fill="none" strokeDasharray="5 3" />
            <text x="480" y="110" fontSize="11" fill="var(--gold)">T-cell help: only for the matching clone</text>
          </g>
        )}

        {/* antibodies */}
        {Array.from({ length: nAb }, (_, i) => <Ab key={i} x={440 + (i % 7) * 34 + (i % 2) * 8} y={34 + Math.floor(i / 7) * 34} />)}
        {nAb > 0 && <text x="530" y="16" textAnchor="middle" fontSize="11" fill="var(--info)">antibodies (Y) in blood</text>}

        {/* B-cell clones */}
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 60 + i * 135;
          const match = i === MATCH;
          return (
            <g key={i} style={{ opacity: step >= 3 && !match ? 0.45 : 1, transition: t }}>
              <path d={`M${x},170 V160`} stroke="var(--ink-dim)" strokeWidth="2" />
              <Shape k={i} x={x} y={156} s={6} fill={match ? "var(--gold)" : "var(--ink-dim)"} />
              {match && step >= 3 && <Shape k={2} x={x + 14} y={152} s={4} />}
              {!match && <circle cx={x} cy={190} r="17" fill="var(--glass)" stroke="var(--line)" strokeWidth="2" />}
              {!match && <text x={x} y={194} textAnchor="middle" fontSize="11" fill="var(--ink)">B{i + 1}</text>}
              <text x={x} y={238} textAnchor="middle" fontSize="10" fill="var(--ink-dim)">B{i + 1} · receptor: {SHAPE_NAMES[i]}</text>
              {!match && step >= 3 && <text x={x} y={242} textAnchor="middle" fontSize="11" fill="var(--ink)">✕ no match</text>}
            </g>
          );
        })}
        {/* matching clone cluster (replaces its single cell once it divides) */}
        {cells.map((c, i) => {
          const cx = 60 + MATCH * 135 + (i % 6 - (Math.min(cells.length, 6) - 1) / 2) * 21;
          const cy = (c === "naive" || (exp === 1 && step <= 2) ? 190 : 184) + Math.floor(i / 6) * 22;
          return (
            <g key={i}>
              {c === "naive" && <circle cx={cx} cy={cy} r="17" fill="rgba(255,195,0,0.18)" stroke="var(--gold)" strokeWidth="2" />}
              {c === "dividing" && <circle cx={cx} cy={cy} r="9" fill="rgba(255,195,0,0.35)" stroke="var(--gold)" strokeWidth="1.5" />}
              {c === "plasma" && <><circle cx={cx} cy={cy} r="9" fill="var(--pink)" stroke="#000" /><path d={`M${cx - 4},${cy} h8 M${cx},${cy - 4} v8`} stroke="#000" strokeWidth="1.5" /></>}
              {c === "memory" && <><circle cx={cx} cy={cy} r="9" fill="none" stroke="var(--gold)" strokeWidth="2" /><circle cx={cx} cy={cy} r="4" fill="none" stroke="var(--gold)" strokeWidth="1.5" /></>}
            </g>
          );
        })}
        {step === 4 && <text x={60 + MATCH * 135} y="256" textAnchor="middle" fontSize="11" fill="var(--ink)">filled+ = plasma cell · double ring = memory cell</text>}
        {exp === 1 && step <= 2 && <text x={60 + MATCH * 135} y="256" textAnchor="middle" fontSize="11" fill="var(--ink)">double ring = memory B cells from the 1st exposure</text>}
        {step === 3 && <text x={60 + MATCH * 135} y="256" textAnchor="middle" fontSize="11" fill="var(--ink)">dividing clone</text>}
      </svg>

      <div role="status" aria-live="polite" className="notice" style={{ margin: "8px 0" }}>
        <span className={`chip ${info.innate ? "" : "gold"}`}>{info.innate ? "innate" : "adaptive"}</span>{" "}
        <b>Step {step + 1}/5, {exp === 0 ? "first" : "second"} exposure: {info.head}.</b> {info.body}
      </div>

      <svg viewBox="0 0 700 235" role="img" aria-label={`Antibody titre against time on a log scale. First exposure: lag of about a week, peak near day 14, then decay. Second exposure at day 40 ${exp === 1 ? `: starts after about 1 to 2 days, peaks near day 46 about 50 times higher than the primary peak.` : "has not happened yet."}`} style={{ fontFamily: "var(--font-body)" }}>
        <line x1="60" y1="190" x2="680" y2="190" stroke="var(--ink-dim)" />
        <line x1="60" y1="20" x2="60" y2="190" stroke="var(--ink-dim)" />
        {[0, 1, 2, 3, 4].map((l) => (
          <g key={l}>
            <line x1="56" y1={PY(l)} x2="680" y2={PY(l)} stroke="var(--line)" />
            <text x="50" y={PY(l) + 4} textAnchor="end" fontSize="11" fill="var(--ink-dim)">{10 ** l}</text>
          </g>
        ))}
        {[0, 10, 20, 30, 40, 50, 60, 70].map((d) => <text key={d} x={PX(d)} y="207" textAnchor="middle" fontSize="11" fill="var(--ink-dim)">{d}</text>)}
        <text x="370" y="225" textAnchor="middle" fontSize="12" fill="var(--ink)">days since first exposure</text>
        <text x="14" y="105" fontSize="12" fill="var(--ink)" transform="rotate(-90 14 105)" textAnchor="middle">antibody titre (log, arbitrary)</text>
        <line x1={PX(0)} y1="20" x2={PX(0)} y2="190" stroke="var(--pink)" strokeDasharray="3 3" />
        <text x={PX(0) + 4} y="32" fontSize="11" fill="var(--pink)">1st exposure</text>
        <line x1={PX(40)} y1="20" x2={PX(40)} y2="190" stroke="var(--pink)" strokeDasharray="3 3" opacity={exp === 1 ? 1 : 0.35} />
        <text x={PX(40) + 4} y="32" fontSize="11" fill="var(--pink)" opacity={exp === 1 ? 1 : 0.35}>2nd exposure</text>
        {exp === 1 && <polyline points={primDone} fill="none" stroke="var(--ink-dim)" strokeWidth="2.5" strokeDasharray="5 4" />}
        <polyline points={pts.join(" ")} fill="none" stroke={exp === 0 ? "var(--gold)" : "var(--pink)"} strokeWidth="3" />
        <circle cx={PX(day)} cy={PY(logTitre(day))} r="5" fill="var(--ink)" />
        {exp === 0 && step === 4 && <text x={PX(14) + 10} y={PY(2) - 6} fontSize="11" fill="var(--gold)">primary: ~1 week lag, lower peak (IgM first)</text>}
        {exp === 1 && step === 4 && <text x={PX(46) - 8} y={PY(3.7) - 8} textAnchor="end" fontSize="11" fill="var(--pink)">secondary: 1–2 day lag, ~50× peak, IgG</text>}
      </svg>
    </VizFrame>
  );
}
