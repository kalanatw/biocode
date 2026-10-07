export type InhibitorType = "none" | "competitive" | "uncompetitive" | "noncompetitive";

export interface Kinetics {
  vmax: number;
  km: number;
}

/** alpha = 1 + [I]/Ki */
export function alpha(inhibitor: number, ki: number): number {
  return 1 + inhibitor / ki;
}

/**
 * Apparent Vmax and Km in the presence of an inhibitor (single inhibitor constant Ki):
 *  - competitive:    Vmax unchanged, Km_app = Km * alpha
 *  - uncompetitive:  Vmax_app = Vmax / alpha, Km_app = Km / alpha
 *  - noncompetitive: Vmax_app = Vmax / alpha, Km unchanged (pure case: inhibitor binds E and ES equally well)
 */
export function apparent(type: InhibitorType, p: Kinetics, inhibitor: number, ki: number): Kinetics {
  const a = type === "none" ? 1 : alpha(inhibitor, ki);
  switch (type) {
    case "competitive":
      return { vmax: p.vmax, km: p.km * a };
    case "uncompetitive":
      return { vmax: p.vmax / a, km: p.km / a };
    case "noncompetitive":
      return { vmax: p.vmax / a, km: p.km };
    default:
      return { ...p };
  }
}

/** Michaelis–Menten rate: v = Vmax [S] / (Km + [S]) */
export function velocity(s: number, k: Kinetics): number {
  return (k.vmax * s) / (k.km + s);
}

/** Lineweaver–Burk line 1/v = slope * (1/[S]) + intercept, plus its axis intercepts. */
export function lineweaverBurk(k: Kinetics) {
  return {
    slope: k.km / k.vmax,
    yIntercept: 1 / k.vmax,
    xIntercept: -1 / k.km,
  };
}
