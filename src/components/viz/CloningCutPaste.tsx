import { useState } from "react";
import { VizFrame } from "./VizFrame";

/** Type II restriction enzymes. `cut` = index in the top strand where the cut falls (G^AATTC -> 1). All leave 5′ overhangs. */
const ENZ = {
  EcoRI: { site: "GAATTC", cut: 1 },
  BamHI: { site: "GGATCC", cut: 1 },
  HindIII: { site: "AAGCTT", cut: 1 },
} as const;
type Enz = keyof typeof ENZ;
const NAMES: Enz[] = ["EcoRI", "BamHI", "HindIII"];
const STEPS = ["Choose", "Cut", "Mix", "Ligate", "Transform", "Select"];

const PAIR: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
const comp = (s: string) => [...s].map((c) => PAIR[c] ?? c).join("");
const overhang = (e: Enz) => ENZ[e].site.slice(ENZ[e].cut, ENZ[e].site.length - ENZ[e].cut);
const siteText = (e: Enz) => ENZ[e].site.slice(0, ENZ[e].cut) + "^" + ENZ[e].site.slice(ENZ[e].cut);

/** Two-line text for the end of the piece to the LEFT of a cut, and of the piece to the RIGHT of a cut. */
function endText(e: Enz, side: "left" | "right"): string {
  const { site, cut } = ENZ[e];
  const n = site.length, gap = " ".repeat(n - 2 * cut);
  return side === "left"
    ? `5′ …${site.slice(0, cut)}${gap} 3′\n3′ …${comp(site.slice(0, n - cut))} 5′`
    : `5′ ${site.slice(cut)}… 3′\n3′ ${gap}${comp(site.slice(n - cut))}… 5′`;
}

const rad = (a: number) => (a * Math.PI) / 180;
const pol = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.sin(rad(a)), cy - r * Math.cos(rad(a))];
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = pol(cx, cy, r, a0), [x1, y1] = pol(cx, cy, r, a1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

const G = 18; // half-gap (degrees) where the plasmid is cut
const CX = 190, CY = 150, R = 78;

type RingMode = "closed" | "open" | "rec";
function Ring({ mode, cx = CX, cy = CY, r = R, small = false, enz }: { mode: RingMode; cx?: number; cy?: number; r?: number; small?: boolean; enz: Enz }) {
  const lab = (a: number, text: string, color: string) => {
    const [x, y] = pol(cx, cy, r + 18, a);
    return <text x={x} y={y} textAnchor={Math.sin(rad(a)) > 0.3 ? "start" : Math.sin(rad(a)) < -0.3 ? "end" : "middle"} fontSize={12} fill={color}>{text}</text>;
  };
  const w = r < 30 ? 3 : small ? 6 : 9;
  return (
    <g>
      {mode === "closed" ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ink-dim)" strokeWidth={2} /> : <path d={arc(cx, cy, r, G, 360 - G)} fill="none" stroke="var(--ink-dim)" strokeWidth={2} />}
      <path d={arc(cx, cy, r, 95, 205)} fill="none" stroke="var(--pink)" strokeWidth={w} />
      <path d={arc(cx, cy, r, 225, 300)} fill="none" stroke="var(--info)" strokeWidth={w} />
      {mode === "closed" ? <path d={arc(cx, cy, r, -42, 42)} fill="none" stroke="var(--good)" strokeWidth={w} /> : (
        <>
          <path d={arc(cx, cy, r, -42, -G)} fill="none" stroke="var(--good)" strokeWidth={w} />
          <path d={arc(cx, cy, r, G, 42)} fill="none" stroke="var(--good)" strokeWidth={w} />
        </>
      )}
      {mode === "rec" && <path d={arc(cx, cy, r, -G, G)} fill="none" stroke="var(--gold)" strokeWidth={w + 2} />}
      {mode === "closed" && <line x1={pol(cx, cy, r - 10, 0)[0]} y1={pol(cx, cy, r - 10, 0)[1]} x2={pol(cx, cy, r + 10, 0)[0]} y2={pol(cx, cy, r + 10, 0)[1]} stroke="var(--gold)" strokeWidth={3} />}
      {mode === "open" && [-G, G].map((a) => <circle key={a} cx={pol(cx, cy, r, a)[0]} cy={pol(cx, cy, r, a)[1]} r={5} fill="var(--gold)" />)}
      {!small && (
        <>
          {lab(150, "AmpR", "var(--pink)")}
          {lab(262, "ori", "var(--info)")}
          {lab(-52, "lacZα", "var(--good)")}
          {mode === "closed" && lab(0, `MCS: ${enz} site`, "var(--gold)")}
        </>
      )}
    </g>
  );
}

const SPOTS = Array.from({ length: 12 }, (_, i): [number, number] => {
  const rr = 82 * Math.sqrt((i + 0.5) / 12), a = i * 2.39996;
  return [rr * Math.cos(a), rr * Math.sin(a)];
});
const LAWN = Array.from({ length: 90 }, (_, i): [number, number] => {
  const rr = 92 * Math.sqrt((i + 0.5) / 90), a = i * 2.39996;
  return [rr * Math.cos(a), rr * Math.sin(a)];
});

export default function CloningCutPaste() {
  const [vec, setVec] = useState<Enz>("EcoRI");
  const [ins, setIns] = useState<Enz>("EcoRI");
  const [step, setStep] = useState(0);
  const [amp, setAmp] = useState(true);
  const ok = overhang(vec) === overhang(ins);
  const colonies = ok ? 12 : 8;
  const isBlue = (i: number) => (ok ? i % 4 === 3 : true);
  const nBlue = Array.from({ length: colonies }, (_, i) => i).filter(isBlue).length;
  const ringMode: RingMode = step === 0 ? "closed" : step < 3 ? "open" : ok ? "rec" : "closed";

  const texts = [
    `Pick the enzyme that cuts the plasmid's multiple cloning site (MCS) and the enzyme that cuts out the insert. ${vec} cuts ${siteText(vec)}, ${ins} cuts ${siteText(ins)}.`,
    `Each enzyme cuts both strands but staggered, leaving single-stranded 5′ overhangs (sticky ends): ${vec} leaves 5′-${overhang(vec)}-3′ on the vector, ${ins} leaves 5′-${overhang(ins)}-3′ on the insert. The flanking DNA is discarded.`,
    ok ? `Mix: both ends carry the same overhang (${overhang(vec)}). It is palindromic, so it base-pairs with itself antiparallel: the sticky ends can find each other by hydrogen bonds.` : `Mix: vector overhang ${overhang(vec)} versus insert overhang ${overhang(ins)}. These bases cannot pair, so the insert cannot anneal to the vector.`,
    ok ? `DNA ligase (uses ATP) seals the sugar–phosphate backbone, making a recombinant plasmid. Because one enzyme cut both ends, the insert can go in either orientation, and the vector can also simply re-close empty (so some background is expected).` : `Wrong pair: ${vec} and ${ins} ends are not compatible, so ligase has nothing to join. The only ends that match are the vector's own two ends, so it re-closes empty. No recombinant plasmid forms.`,
    `Transformation: competent E. coli take up plasmid (e.g. heat shock at 42 °C). Only a small fraction of the cells actually take up a plasmid.`,
    amp ? `Plate with ampicillin + X-gal (+ IPTG): cells without a plasmid die (no AmpR). Colonies with intact lacZα cut X-gal and turn blue (empty vector). An insert in the MCS breaks lacZα, so those colonies stay white. ${ok ? `Here: ${colonies - nBlue} white (recombinant), ${nBlue} blue (empty vector).` : `Here: all ${colonies} colonies are blue (empty vector). No white colonies = no insert.`}` : `Without ampicillin there is no selection: every cell grows into a lawn, including cells that never took up a plasmid.`,
  ];

  const mid = step === 3 && !ok;
  return (
    <VizFrame
      title="Cut, paste, copy: building a recombinant plasmid"
      caption="Choose a restriction enzyme for the plasmid and for the insert, then step through. Try mismatching them."
      simplified="Sequences and geometry are schematic. In practice vectors are often cut with two different enzymes (for directional cloning) and treated with phosphatase to cut down empty re-closure, ligations give mixtures, and blue/white screening needs a host strain carrying the lacZΔM15 fragment. Colony counts and colours here are illustrative, not predictions."
      controls={
        <>
          <label>Cut plasmid with
            <select value={vec} onChange={(e) => { setVec(e.target.value as Enz); setStep(0); }} style={{ background: "var(--bg-raise)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 6px" }}>
              {NAMES.map((n) => <option key={n} value={n}>{n} ({siteText(n)})</option>)}
            </select>
          </label>
          <label>Cut insert with
            <select value={ins} onChange={(e) => { setIns(e.target.value as Enz); setStep(0); }} style={{ background: "var(--bg-raise)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 6px" }}>
              {NAMES.map((n) => <option key={n} value={n}>{n} ({siteText(n)})</option>)}
            </select>
          </label>
          <button type="button" className="btn sm" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</button>
          <button type="button" className="btn sm" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Next: {STEPS[Math.min(step + 1, STEPS.length - 1)]} →</button>
          <label><input type="checkbox" checked={amp} onChange={(e) => setAmp(e.target.checked)} /> Ampicillin in plate</label>
        </>
      }
    >
      <ol style={{ display: "flex", flexWrap: "wrap", gap: 6, listStyle: "none", padding: 0, margin: "0 0 8px" }}>
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <span className={i === step ? "chip gold" : "chip"}>{i + 1}. {s}</span>
          </li>
        ))}
      </ol>
      <svg viewBox="0 0 640 300" role="img" aria-label={`Step ${step + 1}, ${STEPS[step]}. Plasmid is ${ringMode === "rec" ? "recombinant, insert in the multiple cloning site" : ringMode === "open" ? "cut open" : step >= 3 ? "re-closed empty" : "intact"}. Enzymes: plasmid ${vec}, insert ${ins}, ends ${ok ? "compatible" : "not compatible"}.`}>
        <Ring mode={ringMode} enz={vec} small={step >= 4} cx={step >= 4 ? 110 : CX} cy={step >= 4 ? 150 : CY} r={step >= 4 ? 50 : R} />
        <text x={step >= 4 ? 110 : CX} y={step >= 4 ? 154 : CY + 4} textAnchor="middle" fontSize={step >= 4 ? 10 : 12} fill="var(--ink-dim)">
          {ringMode === "rec" ? "recombinant" : step >= 3 ? "empty vector" : "plasmid"}
        </text>
        {step === 2 && (
          <g>
            <line x1={CX - 25} y1={CY - R - 40} x2={CX + 25} y2={CY - R - 40} stroke="var(--gold)" strokeWidth={10} strokeLinecap="round" />
            <text x={CX + 40} y={CY - R - 36} fontSize={12} fill="var(--gold)">insert</text>
            <text x={CX} y={CY - R - 14} textAnchor="middle" fontSize={20} fill={ok ? "var(--good)" : "var(--red)"}>{ok ? "✓ ends fit" : "✗ ends clash"}</text>
          </g>
        )}
        {step <= 1 && (
          <g>
            <line x1={390} y1={150} x2={620} y2={150} stroke="var(--ink-dim)" strokeWidth={4} opacity={step === 1 ? 0 : 1} />
            {step === 1 && [[395, 425], [585, 615]].map(([a, b]) => <line key={a} x1={a} y1={150} x2={b} y2={150} stroke="var(--ink-dim)" strokeWidth={4} opacity={0.35} />)}
            <rect x={450} y={134} width={120} height={32} rx={4} fill="var(--gold)" opacity={0.9} />
            <text x={510} y={155} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1a1200">insert gene</text>
            {step === 0 && [450, 570].map((x) => <line key={x} x1={x} y1={120} x2={x} y2={180} stroke="var(--pink)" strokeWidth={2} />)}
            {step === 0 && <text x={510} y={112} textAnchor="middle" fontSize={12} fill="var(--pink)">{ins} sites (one at each end)</text>}
            {step === 1 && <text x={510} y={196} textAnchor="middle" fontSize={12} fill="var(--ink-dim)">sticky ends: 5′-{overhang(ins)}-3′; grey flanks discarded</text>}
          </g>
        )}
        {step === 3 && (
          <g fontSize={13} fill="var(--ink)">
            <text x={390} y={120}>{ok ? "DNA ligase + ATP" : "No match, no join"}</text>
            <text x={390} y={142} fill="var(--ink-dim)" fontSize={12}>{ok ? "phosphodiester bonds seal the nicks" : "vector can only re-close on itself"}</text>
            {mid && <><line x1={450} y1={190} x2={570} y2={190} stroke="var(--gold)" strokeWidth={10} strokeLinecap="round" /><text x={510} y={218} textAnchor="middle" fontSize={12} fill="var(--gold)">insert left free</text></>}
          </g>
        )}
        {step === 4 && [0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={270 + (i % 2) * 170} y={80 + Math.floor(i / 2) * 100} width={130} height={56} rx={28} fill="var(--glass)" stroke="var(--ink-dim)" strokeWidth={2} />
            {i % 2 === 0 && <Ring mode={ringMode} enz={vec} small cx={335 + (i % 2) * 170} cy={108 + Math.floor(i / 2) * 100} r={14} />}
            <text x={335 + (i % 2) * 170} y={150 + Math.floor(i / 2) * 100} textAnchor="middle" fontSize={11} fill="var(--ink-dim)">{i % 2 === 0 ? "took up plasmid" : "no plasmid"}</text>
          </g>
        ))}
        {step === 5 && (
          <g transform="translate(500 150)">
            <circle r={106} fill="var(--bg-raise)" stroke="var(--ink-dim)" strokeWidth={3} />
            {amp ? SPOTS.slice(0, colonies).map(([x, y], i) => (isBlue(i)
              ? <g key={i}><circle cx={x} cy={y} r={8} fill="var(--info)" /><circle cx={x} cy={y} r={3} fill="var(--bg)" /></g>
              : <circle key={i} cx={x} cy={y} r={8} fill="var(--ink)" />))
              : LAWN.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill="var(--ink-dim)" opacity={0.7} />)}
            <text y={128} textAnchor="middle" fontSize={12} fill="var(--ink-dim)">{amp ? "LB agar + ampicillin + X-gal + IPTG" : "plate without antibiotic: lawn"}</text>
          </g>
        )}
      </svg>
      {step >= 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "4px 0 8px" }}>
          {([["Vector", vec, "left"], ["Vector", vec, "right"], ["Insert", ins, "right"], ["Insert", ins, "left"]] as const).map(([who, e, side], i) => (
            <div key={i}>
              <div className="dim" style={{ fontSize: "0.75rem" }}>{who} end ({e})</div>
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--ink)" }}>{endText(e, side)}</pre>
            </div>
          ))}
        </div>
      )}
      {step === 5 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <span className="chip">white solid dot = insert present (lacZα broken)</span>
          <span className="chip">blue dot with centre hole = empty vector (lacZα intact)</span>
        </div>
      )}
      <p aria-live="polite" style={{ margin: 0 }}><b>{STEPS[step]}.</b> {texts[step]}</p>
    </VizFrame>
  );
}
