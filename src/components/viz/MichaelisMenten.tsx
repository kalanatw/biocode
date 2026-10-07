import { useState } from "react";
import { VizFrame } from "./VizFrame";
import { apparent, lineweaverBurk, velocity } from "./MichaelisMenten.logic";
import type { InhibitorType } from "./MichaelisMenten.logic";

const W = 520;
const H = 320;
const M = { l: 56, r: 16, t: 14, b: 44 };
const PW = W - M.l - M.r;
const PH = H - M.t - M.b;
const S_MAX = 200;
const V_MAX_AXIS = 110;

const TYPES: { id: InhibitorType; label: string; note: string }[] = [
  { id: "none", label: "None", note: "No inhibitor." },
  { id: "competitive", label: "Competitive", note: "Inhibitor competes with substrate for the active site: Km rises, Vmax unchanged (lines meet on the y-axis)." },
  { id: "uncompetitive", label: "Uncompetitive", note: "Inhibitor binds only the enzyme–substrate complex: Vmax and Km both fall (parallel lines)." },
  { id: "noncompetitive", label: "Non-competitive", note: "Inhibitor binds E and ES equally well: Vmax falls, Km unchanged (lines meet on the x-axis)." },
];

const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "–");

function Slider(props: { label: string; unit?: string; min: number; max: number; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label style={{ opacity: props.disabled ? 0.5 : 1 }}>
      {props.label}
      <input type="range" min={props.min} max={props.max} step={1} value={props.value} disabled={props.disabled}
        onChange={(e) => props.onChange(Number(e.target.value))} />
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", minWidth: 56 }}>{props.value}{props.unit ?? ""}</span>
    </label>
  );
}

export default function MichaelisMenten() {
  const [vmax, setVmax] = useState(100);
  const [km, setKm] = useState(20);
  const [inh, setInh] = useState(40);
  const [ki, setKi] = useState(20);
  const [type, setType] = useState<InhibitorType>("competitive");
  const [view, setView] = useState<"hyperbola" | "lb">("hyperbola");

  const base = { vmax, km };
  const app = apparent(type, base, inh, ki);
  const inhibited = type !== "none" && inh > 0;
  const lb0 = lineweaverBurk(base);
  const lb1 = lineweaverBurk(app);

  // ---- scales ----
  let xs: (x: number) => number;
  let ys: (y: number) => number;
  let curves: { pts: string; dashed: boolean }[] = [];
  let xTicks: number[] = [];
  let yTicks: number[] = [];
  let xLabel = "";
  let yLabel = "";
  const markers: { x: number; y: number; text: string; dx?: number; dy?: number }[] = [];
  let vmaxLabel: { y: number; text: string } | null = null;
  const guides: { x1: number; y1: number; x2: number; y2: number }[] = [];

  if (view === "hyperbola") {
    xs = (x) => M.l + (x / S_MAX) * PW;
    ys = (y) => M.t + PH - (y / V_MAX_AXIS) * PH;
    const mk = (k: { vmax: number; km: number }) =>
      Array.from({ length: 101 }, (_, i) => {
        const s = (i / 100) * S_MAX;
        return `${xs(s).toFixed(1)},${ys(velocity(s, k)).toFixed(1)}`;
      }).join(" ");
    curves = [{ pts: mk(base), dashed: true }, ...(inhibited ? [{ pts: mk(app), dashed: false }] : [])];
    xTicks = [0, 50, 100, 150, 200];
    yTicks = [0, 25, 50, 75, 100];
    xLabel = "Substrate concentration [S] (µM)";
    yLabel = "Rate v (µmol/min)";
    const cur = inhibited ? app : base;
    guides.push({ x1: xs(0), y1: ys(cur.vmax / 2), x2: xs(cur.km), y2: ys(cur.vmax / 2) });
    guides.push({ x1: xs(cur.km), y1: ys(cur.vmax / 2), x2: xs(cur.km), y2: ys(0) });
    markers.push({ x: xs(cur.km), y: ys(cur.vmax / 2), text: `Km${inhibited ? "(app)" : ""} = ${f(cur.km)}`, dx: 8, dy: 18 });
    markers.push({ x: xs(0), y: ys(cur.vmax / 2), text: `Vmax/2 = ${f(cur.vmax / 2)}`, dx: 6, dy: -6 });
    guides.push({ x1: xs(0), y1: ys(cur.vmax), x2: xs(S_MAX), y2: ys(cur.vmax) });
    vmaxLabel = { y: ys(cur.vmax), text: `Vmax${inhibited ? "(app)" : ""} = ${f(cur.vmax)}` };
  } else {
    const xmaxV = 1 / 2; // [S] = 2 µM
    const xminV = -1.35 * Math.max(1 / km, 1 / app.km);
    const yAt = (l: { slope: number; yIntercept: number }, x: number) => l.slope * x + l.yIntercept;
    const ysAll = [yAt(lb0, xminV), yAt(lb0, xmaxV), yAt(lb1, xminV), yAt(lb1, xmaxV), 0];
    const ymin = Math.min(...ysAll) * 1.1;
    const ymax = Math.max(...ysAll) * 1.05;
    xs = (x) => M.l + ((x - xminV) / (xmaxV - xminV)) * PW;
    ys = (y) => M.t + PH - ((y - ymin) / (ymax - ymin)) * PH;
    const line = (l: { slope: number; yIntercept: number }) =>
      `${xs(xminV).toFixed(1)},${ys(yAt(l, xminV)).toFixed(1)} ${xs(xmaxV).toFixed(1)},${ys(yAt(l, xmaxV)).toFixed(1)}`;
    curves = [{ pts: line(lb0), dashed: true }, ...(inhibited ? [{ pts: line(lb1), dashed: false }] : [])];
    const nice = (lo: number, hi: number, n = 5) => {
      const raw = (hi - lo) / n;
      const p = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = [1, 2, 5, 10].map((m) => m * p).find((c) => c >= raw) ?? raw;
      const out: number[] = [];
      for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v / step) * step);
      return out;
    };
    xTicks = nice(xminV, xmaxV);
    yTicks = nice(ymin, ymax);
    xLabel = "1/[S] (1/µM)";
    yLabel = "1/v (min/µmol)";
    const cur = inhibited ? lb1 : lb0;
    markers.push({ x: xs(cur.xIntercept), y: ys(0), text: `−1/Km${inhibited ? "(app)" : ""} = ${(cur.xIntercept).toFixed(3)}`, dx: 4, dy: -8 });
    markers.push({ x: xs(0), y: ys(cur.yIntercept), text: `1/Vmax${inhibited ? "(app)" : ""} = ${cur.yIntercept.toFixed(3)}`, dx: 8, dy: -8 });
  }

  const eq = view === "hyperbola"
    ? `v = ${f(app.vmax)} · [S] / (${f(app.km)} + [S])`
    : `1/v = ${lb1.slope.toFixed(3)} · (1/[S]) + ${lb1.yIntercept.toFixed(3)}`;
  const vAtKm = velocity(app.km, app);
  const aria =
    view === "hyperbola"
      ? `Plot of rate against substrate concentration. ${inhibited ? `With ${type} inhibitor: ` : ""}Vmax ${f(app.vmax)}, Km ${f(app.km)}; at [S] equal to Km the rate is ${f(vAtKm)}, half of Vmax.`
      : `Lineweaver–Burk plot of 1/v against 1/[S]. ${inhibited ? `With ${type} inhibitor: ` : ""}slope ${lb1.slope.toFixed(3)}, y-intercept ${lb1.yIntercept.toFixed(3)}, x-intercept ${lb1.xIntercept.toFixed(3)}.`;

  const clipId = "mm-clip";
  return (
    <VizFrame
      title="Michaelis–Menten kinetics and enzyme inhibition"
      caption="Change the inhibitor type and watch Km and Vmax move; switch to the double-reciprocal plot to see how the three types differ."
      simplified="Assumes steady-state kinetics, one substrate, one inhibitor binding site and 'pure' non-competitive inhibition (inhibitor binds E and ES with the same Ki); real enzymes are often mixed-type, allosteric or multi-substrate. Units are illustrative."
      controls={
        <>
          <div role="group" aria-label="Plot type" style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn sm" aria-pressed={view === "hyperbola"} onClick={() => setView("hyperbola")}
              style={view === "hyperbola" ? { borderColor: "var(--pink)", color: "var(--pink)" } : undefined}>v vs [S]</button>
            <button type="button" className="btn sm" aria-pressed={view === "lb"} onClick={() => setView("lb")}
              style={view === "lb" ? { borderColor: "var(--pink)", color: "var(--pink)" } : undefined}>Lineweaver–Burk</button>
          </div>
          <div role="group" aria-label="Inhibitor type" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <button key={t.id} type="button" className="btn sm" aria-pressed={type === t.id} onClick={() => setType(t.id)}
                style={type === t.id ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}>{t.label}</button>
            ))}
          </div>
          <Slider label="Vmax" min={20} max={100} value={vmax} onChange={setVmax} />
          <Slider label="Km" unit=" µM" min={2} max={80} value={km} onChange={setKm} />
          <Slider label="[I]" unit=" µM" min={0} max={100} value={inh} onChange={setInh} disabled={type === "none"} />
          <Slider label="Ki" unit=" µM" min={2} max={80} value={ki} onChange={setKi} disabled={type === "none"} />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs><clipPath id={clipId}><rect x={M.l} y={M.t} width={PW} height={PH} /></clipPath></defs>
        {xTicks.map((t) => (
          <g key={`x${t}`}>
            <line x1={xs(t)} x2={xs(t)} y1={M.t} y2={M.t + PH} stroke="var(--line)" />
            <text x={xs(t)} y={M.t + PH + 16} textAnchor="middle" fontSize="11" fill="var(--ink-dim)">{Number(t.toPrecision(3))}</text>
          </g>
        ))}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.l} x2={M.l + PW} y1={ys(t)} y2={ys(t)} stroke="var(--line)" />
            <text x={M.l - 6} y={ys(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-dim)">{Number(t.toPrecision(3))}</text>
          </g>
        ))}
        {view === "lb" && (
          <>
            <line x1={xs(0)} x2={xs(0)} y1={M.t} y2={M.t + PH} stroke="var(--ink-dim)" />
            <line x1={M.l} x2={M.l + PW} y1={ys(0)} y2={ys(0)} stroke="var(--ink-dim)" />
          </>
        )}
        <text x={M.l + PW / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="var(--ink-dim)">{xLabel}</text>
        <text transform={`translate(14 ${M.t + PH / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="var(--ink-dim)">{yLabel}</text>
        <g clipPath={`url(#${clipId})`}>
          {guides.map((g, i) => (
            <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="var(--gold)" strokeDasharray="3 4" opacity={0.8} />
          ))}
          {curves.map((c, i) => (
            <polyline key={i} points={c.pts} fill="none" strokeWidth={c.dashed ? 2 : 3}
              stroke={c.dashed ? "var(--ink-dim)" : "var(--pink)"} strokeDasharray={c.dashed ? "6 4" : undefined} />
          ))}
        </g>
        {vmaxLabel && (
          <text x={M.l + PW - 4} y={vmaxLabel.y + 14} textAnchor="end" fontSize="11.5" fill="var(--gold)" fontFamily="var(--font-mono)">{vmaxLabel.text}</text>
        )}
        {markers.map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r={4.5} fill="var(--gold)" stroke="var(--bg)" strokeWidth={1.5} />
            <text x={Math.min(m.x + (m.dx ?? 0), W - 120)} y={m.y + (m.dy ?? 0)} fontSize="11.5" fill="var(--gold)" fontFamily="var(--font-mono)">{m.text}</text>
          </g>
        ))}
        <g fontSize="11.5" fill="var(--ink)">
          <line x1={M.l + 12} x2={M.l + 40} y1={M.t + 14} y2={M.t + 14} stroke="var(--ink-dim)" strokeWidth={2} strokeDasharray="6 4" />
          <text x={M.l + 46} y={M.t + 18}>no inhibitor</text>
          {inhibited && (
            <>
              <line x1={M.l + 12} x2={M.l + 40} y1={M.t + 32} y2={M.t + 32} stroke="var(--pink)" strokeWidth={3} />
              <text x={M.l + 46} y={M.t + 36}>{type} inhibitor</text>
            </>
          )}
        </g>
      </svg>
      <div aria-live="polite" style={{ display: "grid", gap: 6, marginTop: 8 }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", overflowX: "auto" }}>{eq}</div>
        <div className="dim" style={{ fontSize: "0.9rem" }}>
          Vmax(app) = <b style={{ color: "var(--ink)" }}>{f(app.vmax)}</b>, Km(app) = <b style={{ color: "var(--ink)" }}>{f(app.km)} µM</b>
          {type !== "none" && <>, α = 1 + [I]/Ki = <b style={{ color: "var(--ink)" }}>{f(1 + inh / ki, 2)}</b></>}.{" "}
          {TYPES.find((t) => t.id === type)?.note}
        </div>
      </div>
    </VizFrame>
  );
}
