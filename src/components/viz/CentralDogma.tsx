import { useEffect, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { THREE_LETTER, translateCodon } from "./codonTable";

const EXON = "ATGGAATGGTAA"; // coding (sense) strand of the 12-nt gene: ATG GAA TGG TAA = Met-Glu-Trp-Stop
const INTRON = "GTAAGTTCAG"; // starts GU..., ends ...AG (the conserved splice-site dinucleotides); inserted after nt 6
const SPLIT = 6;
const COMP: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
const CELL = 24;
const NEXT: Record<string, string> = { A: "C", C: "G", G: "T", T: "A" };

interface Read { start: number; codons: string[]; aas: string[]; complete: boolean }

function read(mrna: string): Read {
  const start = mrna.indexOf("AUG");
  const out: Read = { start, codons: [], aas: [], complete: false };
  if (start < 0) return out;
  for (let i = start; i + 3 <= mrna.length; i += 3) {
    const c = mrna.slice(i, i + 3), a = translateCodon(c);
    out.codons.push(c);
    out.aas.push(a);
    if (a === "*") { out.complete = true; break; }
  }
  return out;
}

const cellStyle = (color: string, extra?: CSSProperties): CSSProperties => ({
  width: CELL, height: 28, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
  fontFamily: "var(--font-mono)", fontWeight: 700, color, fontSize: "0.95rem", ...extra,
});

function Row({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div style={{ display: "flex", alignItems: "center", minHeight: 34 }}>
      <div style={{ width: 128, flex: "none", fontSize: "0.78rem", color: "var(--ink-dim)", position: "sticky", left: 0, background: "#121012", zIndex: 1, paddingRight: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function classify(origAa: string, newAa: string, isStart: boolean, newCodon: string): string {
  if (isStart && newCodon !== "AUG") return "start-codon loss";
  if (origAa === newAa) return "silent";
  if (newAa === "*") return "nonsense";
  if (origAa === "*") return "stop-loss";
  return "missense";
}

const EFFECT: Record<string, string> = {
  silent: "Silent: the codon changed but still codes for the same amino acid (the code is degenerate).",
  missense: "Missense: one amino acid is swapped for another; the effect depends on how different they are.",
  nonsense: "Nonsense: a codon became a stop, so the protein is cut short.",
  "stop-loss": "Stop-loss: the stop codon is gone, so the ribosome reads on into the 3′ untranslated region.",
  "start-codon loss": "Start-codon loss: no AUG here, so the ribosome scans on for the next AUG (if any).",
};

export default function CentralDogma(): ReactElement {
  const reduced = useReducedMotion();
  const [bases, setBases] = useState<string[]>(EXON.split(""));
  const [intron, setIntron] = useState(false);
  const [stage, setStage] = useState(0); // 0 DNA only, 1 pre-mRNA made, 2 mature mRNA ready
  const [lit, setLit] = useState(0);
  const [playing, setPlaying] = useState(false);

  const cells = bases.flatMap((b, i) => {
    const c = [{ b, ex: i, intron: false }];
    return intron && i === SPLIT - 1 ? [...c, ...INTRON.split("").map((x) => ({ b: x, ex: -1, intron: true }))] : c;
  });
  const preMrna = cells.map((c) => (c.b === "T" ? "U" : c.b)).join("");
  const mature = bases.join("").replace(/T/g, "U");
  const rd = read(mature);
  const orig = read(EXON.replace(/T/g, "U"));
  const nRead = rd.codons.length;

  const running = playing && lit < nRead;
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setLit((l) => l + 1), 800);
    return () => window.clearTimeout(id);
  }, [running, lit]);

  const resetFrom = () => { setStage(0); setLit(0); setPlaying(false); };
  const edit = (next: string[]) => { setBases(next); resetFrom(); };
  const mutations = bases.map((b, i) => (b !== EXON[i] ? i : -1)).filter((i) => i >= 0);

  const [demo, setDemo] = useState(0);
  const DEMOS = [[5, "G"], [3, "C"], [7, "A"]] as const; // GAA->GAG silent, GAA->CAA missense, TGG->TAG nonsense
  const mutateDemo = () => {
    const [i, b] = DEMOS[demo % DEMOS.length];
    const n = EXON.split("");
    n[i] = b;
    edit(n);
    setDemo(demo + 1);
  };

  const origMature = EXON.replace(/T/g, "U");
  const verdicts = Array.from({ length: 4 }, (_, k) => k).flatMap((k) => {
    const oc = origMature.slice(3 * k, 3 * k + 3), nc = mature.slice(3 * k, 3 * k + 3);
    if (oc === nc) return [];
    return [`${oc}→${nc} (codon ${k + 1}): ${classify(translateCodon(oc), translateCodon(nc), k === 0, nc)}`];
  });
  const kinds = verdicts.map((v) => v.split(": ")[1]);
  const peptide = rd.aas.slice(0, lit).filter((a) => a !== "*");
  const stopHit = lit > 0 && rd.aas[lit - 1] === "*";

  const status = stage === 0
    ? "DNA only. Transcribe to make RNA."
    : stage === 1
      ? "Pre-mRNA made. It contains the intron: splice it out."
      : lit === 0 ? "Mature mRNA ready. Translate to read it codon by codon."
        : `Ribosome has read ${lit} of ${nRead} codons: ${peptide.map((a) => THREE_LETTER[a]).join("–") || "(none yet)"}${stopHit ? ", then STOP: protein released." : "."}`;

  const btn = (label: string, onClick: () => void, disabled = false, pressed?: boolean) => (
    <button className="btn sm" onClick={onClick} disabled={disabled} aria-pressed={pressed} style={disabled ? { opacity: 0.45, cursor: "not-allowed" } : pressed ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}>{label}</button>
  );

  const mrnaStart = rd.start < 0 ? mature.length : rd.start;
  const afterCodons = mrnaStart + nRead * 3;
  const aaBox = (idx: number): ReactElement => {
    const a = rd.aas[idx];
    const shown = idx < lit;
    return (
      <div key={idx} style={{ width: CELL * 3 - 4, margin: "0 2px", textAlign: "center", fontSize: "0.78rem", padding: "3px 0", borderRadius: 8, border: `1px ${shown ? "solid" : "dashed"} ${shown ? (a === "*" ? "var(--red)" : "var(--good)") : "var(--line)"}`, color: shown ? "var(--ink)" : "var(--ink-dim)", background: shown ? "rgba(255,255,255,0.06)" : "transparent" }}>
        {shown ? (a === "*" ? "STOP" : `${THREE_LETTER[a]} (${a})`) : "·"}
      </div>
    );
  };

  return (
    <VizFrame
      title="DNA → RNA → protein"
      caption="Run the gene through the central dogma. The mRNA copies the coding strand (with U for T) because it is built by reading the template strand."
      simplified="A real gene has a promoter, 5′/3′ untranslated regions, a 5′ cap and poly-A tail, and much longer exons and introns (human introns average thousands of nt). Splicing is done by the spliceosome with extra signals (branch point), and bacteria have no spliceosomal introns. Translation here skips initiation, tRNAs and elongation factors."
      controls={
        <>
          {btn("1 Transcribe", () => { setStage(intron ? 1 : 2); setLit(0); setPlaying(false); }, stage !== 0)}
          {btn("2 Splice out intron", () => setStage(2), !(intron && stage === 1))}
          {btn(reduced ? "3 Read next codon" : lit > 0 && lit < nRead && !running ? "3 Resume translate" : "3 Translate", () => {
            if (reduced) setLit((l) => Math.min(l + 1, nRead));
            else { if (lit >= nRead) setLit(0); setPlaying(true); }
          }, stage < 2 || nRead === 0 || (reduced && lit >= nRead) || running)}
          {btn("Reset", resetFrom)}
          <label>
            <input type="checkbox" checked={intron} onChange={(e) => { setIntron(e.target.checked); resetFrom(); }} />
            Add an intron (eukaryote)
          </label>
          {btn("Mutate a base (demo: silent, missense, nonsense)", mutateDemo)}
          {btn("Restore gene", () => edit(EXON.split("")), mutations.length === 0)}
        </>
      }
    >
      <div role="group" aria-label="Gene, transcript and protein" style={{ overflowX: "auto", background: "#121012", borderRadius: 10, padding: "8px 10px", border: "1px solid var(--line)" }}>
        <Row label="Coding strand 5′→3′ (click a base to mutate it)">
          {cells.map((c, i) => c.intron ? (
            <span key={i} style={cellStyle("var(--info)", { opacity: 0.8, background: "rgba(94,184,255,0.12)" })}>{c.b}</span>
          ) : (
            <button key={i} onClick={() => { const n = [...bases]; n[c.ex] = NEXT[c.b]; edit(n); }} aria-label={`Coding strand base ${c.ex + 1}: ${c.b}${bases[c.ex] !== EXON[c.ex] ? ` (mutated from ${EXON[c.ex]})` : ""}. Activate to change.`}
              style={cellStyle(bases[c.ex] !== EXON[c.ex] ? "var(--gold)" : "var(--pink)", { background: bases[c.ex] !== EXON[c.ex] ? "var(--gold-soft)" : "transparent", border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer", padding: 0 })}>{c.b}</button>
          ))}
        </Row>
        <Row label="Template strand 3′→5′">
          {cells.map((c, i) => <span key={i} style={cellStyle("var(--ink-dim)", c.intron ? { background: "rgba(94,184,255,0.08)" } : undefined)}>{COMP[c.b]}</span>)}
        </Row>
        {intron && <Row label="">{cells.map((c, i) => <span key={i} style={cellStyle("var(--info)", { fontSize: "0.65rem", height: 14 })}>{c.intron && c.ex === -1 && i === SPLIT ? "intron" : ""}</span>)}</Row>}
        {stage >= 1 && intron && (
          <Row label="pre-mRNA 5′→3′ (RNA polymerase)">
            {cells.map((c, i) => <span key={i} style={cellStyle("var(--gold)", c.intron ? { textDecoration: stage >= 2 ? "line-through" : "none", opacity: stage >= 2 ? 0.4 : 1, background: "rgba(94,184,255,0.12)" } : undefined)}>{preMrna[i]}</span>)}
          </Row>
        )}
        {stage >= 2 && (
          <>
            <Row label={intron ? "mature mRNA 5′→3′ (spliced)" : "mRNA 5′→3′ (RNA polymerase)"}>
              {mature.slice(0, mrnaStart).split("").map((b, i) => <span key={`p${i}`} style={cellStyle("var(--ink-dim)", { opacity: 0.6 })}>{b}</span>)}
              {rd.codons.map((c, k) => (
                <span key={k} style={{ display: "inline-flex", margin: "0 2px", borderRadius: 6, border: `1px solid ${k < lit ? "var(--gold)" : "var(--line)"}`, background: k === lit - 1 ? "var(--gold-soft)" : "transparent", boxShadow: k === lit - 1 ? "0 0 12px -2px var(--gold)" : "none", width: CELL * 3 - 4, justifyContent: "center" }}>
                  {c.split("").map((b, j) => <span key={j} style={cellStyle("var(--gold)", { width: CELL - 1 })}>{b}</span>)}
                </span>
              ))}
              {mature.slice(afterCodons).split("").map((b, i) => <span key={`t${i}`} style={cellStyle("var(--ink-dim)", { opacity: 0.6 })}>{b}</span>)}
            </Row>
            <Row label="Protein (ribosome reads codons)">
              {mrnaStart > 0 && <div style={{ width: mrnaStart * CELL }} />}
              {rd.codons.map((_, k) => aaBox(k))}
              {rd.start < 0 && <span className="dim" style={{ fontSize: "0.85rem" }}>No AUG start codon: nothing to translate.</span>}
            </Row>
          </>
        )}
      </div>

      <p aria-live="polite" style={{ margin: "10px 0 4px" }}><b>{status}</b></p>
      {mutations.length > 0 && (
        <p aria-live="polite" style={{ margin: "4px 0", padding: "8px 12px", border: "1px solid var(--gold)", borderRadius: 10, background: "var(--gold-soft)" }}>
          <b>{mutations.length} base{mutations.length > 1 ? "s" : ""} mutated.</b>{" "}
          {verdicts.length === 0 ? "No codon changed (mutation falls outside the codons shown)." : verdicts.join("; ") + "."}{" "}
          {Array.from(new Set(kinds)).map((k) => EFFECT[k]).join(" ")}{" "}
          {orig.aas.join("") !== rd.aas.join("") ? `Protein: ${rd.aas.filter((a) => a !== "*").map((a) => THREE_LETTER[a]).join("–") || "none"} (was ${orig.aas.filter((a) => a !== "*").map((a) => THREE_LETTER[a]).join("–")}).` : "Protein sequence is unchanged."}
        </p>
      )}
      <p className="dim" style={{ fontSize: "0.85rem", margin: "6px 0 0" }}>
        Mutating a base resets the run. Try the third base of codon 2 (GAA→GAG: silent), the first base of codon 2 (GAA→CAA: missense), or the second base of codon 3 (TGG→TAG: nonsense).
      </p>
    </VizFrame>
  );
}
