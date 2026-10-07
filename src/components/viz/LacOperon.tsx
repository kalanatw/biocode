import { useState } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useInView } from "../../hooks/useInView";

type Level = "off" | "low" | "high";

const CONDITIONS: { lac: boolean; glc: boolean; level: Level; text: string }[] = [
  { lac: true, glc: false, level: "high", text: "+lactose / −glucose: HIGH" },
  { lac: true, glc: true, level: "low", text: "+lactose / +glucose: LOW" },
  { lac: false, glc: false, level: "off", text: "−lactose / −glucose: OFF" },
  { lac: false, glc: true, level: "off", text: "−lactose / +glucose: OFF" },
];

const LEVEL_TEXT: Record<Level, string> = {
  high: "HIGH (100%)",
  low: "LOW (roughly 5–10% of maximum)",
  off: "OFF (only a trickle, well under 1%)",
};

export default function LacOperon() {
  const [lactose, setLactose] = useState(false);
  const [glucose, setGlucose] = useState(true);
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();

  const repressorOn = !lactose; // LacI sits on the operator unless allolactose is present
  const capBound = !glucose; // low glucose -> high cAMP -> CAP-cAMP binds
  const level: Level = repressorOn ? "off" : capBound ? "high" : "low";
  const animate = !reduced && inView;
  const anim = (name: string, dur: string) =>
    animate ? { animation: `${name} ${dur} linear infinite` } : {};

  const rnapXs = level === "high" ? [300, 400, 510] : level === "low" ? [400] : [];
  const prot = level === "high" ? 1 : level === "low" ? 0.3 : 0.06;

  const label =
    `Lac operon with ${lactose ? "lactose present, so allolactose binds the LacI repressor and it leaves the operator" : "no lactose, so the LacI repressor sits on the operator"}. ` +
    `${glucose ? "Glucose is present, cAMP is low, CAP is not bound." : "Glucose is absent, cAMP is high, CAP-cAMP is bound upstream of the promoter."} ` +
    `Expression is ${level}.`;

  return (
    <VizFrame
      title="The lac operon: two signals, one switch"
      caption="Flip lactose and glucose and watch the repressor, CAP–cAMP and RNA polymerase. Only one of the four conditions gives high expression."
      simplified="Real regulation is not all-or-nothing: LacI binds the operator reversibly (so there is a small leak even when repressed), there are two auxiliary operators that make a DNA loop, and the very first allolactose is made by the few β-galactosidase molecules that leaked. Inducer exclusion (glucose also blocks lactose uptake) is left out. DNA, proteins and RNA polymerase are not drawn to scale."
      controls={
        <>
          <label>
            <input type="checkbox" checked={lactose} onChange={(e) => setLactose(e.target.checked)} /> Lactose present
          </label>
          <label>
            <input type="checkbox" checked={glucose} onChange={(e) => setGlucose(e.target.checked)} /> Glucose present
          </label>
        </>
      }
    >
      <style>{`@keyframes lac-flow{to{stroke-dashoffset:-24}}@keyframes lac-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
      <div ref={ref}>
        <svg viewBox="0 0 700 300" role="img" aria-label={label} style={{ fontFamily: "var(--font-body)" }}>
          {/* DNA */}
          <line x1="30" y1="190" x2="670" y2="190" stroke="var(--ink-dim)" strokeWidth="3" />
          <Seg x={55} w={65} text="CAP site" fill="rgba(94,184,255,0.25)" stroke="var(--info)" />
          <Seg x={130} w={85} text="Promoter" fill="rgba(74,222,128,0.2)" stroke="var(--good)" />
          <Seg x={222} w={45} text="Operator" fill="rgba(217,4,41,0.3)" stroke="var(--pink)" />
          <Seg x={278} w={130} text="lacZ" fill="rgba(255,195,0,0.18)" stroke="var(--gold)" />
          <Seg x={414} w={100} text="lacY" fill="rgba(255,195,0,0.18)" stroke="var(--gold)" />
          <Seg x={520} w={90} text="lacA" fill="rgba(255,195,0,0.18)" stroke="var(--gold)" />

          {/* CAP–cAMP */}
          <g opacity={capBound ? 1 : 0.55}>
            <circle cx="88" cy={capBound ? 160 : 70} r="17" fill="rgba(94,184,255,0.3)" stroke="var(--info)" strokeWidth="2" strokeDasharray={capBound ? "0" : "4 3"} />
            <text x="88" y={capBound ? 164 : 74} textAnchor="middle" fontSize="11" fill="var(--ink)">CAP</text>
            {capBound && <circle cx="102" cy="148" r="5" fill="var(--gold)" stroke="#000" strokeWidth="0.5" />}
            <text x="88" y={capBound ? 128 : 44} textAnchor="middle" fontSize="11" fill="var(--ink-dim)">
              {capBound ? "CAP + cAMP bound" : "CAP (no cAMP: can't bind)"}
            </text>
            {capBound && <text x="120" y="146" fontSize="10" fill="var(--gold)">cAMP</text>}
          </g>

          {/* LacI repressor */}
          <g>
            <rect x={repressorOn ? 214 : 300} y={repressorOn ? 148 : 56} width="60" height="30" rx="10"
              fill={repressorOn ? "rgba(217,4,41,0.55)" : "rgba(255,77,141,0.2)"} stroke="var(--pink)" strokeWidth="2"
              style={{ transition: reduced ? "none" : "all .6s var(--ease)" }} />
            <text x={repressorOn ? 244 : 330} y={repressorOn ? 167 : 75} textAnchor="middle" fontSize="12" fill="var(--ink)"
              style={{ transition: reduced ? "none" : "all .6s var(--ease)" }}>LacI</text>
            {!repressorOn && (
              <>
                <circle cx="318" cy="66" r="5" fill="var(--gold)" /><circle cx="344" cy="66" r="5" fill="var(--gold)" />
                <text x="332" y="42" textAnchor="middle" fontSize="11" fill="var(--ink-dim)">LacI + allolactose (inducer): released</text>
              </>
            )}
            {repressorOn && <text x="244" y="132" textAnchor="middle" fontSize="11" fill="var(--ink-dim)">LacI repressor blocks operator</text>}
          </g>

          {/* RNA polymerase */}
          {repressorOn && capBound && (
            <g>
              <ellipse cx="172" cy="165" rx="30" ry="14" fill="rgba(74,222,128,0.35)" stroke="var(--good)" strokeWidth="2" />
              <text x="172" y="169" textAnchor="middle" fontSize="11" fill="var(--ink)">RNAP</text>
              <text x="172" y="145" textAnchor="middle" fontSize="16" fill="var(--red)" fontWeight="bold">✕ blocked</text>
            </g>
          )}
          {repressorOn && !capBound && (
            <g opacity="0.6">
              <ellipse cx="172" cy="165" rx="30" ry="14" fill="none" stroke="var(--good)" strokeWidth="2" strokeDasharray="4 3" />
              <text x="172" y="169" textAnchor="middle" fontSize="11" fill="var(--ink)">RNAP</text>
              <text x="172" y="145" textAnchor="middle" fontSize="12" fill="var(--ink-dim)">weak, blocked</text>
            </g>
          )}
          {!repressorOn && (
            <>
              {level === "low" && (
                <>
                  <ellipse cx="172" cy="165" rx="30" ry="14" fill="none" stroke="var(--good)" strokeWidth="2" strokeDasharray="4 3" />
                  <text x="172" y="169" textAnchor="middle" fontSize="11" fill="var(--ink)">RNAP</text>
                  <text x="172" y="145" textAnchor="middle" fontSize="11" fill="var(--ink-dim)">binds weakly (no CAP)</text>
                </>
              )}
              {level === "high" && (
                <>
                  <ellipse cx="172" cy="165" rx="30" ry="14" fill="rgba(74,222,128,0.4)" stroke="var(--good)" strokeWidth="2" />
                  <text x="172" y="169" textAnchor="middle" fontSize="11" fill="var(--ink)">RNAP</text>
                  <text x="172" y="145" textAnchor="middle" fontSize="11" fill="var(--ink-dim)">CAP recruits RNAP</text>
                </>
              )}
              {rnapXs.map((x, i) => (
                <g key={x} style={anim("lac-pulse", `${1.6 + i * 0.4}s`)}>
                  <ellipse cx={x} cy="176" rx="18" ry="9" fill="rgba(74,222,128,0.4)" stroke="var(--good)" strokeWidth="1.5" />
                  <path d={`M${x - 18},176 C${x - 40},150 ${x - 70},210 ${x - 100},180`} fill="none" stroke="var(--pink)" strokeWidth="2.5"
                    strokeDasharray="8 4" style={anim("lac-flow", "1.2s")} />
                </g>
              ))}
              {rnapXs.length > 0 && <text x="400" y="238" textAnchor="middle" fontSize="11" fill="var(--pink)">mRNA being made (one long message for all three genes)</text>}
            </>
          )}

          {/* Proteins */}
          <g opacity={Math.max(prot, 0.12)} fontSize="11" fill="var(--ink)">
            <text x="343" y="262" textAnchor="middle">β-galactosidase</text>
            <text x="464" y="262" textAnchor="middle">permease</text>
            <text x="565" y="262" textAnchor="middle">transacetylase</text>
          </g>
          <text x="455" y="282" textAnchor="middle" fontSize="11" fill="var(--ink-dim)">
            proteins made: {level === "high" ? "lots" : level === "low" ? "a few" : "almost none"}
          </text>
        </svg>
      </div>

      <div role="status" aria-live="polite" style={{ margin: "8px 0", fontSize: "0.92rem" }}>
        <b style={{ color: "var(--gold)" }}>Expression: {LEVEL_TEXT[level]}.</b>{" "}
        {repressorOn
          ? "No lactose, so no allolactose (the real inducer, an isomer of lactose made by β-galactosidase): LacI stays on the operator and RNA polymerase cannot move."
          : "Allolactose binds LacI, which changes shape and lets go of the operator."}{" "}
        {glucose
          ? "Glucose is present, so cAMP is low and CAP cannot help RNA polymerase (catabolite repression)."
          : "Glucose is low, so cAMP is high and CAP–cAMP boosts RNA polymerase binding."}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 6 }}>
        {CONDITIONS.map((c) => {
          const active = c.lac === lactose && c.glc === glucose;
          return (
            <button key={c.text} type="button" className="btn sm" aria-pressed={active}
              onClick={() => { setLactose(c.lac); setGlucose(c.glc); }}
              style={active ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}>
              {c.text}
            </button>
          );
        })}
      </div>
    </VizFrame>
  );
}

function Seg({ x, w, text, fill, stroke }: { x: number; w: number; text: string; fill: string; stroke: string }) {
  return (
    <g>
      <rect x={x} y="182" width={w} height="16" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <text x={x + w / 2} y="214" textAnchor="middle" fontSize="11" fill="var(--ink-dim)">{text}</text>
    </g>
  );
}
