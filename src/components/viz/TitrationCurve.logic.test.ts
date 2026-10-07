import { describe, expect, it } from "vitest";
import {
  AMINO_ACIDS,
  dominantCharge,
  equivalentsOH,
  fractionDeprotonated,
  isoelectricPoint,
  netCharge,
} from "./TitrationCurve.logic";

const aa = (name: string) => AMINO_ACIDS.find((a) => a.name === name)!;

describe("Titration logic", () => {
  it("pI values match textbook", () => {
    expect(isoelectricPoint(aa("Glycine"))).toBeCloseTo(5.97, 2);
    expect(isoelectricPoint(aa("Alanine"))).toBeCloseTo(6.015, 2);
    expect(isoelectricPoint(aa("Glutamate"))).toBeCloseTo(3.22, 2);
    expect(isoelectricPoint(aa("Lysine"))).toBeCloseTo(9.74, 2);
    expect(isoelectricPoint(aa("Histidine"))).toBeCloseTo(7.585, 2);
  });

  it("group is 50% deprotonated at pH = pKa", () => {
    expect(fractionDeprotonated(4.25, 4.25)).toBeCloseTo(0.5);
  });

  it("net charge of glycine is ~0 at pI, +1 at low pH, -1 at high pH", () => {
    const gly = aa("Glycine");
    expect(Math.abs(netCharge(gly, 5.97))).toBeLessThan(0.001);
    expect(netCharge(gly, 0)).toBeCloseTo(1, 2);
    expect(netCharge(gly, 14)).toBeCloseTo(-1, 2);
  });

  it("net charge is ~0 at the pI for every amino acid", () => {
    for (const a of AMINO_ACIDS) expect(Math.abs(netCharge(a, isoelectricPoint(a)))).toBeLessThan(0.01);
  });

  it("net charge spans +2 to -1 for Lys and His, +1 to -2 for Glu", () => {
    expect(netCharge(aa("Lysine"), 0)).toBeCloseTo(2, 1);
    expect(netCharge(aa("Lysine"), 14)).toBeCloseTo(-1, 1);
    expect(netCharge(aa("Histidine"), 0)).toBeCloseTo(2, 1);
    expect(netCharge(aa("Glutamate"), 0)).toBeCloseTo(1, 1);
    expect(netCharge(aa("Glutamate"), 14)).toBeCloseTo(-2, 1);
  });

  it("equivalents of OH- is 0.5 at pK1 region midpoint and 1.5 at pK2 for glycine", () => {
    const gly = aa("Glycine");
    expect(equivalentsOH(gly, 2.34)).toBeCloseTo(0.5, 1);
    expect(equivalentsOH(gly, 9.6)).toBeCloseTo(1.5, 1);
    expect(equivalentsOH(gly, 5.97)).toBeCloseTo(1.0, 1);
  });

  it("dominant integer charge", () => {
    expect(dominantCharge(aa("Histidine"), 7.4)).toBe(0);
    expect(dominantCharge(aa("Histidine"), 1)).toBe(2);
    expect(dominantCharge(aa("Glutamate"), 7)).toBe(-1);
    expect(dominantCharge(aa("Lysine"), 7)).toBe(1);
  });
});
