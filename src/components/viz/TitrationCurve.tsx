import { useMemo, useState } from "react";
import { VizFrame } from "./VizFrame";
import {
  AMINO_ACIDS,
  dominantCharge,
  dominantStateIndex,
  equivalentsOH,
  fractionDeprotonated,
  isoelectricPoint,
  netCharge,
} from "./TitrationCurve.logic";

const W = 520;
const H = 340;
const M = { l: 48, r: 16, t: 14, b: 44 };
const PW = W - M.l - M.r;
const PH = H - M.t - M.b;
const PH_MAX = 14;

const sign = (q: number) => (q > 0 ? `+${q}` : q < 0 ? `−${Math.abs(q)}` : "0");
const chargeName = (q: number) =>
  q === 0 ? "zwitterion (net neutral)" : q > 0 ? `cation (net ${sign(q)})` : `anion (net ${sign(q)})`;

export default function TitrationCurve() {
  const [idx, setIdx] = useState(0);
  const [pH, setPH] = useState(7);
  const aa = AMINO_ACIDS[idx];
  const n = aa.groups.length;
  const pI = isoelectricPoint(aa);

  const xs = (eq: number) => M.l + (eq / n) * PW;
  const ys = (p: number) => M.t + PH - (p / PH_MAX) * PH;

  const curve = useMemo(
    () =>
      Array.from({ length: 281 }, (_, i) => {
        const p = i * 0.05;
        return `${(M.l + (equivalentsOH(aa, p) / n) * PW).toFixed(1)},${(M.t + PH - (p / PH_MAX) * PH).toFixed(1)}`;
      }).join(" "),
    [aa, n],
  );

  const state = dominantStateIndex(aa, pH);
  const q = dominantCharge(aa, pH);
  const qExact = netCharge(aa, pH);
  const eq = equivalentsOH(aa, pH);
  const nearPI = Math.abs(pH - pI) < 0.25;

  return (
    <VizFrame
      title="Titration of an amino acid (Henderson–Hasselbalch)"
      caption="Drag the pH slider along the curve: each plateau is a buffer region centred on a pKa, and the net charge flips sign at the pI."
      simplified="Treats every ionisable group as independent, ignoring electrostatic coupling between neighbouring charges and temperature/ionic-strength effects, so real pKa values shift by a few tenths in peptides and proteins. pKa values are standard textbook values (Lehninger/Berg)."
      controls={
        <>
          <label>
            Amino acid
            <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}
              style={{ background: "var(--glass)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 10px" }}>
              {AMINO_ACIDS.map((a, i) => <option key={a.name} value={i} style={{ color: "#000" }}>{a.name}</option>)}
            </select>
          </label>
          <label>
            pH
            <input type="range" min={0} max={14} step={0.05} value={pH} onChange={(e) => setPH(Number(e.target.value))} aria-valuetext={`pH ${pH.toFixed(2)}`} />
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", minWidth: 44 }}>{pH.toFixed(2)}</span>
          </label>
          <button type="button" className="btn sm" onClick={() => setPH(Number(pI.toFixed(2)))}>Jump to pI</button>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ width: "100%", height: "auto", display: "block" }}
        aria-label={`Titration curve of ${aa.name}: pH against equivalents of hydroxide added, with buffer regions at pKa ${aa.groups.map((x) => x.pKa).join(", ")} and pI ${pI.toFixed(2)}. At pH ${pH.toFixed(2)} the net charge is ${qExact.toFixed(2)}.`}>
        {/* buffer regions: pKa ± 1 */}
        {aa.groups.map((grp, i) => (
          <g key={grp.label}>
            <rect x={M.l} y={ys(Math.min(grp.pKa + 1, PH_MAX))} width={PW} height={ys(Math.max(grp.pKa - 1, 0)) - ys(Math.min(grp.pKa + 1, PH_MAX))}
              fill="var(--info)" opacity={0.1} />
            <line x1={M.l} x2={M.l + PW} y1={ys(grp.pKa)} y2={ys(grp.pKa)} stroke="var(--info)" strokeDasharray="4 4" />
            <text x={M.l + PW - 4} y={ys(grp.pKa) - 4} textAnchor="end" fontSize="11.5" fill="var(--info)" fontFamily="var(--font-mono)">
              pKa{n > 1 ? i + 1 : ""} {grp.pKa.toFixed(2)}
            </text>
          </g>
        ))}
        {Array.from({ length: n + 1 }, (_, i) => (
          <g key={`x${i}`}>
            <line x1={xs(i)} x2={xs(i)} y1={M.t} y2={M.t + PH} stroke="var(--line)" />
            <text x={xs(i)} y={M.t + PH + 16} textAnchor="middle" fontSize="11" fill="var(--ink-dim)">{i}</text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((t) => (
          <text key={t} x={M.l - 6} y={ys(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-dim)">{t}</text>
        ))}
        <line x1={M.l} x2={M.l} y1={M.t} y2={M.t + PH} stroke="var(--ink-dim)" />
        <line x1={M.l} x2={M.l + PW} y1={M.t + PH} y2={M.t + PH} stroke="var(--ink-dim)" />
        <text x={M.l + PW / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="var(--ink-dim)">Equivalents of OH⁻ added</text>
        <text transform={`translate(13 ${M.t + PH / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="var(--ink-dim)">pH</text>
        <polyline points={curve} fill="none" stroke="var(--pink)" strokeWidth={3} />
        {/* pI marker */}
        <line x1={M.l} x2={xs(equivalentsOH(aa, pI))} y1={ys(pI)} y2={ys(pI)} stroke="var(--gold)" strokeDasharray="2 3" />
        <rect x={xs(equivalentsOH(aa, pI)) - 5} y={ys(pI) - 5} width={10} height={10} fill="var(--gold)" transform={`rotate(45 ${xs(equivalentsOH(aa, pI))} ${ys(pI)})`} />
        <text x={xs(equivalentsOH(aa, pI)) + 10} y={ys(pI) + 16} fontSize="12" fill="var(--gold)" fontFamily="var(--font-mono)">pI = {pI.toFixed(2)}</text>
        {/* current pH */}
        <line x1={M.l} x2={xs(eq)} y1={ys(pH)} y2={ys(pH)} stroke="var(--ink)" strokeWidth={1} />
        <circle cx={xs(eq)} cy={ys(pH)} r={7} fill="var(--bg)" stroke="var(--ink)" strokeWidth={2.5} />
      </svg>

      <div aria-live="polite" style={{ marginTop: 8, display: "grid", gap: 8 }}>
        <div>
          <span className="chip gold">pH {pH.toFixed(2)}</span>{" "}
          <b style={{ color: "var(--ink)" }}>Dominant species: {chargeName(q)}</b>
          <span className="dim"> · exact average net charge {sign(Number(qExact.toFixed(2)))}</span>
          {nearPI && <span className="chip pink" style={{ marginLeft: 8 }}>near pI: no net charge, no migration in an electric field</span>}
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4, fontSize: "0.9rem" }}>
          {aa.groups.map((grp, i) => {
            const deprot = fractionDeprotonated(grp.pKa, pH);
            const dep = i < state;
            return (
              <li key={grp.label} className="dim">
                <span style={{ color: "var(--ink)" }}>{grp.label}</span>:{" "}
                <b style={{ color: dep ? "var(--info)" : "var(--ink)" }}>
                  {dep ? "mostly deprotonated" : "mostly protonated"}
                </b>{" "}
                ({Math.round(deprot * 100)}% deprotonated; pKa {grp.pKa.toFixed(2)}; pH {pH < grp.pKa ? "<" : ">"} pKa)
              </li>
            );
          })}
        </ul>
        <div className="dim" style={{ fontSize: "0.9rem" }}>
          pI = average of the two pKa values either side of the neutral species ={" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)" }}>
            ({aa.groups[dominantChargeIndex(aa)].pKa.toFixed(2)} + {aa.groups[dominantChargeIndex(aa) + 1].pKa.toFixed(2)}) / 2 = {pI.toFixed(2)}
          </span>
          . Shaded bands mark each buffer region (pKa ± 1).
        </div>
      </div>
    </VizFrame>
  );
}

/** Index of the lower flanking pKa of the neutral species (number of basic groups − 1). */
function dominantChargeIndex(aa: (typeof AMINO_ACIDS)[number]): number {
  return aa.groups.filter((x) => x.kind === "base").length - 1;
}
