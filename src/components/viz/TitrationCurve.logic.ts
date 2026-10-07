export interface IonizableGroup {
  label: string;
  pKa: number;
  /** "acid": neutral when protonated (COOH, side-chain COOH). "base": +1 when protonated (NH3+, imidazolium, ε-NH3+). */
  kind: "acid" | "base";
}

export interface AminoAcid {
  name: string;
  /** Groups sorted by ascending pKa. */
  groups: IonizableGroup[];
}

const COOH: IonizableGroup = { label: "α-carboxyl (–COOH)", pKa: 0, kind: "acid" };
const NH3: IonizableGroup = { label: "α-amino (–NH₃⁺)", pKa: 0, kind: "base" };
const g = (base: IonizableGroup, pKa: number): IonizableGroup => ({ ...base, pKa });

/** Textbook pKa values (Lehninger / Berg). */
export const AMINO_ACIDS: AminoAcid[] = [
  { name: "Glycine", groups: [g(COOH, 2.34), g(NH3, 9.6)] },
  { name: "Alanine", groups: [g(COOH, 2.34), g(NH3, 9.69)] },
  {
    name: "Glutamate",
    groups: [g(COOH, 2.19), { label: "side-chain carboxyl (–COOH)", pKa: 4.25, kind: "acid" }, g(NH3, 9.67)],
  },
  {
    name: "Lysine",
    groups: [g(COOH, 2.18), g(NH3, 8.95), { label: "side-chain amino (ε–NH₃⁺)", pKa: 10.53, kind: "base" }],
  },
  {
    name: "Histidine",
    groups: [g(COOH, 1.82), { label: "side-chain imidazolium", pKa: 6.0, kind: "base" }, g(NH3, 9.17)],
  },
];

/** Fraction of a group that is deprotonated at a given pH (Henderson–Hasselbalch): 1 / (1 + 10^(pKa − pH)). */
export function fractionDeprotonated(pKa: number, pH: number): number {
  return 1 / (1 + Math.pow(10, pKa - pH));
}

/** Net charge of the fully protonated form = number of basic groups (each +1 when protonated). */
export function fullyProtonatedCharge(aa: AminoAcid): number {
  return aa.groups.filter((x) => x.kind === "base").length;
}

/** Net charge at a given pH. */
export function netCharge(aa: AminoAcid, pH: number): number {
  let q = fullyProtonatedCharge(aa);
  for (const grp of aa.groups) q -= fractionDeprotonated(grp.pKa, pH);
  return q;
}

/** Equivalents of OH⁻ added per mole, starting from the fully protonated form (= total protons removed). */
export function equivalentsOH(aa: AminoAcid, pH: number): number {
  return aa.groups.reduce((sum, grp) => sum + fractionDeprotonated(grp.pKa, pH), 0);
}

/**
 * Isoelectric point: the neutral (zwitterion) species is reached after removing Q0 protons, where Q0 is the charge
 * of the fully protonated form. pI = mean of the pKa that creates it and the pKa that destroys it.
 * Gly: (pK1+pK2)/2. Glu: (pK1+pKR)/2. Lys, His: (pK2+pK3)/2 in ascending order.
 */
export function isoelectricPoint(aa: AminoAcid): number {
  const q0 = fullyProtonatedCharge(aa);
  return (aa.groups[q0 - 1].pKa + aa.groups[q0].pKa) / 2;
}

/** Index k of the dominant species (k protons removed) at a pH: number of pKa values below the pH. */
export function dominantStateIndex(aa: AminoAcid, pH: number): number {
  return aa.groups.filter((x) => x.pKa < pH).length;
}

/** Integer net charge of the dominant species. */
export function dominantCharge(aa: AminoAcid, pH: number): number {
  return fullyProtonatedCharge(aa) - dominantStateIndex(aa, pH);
}
