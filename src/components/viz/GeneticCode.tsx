import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { VizFrame } from "./VizFrame";
import { FULL_NAME, RNA_BASES, STOP_NAMES, THREE_LETTER, aaAt, codonAt, codonIndex, translateCodon } from "./codonTable";

const CX = 230, CY = 230;
const RINGS: [number, number][] = [[32, 72], [72, 112], [112, 152], [152, 204]];
const CLASS_COLOR: Record<string, string> = { nonpolar: "#ffc300", polar: "#5eb8ff", positive: "#ff4d8d", negative: "#4ade80", stop: "#d90429" };
const CLASS_LABEL: Record<string, string> = { nonpolar: "nonpolar", polar: "polar, uncharged", positive: "positively charged", negative: "negatively charged", stop: "stop" };

function aaClass(a: string): string {
  if (a === "*") return "stop";
  if ("KRH".includes(a)) return "positive";
  if ("DE".includes(a)) return "negative";
  if ("STCYNQ".includes(a)) return "polar";
  return "nonpolar";
}

const pol = (r: number, deg: number): [number, number] => [CX + r * Math.cos((deg * Math.PI) / 180), CY + r * Math.sin((deg * Math.PI) / 180)];
function sector(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = pol(r1, a0), [x1, y1] = pol(r1, a1), [x2, y2] = pol(r0, a1), [x3, y3] = pol(r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3}Z`;
}

type Mode = "aug" | 1 | 2 | 3;

export default function GeneticCode(): ReactElement {
  const [raw, setRaw] = useState("GGAUGGCUUGGAAAUAGCC");
  const [mode, setMode] = useState<Mode>("aug");
  const [pick, setPick] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const seq = raw.toUpperCase().replace(/T/g, "U").replace(/[^ACGU]/g, "");
  const frame = useMemo(() => {
    const start = mode === "aug" ? seq.indexOf("AUG") : mode - 1;
    const codons: string[] = [];
    let stopped = false;
    if (start >= 0) {
      for (let i = start; i + 3 <= seq.length; i += 3) {
        const c = seq.slice(i, i + 3);
        codons.push(c);
        if (translateCodon(c) === "*") { stopped = true; break; }
      }
    }
    return { start, codons, stopped };
  }, [seq, mode]);

  const aas = frame.codons.map(translateCodon).filter((a) => a !== "*");
  const active = hover ?? pick;
  const activeIdx = active ? codonIndex(active) : -1;
  const activeAa = active ? translateCodon(active) : "";
  const used = frame.start >= 0 ? frame.start + frame.codons.length * 3 : seq.length;

  const wheel = useMemo(() => {
    const out: ReactElement[] = [];
    for (let k = 0; k < 64; k++) {
      for (let ring = 0; ring < 4; ring++) {
        const n = ring === 3 ? 64 : 4 ** (ring + 1);
        const span = 360 / n;
        const j = ring === 3 ? k : Math.floor(k / 4 ** (2 - ring));
        if (ring < 3 && k % 4 ** (2 - ring) !== 0) continue;
        const a0 = -90 + j * span, a1 = a0 + span;
        const [r0, r1] = RINGS[ring];
        const aa = aaAt(k);
        const col = ring === 3 ? CLASS_COLOR[aaClass(aa)] : "#ffffff";
        const [tx, ty] = pol((r0 + r1) / 2, (a0 + a1) / 2);
        const label = ring === 3 ? (aa === "*" ? "■" : aa) : ring === 2 ? RNA_BASES[k % 4] : ring === 1 ? RNA_BASES[Math.floor((k % 16) / 4)] : RNA_BASES[Math.floor(k / 16)];
        const hit = ring >= 2 ? codonAt(k) : null;
        out.push(
          <g key={`${ring}-${j}`} data-k={k}>
            <path d={sector(r0, r1, a0, a1)} fill={col} fillOpacity={ring === 3 ? 0.28 : 0.04} stroke="#3a3040" strokeWidth={0.8}
              onClick={hit ? () => { setRaw((s) => s + hit); setPick(hit); setNote(`Appended ${hit} (${THREE_LETTER[aa]}) to the end of the mRNA.`); } : undefined}
              onMouseEnter={hit ? () => setHover(hit) : undefined} onMouseLeave={hit ? () => setHover(null) : undefined}
              style={hit ? { cursor: "pointer" } : undefined} />
            <text x={tx} y={ty + 4} textAnchor="middle" fontSize={ring === 0 ? 18 : ring === 1 ? 14 : 12} fontWeight={ring === 3 ? 700 : 500} fontFamily="var(--font-mono)" fill={ring === 3 && aa === "*" ? "#ff8ea0" : "#f5f0f1"} pointerEvents="none">{label}</text>
          </g>,
        );
      }
    }
    return out;
  }, []);

  const hi = (ring: number): ReactElement | null => {
    if (activeIdx < 0) return null;
    const n = ring === 3 ? 64 : 4 ** (ring + 1);
    const j = ring === 3 ? activeIdx : Math.floor(activeIdx / 4 ** (2 - ring));
    const span = 360 / n, a0 = -90 + j * span;
    return <path d={sector(RINGS[ring][0], RINGS[ring][1], a0, a0 + span)} fill="rgba(255,195,0,0.35)" stroke="#ffc300" strokeWidth={2} pointerEvents="none" />;
  };

  const synonyms = activeAa ? Array.from({ length: 64 }, (_, k) => k).filter((k) => aaAt(k) === activeAa).map(codonAt) : [];
  const chipBtn = (label: string, on: boolean, f: () => void) => (
    <button key={label} className="btn sm" aria-pressed={on} onClick={f} style={on ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}>{label}</button>
  );
  const summary = frame.start < 0
    ? (mode === "aug" ? "No AUG start codon found in this sequence." : "Sequence too short to read in this frame.")
    : `Reading from base ${frame.start + 1}: ${frame.codons.length} codon${frame.codons.length === 1 ? "" : "s"}, ${aas.length} amino acid${aas.length === 1 ? "" : "s"}${frame.stopped ? ", ended by a stop codon" : ", no stop codon reached"}.`;

  return (
    <VizFrame
      title="The genetic code wheel"
      caption="Read each codon from the centre outward (1st, 2nd, 3rd base) to its amino acid. Type an mRNA and watch the ribosome's reading frame start at AUG and end at a stop."
      simplified="This is the standard nuclear code. Mitochondria differ (in vertebrates UGA = Trp, AUA = Met, AGA/AGG = stop), and some organisms recode UGA or UAG (e.g. selenocysteine). Real ribosomes also need a ribosome-binding site or 5′ cap scanning, and AUG is only one of several (rarer) start codons."
      controls={
        <>
          <label>
            mRNA 5′→3′
            <input className="field" style={{ width: "min(340px, 70vw)", padding: "6px 10px", fontFamily: "var(--font-mono)" }} value={raw} maxLength={60} spellCheck={false} autoComplete="off"
              onChange={(e) => { setRaw(e.target.value); setNote(""); }} aria-describedby="gc-help" />
          </label>
          <span id="gc-help" className="dim" style={{ fontSize: "0.8rem" }}>A, C, G, U only (T becomes U); max 60 nt</span>
          <button className="btn sm" onClick={() => { setRaw("GGAUGGCUUGGAAAUAGCC"); setMode("aug"); setNote(""); }}>Example</button>
          <button className="btn sm" onClick={() => { setRaw(""); setPick(null); }}>Clear</button>
          <span role="group" aria-label="Reading frame" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {chipBtn("Start at first AUG", mode === "aug", () => setMode("aug"))}
            {([1, 2, 3] as const).map((f) => chipBtn(`Frame ${f}`, mode === f, () => setMode(f)))}
          </span>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "start" }}>
        <div>
          <svg viewBox="0 0 460 460" role="img" aria-label="Circular genetic code wheel. Rings from the centre: first base, second base, third base, then the amino acid. Use the text box to look up codons.">
            <circle cx={CX} cy={CY} r={RINGS[0][0]} fill="#0e0b10" stroke="#3a3040" />
            <text x={CX} y={CY + 3} textAnchor="middle" fontSize={9} fill="#b9aeb2">1st→3rd</text>
            {wheel}
            {hi(0)}{hi(1)}{hi(2)}{hi(3)}
          </svg>
          <p style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: "0.78rem", margin: "6px 0 0" }}>
            {Object.keys(CLASS_COLOR).map((c) => (
              <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <i style={{ width: 11, height: 11, borderRadius: 3, background: CLASS_COLOR[c], opacity: 0.8, display: "inline-block" }} />{CLASS_LABEL[c]}{c === "stop" ? " (■)" : ""}
              </span>
            ))}
          </p>
          <p className="dim" style={{ fontSize: "0.8rem", margin: "4px 0 0" }}>Pointer users: hover a slice to inspect it, click to append that codon.</p>
        </div>

        <div aria-live="polite">
          <div style={{ fontSize: "0.8rem", color: "var(--ink-dim)", marginBottom: 4 }}>Reading frame (click a codon to find it on the wheel)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontFamily: "var(--font-mono)", alignItems: "center", marginBottom: 10 }}>
            {frame.start > 0 && <span style={{ opacity: 0.55 }} title="Before the start: not translated">{seq.slice(0, frame.start)}</span>}
            {frame.codons.map((c, i) => {
              const a = translateCodon(c), isStart = i === 0 && c === "AUG" && mode === "aug";
              return (
                <button key={i} onClick={() => setPick(c)} aria-label={`Codon ${i + 1}: ${c}, ${a === "*" ? "stop" : FULL_NAME[a]}${isStart ? ", start" : ""}`}
                  style={{ border: `1px solid ${a === "*" ? "var(--red)" : isStart ? "var(--good)" : "var(--line)"}`, borderRadius: 8, padding: "3px 6px", background: pick === c ? "var(--gold-soft)" : "var(--glass)", color: "var(--ink)", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                  <div>{c}</div>
                  <div style={{ fontSize: "0.72rem", color: a === "*" ? "#ff8ea0" : "var(--ink-dim)" }}>{isStart ? "start · " : ""}{a === "*" ? "STOP" : THREE_LETTER[a]}</div>
                </button>
              );
            })}
            {used < seq.length && <span style={{ opacity: 0.55 }} title="Not translated">{seq.slice(used)}</span>}
          </div>
          {frame.stopped && frame.codons.length > 0 && <p className="dim" style={{ fontSize: "0.8rem", margin: "0 0 8px" }}>{STOP_NAMES[frame.codons[frame.codons.length - 1]] ? `${frame.codons[frame.codons.length - 1]} is the "${STOP_NAMES[frame.codons[frame.codons.length - 1]]}" stop codon. ` : ""}No tRNA matches it, so release factors end translation; bases after it are not translated.</p>}
          <p style={{ margin: "0 0 4px" }}>{summary}</p>
          <div style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--glass)", marginBottom: 8 }}>
            <div style={{ fontSize: "0.8rem", color: "var(--ink-dim)" }}>Peptide (N → C terminus)</div>
            <div className="mono" style={{ fontSize: "1.15rem", color: "var(--gold)", wordBreak: "break-all" }}>{aas.join("") || "—"}</div>
            <div className="mono" style={{ fontSize: "0.85rem", wordBreak: "break-word" }}>{aas.map((a) => THREE_LETTER[a]).join("–") || "—"}</div>
          </div>
          <div style={{ minHeight: 64, fontSize: "0.9rem" }}>
            {active ? (
              <>
                <b className="mono">{active}</b> → {activeAa === "*" ? <b>STOP</b> : <b>{FULL_NAME[activeAa]} ({THREE_LETTER[activeAa]}, {activeAa})</b>}, {CLASS_LABEL[aaClass(activeAa)]}.{" "}
                {synonyms.length} codon{synonyms.length === 1 ? "" : "s"} for this: <span className="mono">{synonyms.join(" ")}</span>
                {active === "AUG" && <> AUG is also the usual start codon (Met).</>}
              </>
            ) : <span className="dim">Hover the wheel or click a codon to see its details.</span>}
            {note && <div className="dim">{note}</div>}
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
