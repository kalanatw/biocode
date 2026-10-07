import { describe, expect, it } from "vitest";
import { apparent, lineweaverBurk, velocity } from "./MichaelisMenten.logic";

const base = { vmax: 100, km: 10 };

describe("Michaelis–Menten logic", () => {
  it("v = Vmax/2 at [S] = Km, and approaches Vmax at high [S]", () => {
    expect(velocity(10, base)).toBeCloseTo(50);
    expect(velocity(0, base)).toBe(0);
    expect(velocity(1e6, base)).toBeCloseTo(100, 2);
  });

  it("no inhibitor leaves parameters unchanged (even if [I] > 0)", () => {
    expect(apparent("none", base, 50, 5)).toEqual(base);
  });

  it("competitive: Km_app = Km(1+[I]/Ki), Vmax unchanged", () => {
    expect(apparent("competitive", base, 20, 10)).toEqual({ vmax: 100, km: 30 });
  });

  it("uncompetitive: both divided by (1+[I]/Ki)", () => {
    const a = apparent("uncompetitive", base, 20, 10);
    expect(a.vmax).toBeCloseTo(100 / 3);
    expect(a.km).toBeCloseTo(10 / 3);
  });

  it("noncompetitive: Vmax_app = Vmax/(1+[I]/Ki), Km unchanged", () => {
    const a = apparent("noncompetitive", base, 10, 10);
    expect(a).toEqual({ vmax: 50, km: 10 });
  });

  it("uncompetitive keeps Km/Vmax constant (parallel Lineweaver–Burk lines)", () => {
    const u = apparent("uncompetitive", base, 30, 10);
    expect(lineweaverBurk(u).slope).toBeCloseTo(lineweaverBurk(base).slope);
  });

  it("Lineweaver–Burk intercepts: y = 1/Vmax, x = -1/Km, slope = Km/Vmax", () => {
    const lb = lineweaverBurk(base);
    expect(lb.yIntercept).toBeCloseTo(0.01);
    expect(lb.xIntercept).toBeCloseTo(-0.1);
    expect(lb.slope).toBeCloseTo(0.1);
  });

  it("competitive lines share the y-intercept; noncompetitive lines share the x-intercept", () => {
    const c = lineweaverBurk(apparent("competitive", base, 20, 10));
    expect(c.yIntercept).toBeCloseTo(lineweaverBurk(base).yIntercept);
    const n = lineweaverBurk(apparent("noncompetitive", base, 20, 10));
    expect(n.xIntercept).toBeCloseTo(lineweaverBurk(base).xIntercept);
  });
});
