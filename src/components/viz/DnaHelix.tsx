import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { VizFrame } from "./VizFrame";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useInView } from "../../hooks/useInView";

const SEQ = "ATGCGTACCTGAAGCTTAGGC"; // strand 1, 5'->3' left to right (21 bp = 2 turns at 10.5 bp/turn)
const COMP: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
const BASE_COLOR: Record<string, string> = { A: "#ff4d8d", T: "#ffc300", G: "#4ade80", C: "#5eb8ff" };
const N = SEQ.length;
const BP_PER_TURN = 10.5;
const X0 = 40, DX = 27, CY = 100, R = 82; // 2 nm diameter / 0.34 nm rise = 5.9 rises -> drawn to scale
const S1 = "#ff8fb8", S2 = "#8fd0ff";

interface Pt { x: number; y: number; z: number }

function point(i: number, rot: number, strand: 0 | 1): Pt {
  const th = (i * 2 * Math.PI) / BP_PER_TURN + rot + (strand ? Math.PI : 0);
  return { x: X0 + i * DX, y: CY + R * Math.sin(th), z: Math.cos(th) };
}

export default function DnaHelix(): ReactElement {
  const reduced = useReducedMotion();
  const [wrapRef, inView] = useInView<HTMLDivElement>();
  const [rot, setRot] = useState(0);
  const [speed, setSpeed] = useState(40); // degrees per second
  const [showDir, setShowDir] = useState(false);
  const [sel, setSel] = useState(3);
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    if (reduced || !inView) return;
    let raf = 0, last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setRot((r) => r + (speedRef.current * Math.PI * dt) / 180);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, inView]);

  const items: { z: number; el: ReactElement }[] = [];
  const p1 = Array.from({ length: N }, (_, i) => point(i, rot, 0));
  const p2 = Array.from({ length: N }, (_, i) => point(i, rot, 1));
  const shade = (z: number) => 0.45 + 0.55 * ((z + 1) / 2);

  for (let i = 0; i < N; i++) {
    const a = p1[i], b = p2[i];
    const b1 = SEQ[i], b2 = COMP[b1];
    const mx = a.x, my = (a.y + b.y) / 2;
    const isSel = i === sel;
    items.push({
      z: 0,
      el: (
        <g key={`r${i}`} opacity={isSel ? 1 : 0.8}>
          <line x1={a.x} y1={a.y} x2={mx} y2={my} stroke={BASE_COLOR[b1]} strokeWidth={isSel ? 7 : 5} strokeLinecap="round" />
          <line x1={mx} y1={my} x2={b.x} y2={b.y} stroke={BASE_COLOR[b2]} strokeWidth={isSel ? 7 : 5} strokeLinecap="round" />
        </g>
      ),
    });
    ([[a, b1, S1], [b, b2, S2]] as [Pt, string, string][]).forEach(([p, base, col], s) => {
      const r = 6.5 + 3.5 * ((p.z + 1) / 2);
      items.push({
        z: p.z,
        el: (
          <g key={`n${i}-${s}`} opacity={shade(p.z)}>
            <circle cx={p.x} cy={p.y} r={r} fill="#17121a" stroke={col} strokeWidth={2} />
            <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize={r * 1.05} fill={BASE_COLOR[base]} fontFamily="var(--font-mono)" fontWeight={700}>{base}</text>
          </g>
        ),
      });
    });
    if (i < N - 1) {
      ([[p1, S1, 1], [p2, S2, -1]] as [Pt[], string, number][]).forEach(([P, col, dir], s) => {
        const u = P[i], v = P[i + 1];
        items.push({
          z: (u.z + v.z) / 2 - 0.001,
          el: (
            <g key={`s${i}-${s}`} opacity={shade((u.z + v.z) / 2)}>
              <line x1={u.x} y1={u.y} x2={v.x} y2={v.y} stroke={col} strokeWidth={3.5} strokeLinecap="round" />
              {showDir && (
                <polygon
                  points="-5,-4.5 5,0 -5,4.5"
                  fill={col}
                  stroke="#090909"
                  strokeWidth={0.8}
                  transform={`translate(${(u.x + v.x) / 2} ${(u.y + v.y) / 2}) rotate(${(Math.atan2(v.y - u.y, v.x - u.x) * 180) / Math.PI + (dir < 0 ? 180 : 0)}) scale(1.2)`}
                />
              )}
            </g>
          ),
        });
      });
    }
  }
  items.sort((u, v) => u.z - v.z);

  const bA = SEQ[sel], bB = COMP[bA];
  const isAT = bA === "A" || bA === "T";
  const bonds = isAT ? 2 : 3;
  const pair = `${bA}–${bB}`;
  const readout = `Base pair ${sel + 1} of ${N}: ${pair}. ${isAT ? "A pairs with T" : "G pairs with C"} using ${bonds} hydrogen bonds${isAT ? " (weaker, so AT-rich DNA melts at lower temperature)" : " (stronger)"}.`;

  const step = (d: number) => setSel((s) => (s + d + N) % N);
  const chipBtn = (label: string, onClick: () => void) => <button className="btn sm" onClick={onClick}>{label}</button>;

  return (
    <VizFrame
      title="The double helix, to scale"
      caption="Click a base pair to see how it is held together: A–T by 2 hydrogen bonds, G–C by 3. Notice the two backbones run in opposite directions."
      simplified="Drawn from the side as an idealised B-DNA model: real DNA is bumpy and flexible, 21 bp is a tiny stretch (a human chromosome holds ~10⁸), and the major and minor grooves are not drawn. Backbone circles stand in for the whole sugar–phosphate unit."
      controls={
        <>
          <label>
            Rotation speed
            <input type="range" min={0} max={120} value={speed} onChange={(e) => setSpeed(+e.target.value)} aria-label="Rotation speed in degrees per second" disabled={reduced} />
            <span className="mono">{reduced ? "off" : `${speed}°/s`}</span>
          </label>
          {reduced && chipBtn("Rotate 30°", () => setRot((r) => r + Math.PI / 6))}
          <label>
            <input type="checkbox" checked={showDir} onChange={(e) => setShowDir(e.target.checked)} />
            Show backbone direction (5′→3′)
          </label>
          {chipBtn("◀ Prev pair", () => step(-1))}
          {chipBtn("Next pair ▶", () => step(1))}
        </>
      }
    >
      <div ref={wrapRef}>
        <svg viewBox="0 0 620 205" role="img" aria-label={`Side view of a rotating DNA double helix with ${N} base pairs. ${readout}`}>
          <rect x={0} y={0} width={620} height={205} fill="#0e0b10" rx={10} />
          <rect x={X0 + sel * DX - DX / 2} y={4} width={DX} height={197} fill="rgba(255,195,0,0.10)" stroke="rgba(255,195,0,0.35)" rx={4} />
          {items.map((it) => it.el)}
          <g fontFamily="var(--font-mono)" fontSize={12} fontWeight={700}>
            <text x={p1[0].x - 26} y={p1[0].y + 4} fill={S1}>5′</text>
            <text x={p1[N - 1].x + 16} y={p1[N - 1].y + 4} fill={S1}>3′</text>
            <text x={p2[0].x - 26} y={p2[0].y + 4} fill={S2}>3′</text>
            <text x={p2[N - 1].x + 16} y={p2[N - 1].y + 4} fill={S2}>5′</text>
          </g>
          {Array.from({ length: N }, (_, i) => (
            <rect key={i} x={X0 + i * DX - DX / 2} y={0} width={DX} height={205} fill="transparent" style={{ cursor: "pointer" }} onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} />
          ))}
        </svg>
      </div>

      <div aria-live="polite" style={{ margin: "10px 0 6px", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--glass)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: "1.3rem", color: "var(--gold)" }}>{pair}</span>
          <svg viewBox="0 0 150 34" style={{ width: 150, flex: "none" }} role="img" aria-label={`${bonds} hydrogen bonds between ${bA} and ${bB}`}>
            <text x={6} y={23} fontSize={18} fontFamily="var(--font-mono)" fill={BASE_COLOR[bA]} fontWeight={700}>{bA}</text>
            <text x={126} y={23} fontSize={18} fontFamily="var(--font-mono)" fill={BASE_COLOR[bB]} fontWeight={700}>{bB}</text>
            {Array.from({ length: bonds }, (_, k) => (
              <line key={k} x1={30} x2={118} y1={17 + (k - (bonds - 1) / 2) * 8 - 4} y2={17 + (k - (bonds - 1) / 2) * 8 - 4} stroke="#ffc300" strokeWidth={2} strokeDasharray="4 4" />
            ))}
          </svg>
          <span>{readout}</span>
        </div>
      </div>
      <p className="dim" style={{ fontSize: "0.85rem", margin: "6px 0 0" }}>
        B-DNA: ~10.5 bp per turn · rise 0.34 nm per bp (so one turn ≈ 3.6 nm) · diameter ≈ 2 nm. Strand 1 (pink) runs 5′→3′ left to right; strand 2 (blue) is its antiparallel partner. Letters, not just colours, label each base.
      </p>
    </VizFrame>
  );
}
