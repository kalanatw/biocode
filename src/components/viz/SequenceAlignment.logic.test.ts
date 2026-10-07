import { describe, expect, it } from "vitest";
import { cleanSequence, needlemanWunsch } from "./SequenceAlignment.logic";

const s = { match: 1, mismatch: -1, gap: -1 };

describe("Needleman–Wunsch", () => {
  it("GATTACA vs GCATGCU with 1/-1/-1 scores 0", () => {
    const r = needlemanWunsch("GATTACA", "GCATGCU", s);
    expect(r.score).toBe(0);
    expect(r.H[7][7]).toBe(0);
  });

  it("first row/column are multiples of the gap penalty", () => {
    const r = needlemanWunsch("GATTACA", "GCATGCU", s);
    expect(r.H[3][0]).toBe(-3);
    expect(r.H[0][5]).toBe(-5);
  });

  it("identical sequences align with no gaps, score = length * match", () => {
    const r = needlemanWunsch("ACGT", "ACGT", s);
    expect(r.score).toBe(4);
    expect(r.top).toBe("ACGT");
    expect(r.bottom).toBe("ACGT");
    expect(r.mid).toBe("||||");
  });

  it("inserts a gap for a deletion", () => {
    const r = needlemanWunsch("ACGT", "AGT", s);
    expect(r.score).toBe(2);
    expect(r.top).toBe("ACGT");
    expect(r.bottom).toBe("A-GT");
  });

  it("alignment rows have equal length, reproduce inputs, and re-score to the DP score", () => {
    const a = "GATTACA";
    const b = "GCATGCU";
    const r = needlemanWunsch(a, b, s);
    expect(r.top.length).toBe(r.bottom.length);
    expect(r.top.replace(/-/g, "")).toBe(a);
    expect(r.bottom.replace(/-/g, "")).toBe(b);
    let total = 0;
    for (let k = 0; k < r.top.length; k++) {
      if (r.top[k] === "-" || r.bottom[k] === "-") total += s.gap;
      else total += r.top[k] === r.bottom[k] ? s.match : s.mismatch;
    }
    expect(total).toBe(r.score);
  });

  it("path runs from (m,n) to (0,0)", () => {
    const r = needlemanWunsch("AC", "AG", s);
    expect(r.path[0]).toEqual([2, 2]);
    expect(r.path[r.path.length - 1]).toEqual([0, 0]);
  });

  it("handles an empty sequence", () => {
    const r = needlemanWunsch("", "ACG", s);
    expect(r.score).toBe(-3);
    expect(r.top).toBe("---");
  });

  it("cleanSequence uppercases, strips junk and caps length", () => {
    expect(cleanSequence("ga t-t1aca")).toBe("GATTACA");
    expect(cleanSequence("A".repeat(20))).toHaveLength(12);
  });
});
