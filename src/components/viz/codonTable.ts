/** Standard genetic code (NCBI translation table 1). Shared by CentralDogma and GeneticCode. */

export const RNA_BASES = ["U", "C", "A", "G"] as const;

// Index = 16*i1 + 4*i2 + i3 with bases ordered U,C,A,G. "*" = stop.
const AA_STRING = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";

export const THREE_LETTER: Record<string, string> = {
  A: "Ala", R: "Arg", N: "Asn", D: "Asp", C: "Cys", Q: "Gln", E: "Glu", G: "Gly", H: "His", I: "Ile",
  L: "Leu", K: "Lys", M: "Met", F: "Phe", P: "Pro", S: "Ser", T: "Thr", W: "Trp", Y: "Tyr", V: "Val",
  "*": "Stop",
};

export const FULL_NAME: Record<string, string> = {
  A: "alanine", R: "arginine", N: "asparagine", D: "aspartate", C: "cysteine", Q: "glutamine", E: "glutamate",
  G: "glycine", H: "histidine", I: "isoleucine", L: "leucine", K: "lysine", M: "methionine", F: "phenylalanine",
  P: "proline", S: "serine", T: "threonine", W: "tryptophan", Y: "tyrosine", V: "valine", "*": "stop signal",
};

export function codonIndex(codon: string): number {
  const [a, b, c] = codon.split("").map((x) => RNA_BASES.indexOf(x as (typeof RNA_BASES)[number]));
  return 16 * a + 4 * b + c;
}

/** One-letter amino acid for an RNA codon ("*" = stop). Returns "?" for malformed input. */
export function translateCodon(codon: string): string {
  if (!/^[ACGU]{3}$/.test(codon)) return "?";
  return AA_STRING[codonIndex(codon)];
}

export function codonAt(index: number): string {
  return RNA_BASES[Math.floor(index / 16)] + RNA_BASES[Math.floor((index % 16) / 4)] + RNA_BASES[index % 4];
}

export function aaAt(index: number): string {
  return AA_STRING[index];
}

export const STOP_NAMES: Record<string, string> = { UAA: "ochre", UAG: "amber", UGA: "opal" };
