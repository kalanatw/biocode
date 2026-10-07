/**
 * The topic map. "official" entries are the Level 3–4 courses supplied for this project; "provisional" entries are
 * foundation modules designed for this guide to build the background those courses assume.
 */
export interface CurriculumEntry {
  code: string;
  title: string;
  level: 1 | 2 | 3 | 4;
  semester: 1 | 2;
  credits: number;
  hours: string;
  kind: "lecture" | "practical" | "project" | "seminar";
  provenance: "official" | "provisional";
}

const L = (code: string, title: string, level: 1 | 2 | 3 | 4, semester: 1 | 2, credits: number, hours: string, kind: CurriculumEntry["kind"] = "lecture", provenance: CurriculumEntry["provenance"] = "official"): CurriculumEntry =>
  ({ code, title, level, semester, credits, hours, kind, provenance });

export const CURRICULUM: CurriculumEntry[] = [
  // ---- Level 1 (provisional foundations) ----
  L("FD 1101", "General & Physical Chemistry for Life Scientists", 1, 1, 3, "45L", "lecture", "provisional"),
  L("FD 1102", "Cell Biology and the Chemistry of Life", 1, 1, 3, "45L", "lecture", "provisional"),
  L("FD 1103", "Mathematics & Statistics for Biologists", 1, 2, 3, "45L", "lecture", "provisional"),
  L("FD 1104", "Organic Chemistry Foundations", 1, 2, 3, "45L", "lecture", "provisional"),
  // ---- Level 2 (provisional foundations) ----
  L("FD 2101", "Introductory Biochemistry", 2, 1, 3, "45L", "lecture", "provisional"),
  L("FD 2102", "Genetics and Molecular Foundations", 2, 1, 3, "45L", "lecture", "provisional"),
  L("FD 2103", "Microbiology and Laboratory Methods", 2, 2, 3, "45L", "lecture", "provisional"),
  L("FD 2104", "Analytical & Instrumental Techniques", 2, 2, 3, "45L", "lecture", "provisional"),
  // ---- Level 3, Semester 1 (official) ----
  L("BC 3022", "Metabolism I", 3, 1, 2, "30L"),
  L("BC 3030", "Practical Biochemistry and Molecular Biology", 3, 1, 8, "240L", "practical"),
  L("BC 3053", "Introduction to Bioinformatics", 3, 1, 2, "15L 30P"),
  L("CH 3033", "Chemistry of Biomolecules", 3, 1, 3, "45L"),
  L("MB 3022", "Gene Expression and Regulation", 3, 1, 3, "45L"),
  L("MB 3025", "Recombinant DNA Technology and Applications", 3, 1, 3, "45L"),
  // ---- Level 3, Semester 2 (official) ----
  L("BC 3023", "Metabolism II", 3, 2, 2, "30L"),
  L("BC 3024", "Bio-Physical Chemistry", 3, 2, 2, "30L"),
  L("BC 3025", "Protein Structure and Function", 3, 2, 2, "30L"),
  L("BC 3027", "Enzymology", 3, 2, 2, "30L"),
  L("CH 3054", "Nutritional and Clinical Biochemistry", 3, 2, 2, "30L"),
  L("MB 3024", "Topics in Molecular Cell Biology", 3, 2, 2, "30L"),
  // ---- Level 4, Semester 1 (official) ----
  L("BC 4001", "Research Project", 4, 1, 8, "240P", "project"),
  L("BC 4002", "Seminar and Essay", 4, 1, 3, "90P", "seminar"),
  L("BC 4004", "Optional Topics", 4, 1, 3, "45L"),
  L("MB 4001", "Genomics and Proteomics", 4, 1, 3, "45L"),
  L("MB 4003", "Molecular Evolution, Modelling and Computer-Based Drug Design", 4, 1, 3, "30L 30P"),
  L("ZL 4058", "Immunology", 4, 1, 2, "30L"),
  // ---- Level 4, Semester 2 (official) ----
  L("BC 4003", "General Paper", 4, 2, 3, "45L"),
  L("BC 4005", "Advanced Topics in Biochemistry and Molecular Biology", 4, 2, 2, "30L"),
  L("BC 4006", "Selected Topics in Biochemistry and Molecular Biology", 4, 2, 2, "30L"),
  L("MB 4004", "Applications in Biotechnology", 4, 2, 3, "45L"),
];

export const slug = (code: string) => code.replace(/\s+/g, "").toLowerCase();
