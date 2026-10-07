import { useCallback, useEffect, useRef, useState } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useInView } from "../../hooks/useInView";

type Mode = "none" | "cn" | "oligo" | "dnp";
interface Sim { g: number; atp: number; heat: number; phase: number; rot: number; e: number; synth: number; leak: number }

const MODES: { id: Mode; label: string; text: string }[] = [
  { id: "none", label: "No inhibitor", text: "Electrons flow, protons are pumped, the gradient builds until the pumps and ATP synthase balance, and ATP is made." },
  { id: "cn", label: "Add cyanide (blocks IV)", text: "Cyanide binds complex IV, so electrons cannot reach O₂. Complexes I–III back up in the reduced state, no protons are pumped, the gradient fades and ATP stops." },
  { id: "oligo", label: "Add oligomycin (blocks ATP synthase)", text: "Oligomycin plugs the proton channel of ATP synthase. Protons cannot return, so the gradient climbs until it is too steep for the pumps and electron flow slows (respiratory control). No ATP." },
  { id: "dnp", label: "Add uncoupler (DNP)", text: "DNP carries protons straight across the membrane. The gradient collapses, so there is no force to turn ATP synthase, yet electron flow and O₂ use run flat out, and the energy is released as heat." },
];

const PATH: [number, number][] = [[90, 172], [205, 172], [290, 172], [350, 128], [410, 172]];
const PROTONS = Array.from({ length: 44 }, (_, i) => ({ x: 30 + ((i * 137.5) % 640), y: 34 + ((i * 53) % 96), s: i * 1.7 }));

function advance(s: Sim, dt: number, supply: boolean, mode: Mode) {
  const e = supply && mode !== "cn" ? 1 - s.g ** 4 : 0; // respiratory control: steep gradient slows the chain
  const pump = 0.35 * e;
  const synth = mode === "oligo" ? 0 : 0.5 * Math.max(0, s.g - 0.3); // needs enough proton-motive force
  const leak = 0.05 * s.g + (mode === "dnp" ? 1.5 * s.g : 0);
  s.g = Math.min(1, Math.max(0, s.g + (pump - synth - leak) * dt));
  s.atp += synth * 20 * dt;
  s.heat += leak * 20 * dt;
  s.phase += e * dt * 1.4;
  s.rot = (s.rot + synth * 1600 * dt) % 360;
  s.e = e; s.synth = synth; s.leak = leak;
}

export default function Chemiosmosis() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [mode, setMode] = useState<Mode>("none");
  const [supply, setSupply] = useState(true);
  const sim = useRef<Sim>({ g: 0, atp: 0, heat: 0, phase: 0, rot: 0, e: 0, synth: 0, leak: 0 });
  const [view, setView] = useState<Sim>({ g: 0, atp: 0, heat: 0, phase: 0, rot: 0, e: 0, synth: 0, leak: 0 });
  const params = useRef({ supply, mode });
  useEffect(() => { params.current = { supply, mode }; }, [supply, mode]);

  const burst = useCallback((secs: number) => {
    const n = Math.round(secs / 0.05);
    for (let i = 0; i < n; i++) advance(sim.current, 0.05, params.current.supply, params.current.mode);
    setView({ ...sim.current });
  }, []);

  useEffect(() => {
    if (reduced || !inView) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      advance(sim.current, dt, params.current.supply, params.current.mode);
      setView({ ...sim.current });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, inView]);

  const reset = () => { sim.current = { g: 0, atp: 0, heat: 0, phase: 0, rot: 0, e: 0, synth: 0, leak: 0 }; setView({ ...sim.current }); };

  const g = view.g;
  const dpH = 0.8 * g;
  const nIms = Math.round(g * PROTONS.length);
  const modeInfo = MODES.find((m) => m.id === mode)!;
  const ptAt = (u: number): [number, number] => {
    const i = Math.floor(u) % 4;
    const f = u - Math.floor(u);
    const a = PATH[i], b = PATH[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };
  const pumpOp = Math.min(1, view.e * 1.2);
  const synthOn = view.synth > 0.01;
  const stuck = supply && mode === "cn";
  const rad = (view.rot * Math.PI) / 180;

  const aria = `Inner mitochondrial membrane. Electron transport complexes I, III and IV pump protons into the intermembrane space; ATP synthase lets them flow back. ${modeInfo.label}. Proton gradient ${Math.round(g * 100)} percent, ATP made ${Math.floor(view.atp)}.`;

  return (
    <VizFrame
      title="Chemiosmosis: a proton battery makes ATP"
      caption="Let the gradient build, then break the system four different ways and see which part fails: the pumps, the turbine, or the membrane."
      simplified="Complex II feeds electrons from FADH₂ but pumps no protons, so it is shown without arrows. Proton counts (4, 4, 2 per NADH) are textbook approximations; the real stoichiometry is debated, which is why modern values are about 2.5 ATP per NADH and 1.5 per FADH₂ rather than 3 and 2. ATP and heat counters are in arbitrary units, and the rates and the pH values are illustrative, not measured."
      controls={
        <>
          <label>
            <input type="checkbox" checked={supply} onChange={(e) => setSupply(e.target.checked)} /> Supply NADH + O₂
          </label>
          {MODES.map((m) => (
            <button key={m.id} type="button" className="btn sm" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}
              style={mode === m.id ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}>
              {m.label}
            </button>
          ))}
          {reduced && <button type="button" className="btn sm" onClick={() => burst(1)}>Advance 1 s ▸</button>}
          {reduced && <button type="button" className="btn sm" onClick={() => burst(5)}>Advance 5 s ▸▸</button>}
          <button type="button" className="btn sm" onClick={reset}>Reset</button>
        </>
      }
    >
      <div ref={ref}>
        <svg viewBox="0 0 720 390" role="img" aria-label={aria} style={{ fontFamily: "var(--font-body)" }}>
          <rect x="0" y="0" width="720" height="150" fill="rgba(255,77,141,0.06)" />
          <rect x="0" y="195" width="720" height="195" fill="rgba(94,184,255,0.06)" />
          <text x="10" y="16" fontSize="12" fill="var(--ink)">Intermembrane space (H⁺ accumulate, acidic side)</text>
          <text x="10" y="380" fontSize="12" fill="var(--ink)">Mitochondrial matrix (H⁺ low, alkaline side)</text>
          <rect x="0" y="150" width="720" height="45" fill="rgba(255,195,0,0.12)" />
          <line x1="0" y1="150" x2="720" y2="150" stroke="var(--gold)" strokeWidth="1.5" />
          <line x1="0" y1="195" x2="720" y2="195" stroke="var(--gold)" strokeWidth="1.5" />

          {/* proton cloud in IMS; sparse in matrix */}
          {PROTONS.slice(0, nIms).map((p, i) => (
            <g key={i}>
              <circle cx={p.x + (reduced ? 0 : Math.sin(view.phase * 3 + p.s) * 3)} cy={p.y} r="6" fill="var(--pink)" />
              <text x={p.x + (reduced ? 0 : Math.sin(view.phase * 3 + p.s) * 3)} y={p.y + 3} textAnchor="middle" fontSize="8" fill="#000" fontWeight="bold">+</text>
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={60 + i * 110} cy={285 + (i % 2) * 40} r="4" fill="var(--pink)" opacity="0.7" />
          ))}

          {/* complexes */}
          {[{ x: 90, n: "I", w: 52 }, { x: 175, n: "II", w: 38 }, { x: 290, n: "III", w: 52 }, { x: 410, n: "IV", w: 52 }].map((c) => (
            <g key={c.n}>
              <rect x={c.x - c.w / 2} y="136" width={c.w} height="72" rx="12" fill="rgba(94,184,255,0.28)" stroke="var(--info)" strokeWidth="2"
                strokeDasharray={stuck && c.n === "IV" ? "4 3" : undefined} />
              <text x={c.x} y="178" textAnchor="middle" fontSize="14" fontWeight="bold" fill="var(--ink)">{c.n}</text>
            </g>
          ))}
          {stuck && <text x="410" y="228" textAnchor="middle" fontSize="12" fill="var(--red)" fontWeight="bold">✕ blocked</text>}
          <text x="205" y="115" fontSize="11" fill="var(--ink-dim)">Q (mobile carrier)</text>
          <text x="352" y="112" fontSize="11" fill="var(--ink-dim)">cyt c</text>
          <path d="M142,172 H271 M175,172 H205 M342,172 L350,128 L384,172" fill="none" stroke="var(--ink-dim)" strokeWidth="1" strokeDasharray="3 3" />

          {/* proton pumps */}
          {[{ x: 90, n: 4 }, { x: 290, n: 4 }, { x: 410, n: 2 }].map((p) => (
            <g key={p.x} opacity={pumpOp}>
              <path d={`M${p.x},134 V94 M${p.x - 6},102 L${p.x},92 L${p.x + 6},102`} fill="none" stroke="var(--pink)" strokeWidth="2.5" />
              <text x={p.x + 10} y="100" fontSize="12" fill="var(--pink)" fontWeight="bold">{p.n} H⁺</text>
            </g>
          ))}
          <text x="90" y="256" textAnchor="middle" fontSize="12" fill="var(--ink)">NADH → NAD⁺ + H⁺</text>
          <text x="410" y="252" textAnchor="middle" fontSize="12" fill="var(--ink)">½O₂ + 2H⁺ + 2e⁻ → H₂O</text>

          {/* electrons */}
          {[0, 1, 2, 3, 4].map((k) => {
            const u = supply ? (view.phase + k * 0.8) % 4 : 0.3 + k * 0.7;
            const [x, y] = mode === "cn" ? ptAt(k * 0.5) : ptAt(u);
            return <circle key={k} cx={x} cy={y} r="5" fill="var(--gold)" stroke="#000" strokeWidth="1" opacity={supply ? 1 : 0.25} />;
          })}
          <text x="446" y="128" fontSize="11" fill="var(--gold)">e⁻ = electrons</text>

          {/* ATP synthase */}
          <rect x="545" y="140" width="50" height="58" rx="8" fill="rgba(74,222,128,0.28)" stroke="var(--good)" strokeWidth="2" />
          <text x="570" y="174" textAnchor="middle" fontSize="12" fill="var(--ink)">F₀</text>
          <rect x="566" y="198" width="8" height="14" fill="var(--good)" />
          <circle cx="570" cy="244" r="34" fill="rgba(74,222,128,0.2)" stroke="var(--good)" strokeWidth="2" />
          <line x1="570" y1="244" x2={570 + 26 * Math.cos(rad)} y2={244 + 26 * Math.sin(rad)} stroke="var(--gold)" strokeWidth="5" strokeLinecap="round" />
          <circle cx="570" cy="244" r="5" fill="var(--gold)" />
          <text x="570" y="296" textAnchor="middle" fontSize="12" fill="var(--ink)">F₁ (ADP + Pᵢ → ATP)</text>
          <text x="570" y="132" textAnchor="middle" fontSize="12" fill="var(--ink)">ATP synthase</text>
          {mode === "oligo" && <text x="570" y="174" textAnchor="middle" fontSize="12" fill="var(--red)" dy="16" fontWeight="bold">✕ plugged</text>}
          {synthOn && (
            <g fill="none" stroke="var(--pink)" strokeWidth="2.5">
              <path d="M556,100 V132 M550,124 L556,134 L562,124" />
              <path d="M584,100 V132 M578,124 L584,134 L590,124" />
              <text x="620" y="124" fontSize="11" fill="var(--pink)" stroke="none">H⁺ flow back</text>
            </g>
          )}
          {synthOn && <text x="640" y="244" fontSize="14" fill="var(--good)" fontWeight="bold">ATP!</text>}

          {/* uncoupler */}
          {mode === "dnp" && (
            <g>
              {[470, 500].map((x) => (
                <path key={x} d={`M${x},110 V190 M${x - 6},180 L${x},192 L${x + 6},180`} fill="none" stroke="var(--red)" strokeWidth="2.5" strokeDasharray="5 3" />
              ))}
              <text x="485" y="106" textAnchor="middle" fontSize="11" fill="var(--red)">DNP shuttles H⁺ across</text>
              <text x="485" y="224" textAnchor="middle" fontSize="12" fill="var(--gold)">heat ♨</text>
            </g>
          )}
        </svg>
      </div>

      <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, margin: "8px 0", fontSize: "0.88rem" }}>
        <Meter label="Proton gradient (ΔpH)" frac={g} text={`ΔpH ≈ ${dpH.toFixed(2)}  (IMS ${(7.8 - dpH).toFixed(1)} | matrix 7.8)`} color="var(--pink)" />
        <Meter label="Electron flow / O₂ use" frac={view.e} text={`${Math.round(view.e * 100)}%`} color="var(--gold)" />
        <div><span className="dim">ATP made</span><br /><b className="mono" style={{ color: "var(--good)", fontSize: "1.3rem" }}>{Math.floor(view.atp)}</b></div>
        <div><span className="dim">Heat released</span><br /><b className="mono" style={{ color: "var(--red)", fontSize: "1.3rem" }}>{Math.floor(view.heat)}</b></div>
      </div>
      <div role="status" aria-live="polite" style={{ fontSize: "0.92rem" }}>
        <b style={{ color: "var(--gold)" }}>{modeInfo.label}.</b> {supply ? modeInfo.text : "With no NADH or O₂ supplied, nothing pumps protons: the gradient drains through leaks and ATP synthase and ATP production stops."}
      </div>
      <p className="dim" style={{ fontSize: "0.82rem", margin: "6px 0 0" }}>
        I NADH dehydrogenase · II succinate dehydrogenase · III cytochrome bc₁ · IV cytochrome c oxidase. The proton-motive force is a pH difference plus an electrical potential (inside negative, roughly 150–180 mV), and the electrical part contributes most of it.
      </p>
    </VizFrame>
  );
}

function Meter({ label, frac, text, color }: { label: string; frac: number; text: string; color: string }) {
  return (
    <div>
      <span className="dim">{label}</span>
      <div style={{ height: 8, background: "var(--glass)", borderRadius: 999, overflow: "hidden", margin: "4px 0" }}>
        <div style={{ width: `${Math.round(frac * 100)}%`, height: "100%", background: color }} />
      </div>
      <span className="mono" style={{ fontSize: "0.8rem" }}>{text}</span>
    </div>
  );
}
