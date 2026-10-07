# Inline animation brief (for engineer agents)

BIOCODE embeds small, self-contained, interactive animations inside lesson units. Each one **teaches one concept**.

## Contract
- File: `app/src/components/viz/<Name>.tsx`, `export default function <Name>(): JSX.Element` — **no props**. The registry
  (`registry.ts`, already written — do not edit) lazy-imports it.
- Wrap in `<VizFrame title caption controls simplified>` from `./VizFrame`. The `simplified` note (what is simplified /
  where the analogy breaks) is mandatory and must be honest.
- Tech: React 19 + TypeScript strict (`verbatimModuleSyntax` → use `import type` for types; no unused locals/params;
  `erasableSyntaxOnly` → no enums/namespaces/parameter properties). Use **inline SVG + React state/requestAnimationFrame**
  (or CSS keyframes). Do NOT add npm dependencies. `framer-motion` is installed if you want it.
- Style with the CSS variables in `src/index.css` (`--pink`, `--gold`, `--red`, `--ink`, `--ink-dim`, `--line`, `--glass`,
  `--good`, `--info`, `--font-mono`) and the existing classes (`.btn`, `.btn.sm`, `.chip`, `.viz-controls`). Dark background.
  Inline `style={{}}` for one-offs; do not edit index.css.
- **Accessibility**: `useReducedMotion()` from `../../hooks/useReducedMotion` → when true, no autoplay: show a static
  state and let the user step with buttons. Pause rAF loops when off-screen (`useInView` from `../../hooks/useInView`).
  SVG gets `role="img"` + `aria-label` describing what it shows (and update it as state changes where meaningful, or add an
  `aria-live="polite"` text readout). All controls are real `<button>`/`<input>` with labels; fully keyboard operable.
  Colour is never the only signal. Text contrast ≥ 4.5:1 on the dark background.
- **Scientific accuracy matters more than prettiness.** Numbers and mechanisms must be textbook-correct (check with a quick
  search if unsure). Labels in plain English with the proper term in brackets.
- Performance: < 2 ms/frame work, ≤ ~300 animated nodes, cap DPR if using canvas. Cleanup effects on unmount.
- Keep each file < ~350 lines. Interaction beats decoration: the student should *do* something (toggle, drag a slider, step
  through) and see the consequence.
- Typecheck only your files: from `app/` run `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "<YourFile1>|<YourFile2>"`
  (other files from the registry may be missing while teammates work — ignore those errors). Then also run
  `npx eslint src/components/viz/<YourFile>.tsx`. Fix everything in your files.
- Final reply ≤ 100 words: files written, what the student can do in each, any accuracy caveats.

## Animation specs
1. **DnaHelix** — rotating double helix (SVG, pseudo-3D by sinusoidal x and depth-scaled circles). Click/hover a base pair →
   shows A–T (2 H-bonds) or G–C (3 H-bonds). Slider for rotation speed; toggle "show backbone direction" 5'→3' antiparallel.
   Facts: ~10.5 bp/turn, 0.34 nm rise (B-DNA), 2 nm diameter.
2. **CentralDogma** — stepper DNA → mRNA → protein with a short template (e.g. 12-nt gene). Buttons: Transcribe, (splice
   toggle: add an intron that is removed), Translate (codons light up, amino acids appended). Show template vs coding strand
   correctly (mRNA matches the coding strand with U for T). Include a "mutate a base" button showing silent/missense/nonsense.
3. **GeneticCode** — circular genetic-code wheel (or 4×4×4 table) + user types an mRNA string; reading frame highlighted,
   start AUG, stop codons; output peptide with 1-letter and 3-letter codes. Standard code only (note mitochondrial variants).
4. **LacOperon** — toggles for lactose and glucose; shows repressor (LacI) bound/unbound at operator, CAP–cAMP binding,
   RNA polymerase, and expression level (off / basal / low / high) with the correct four-condition logic
   (+lac/−glc high, +lac/+glc low, −lac off, −lac/−glc off). Allolactose is the real inducer.
5. **GlycolysisFlow** — 10-step pathway as a vertical/winding track; a glucose "particle" is stepped through; ATP spent
   (steps 1, 3) vs made (steps 7, 10), NADH at step 6, investment vs payoff phases, net 2 ATP + 2 NADH + 2 pyruvate per
   glucose; clicking an enzyme shows its name; toggle "inhibit PFK-1 (high ATP/citrate)" to show the bottleneck backing up.
6. **Chemiosmosis** — inner mitochondrial membrane: electron flow through complexes I–IV pumping H⁺ to the intermembrane
   space, gradient builds, H⁺ flows back through ATP synthase turning the rotor → ATP. Buttons: add NADH/O₂, "add cyanide"
   (blocks complex IV), "add uncoupler (DNP)" (protons leak, heat, no ATP), "oligomycin" (blocks ATP synthase gradient
   builds). Show pH/ΔpH meter and ATP counter. Use the modern ≈ 2.5 ATP per NADH / 1.5 per FADH₂ framing only in notes.
7. **MichaelisMenten** — live plot of v vs [S] with sliders for Vmax, Km, [I], Ki and inhibitor type (none / competitive /
   uncompetitive / non-competitive); switch between hyperbola and Lineweaver–Burk (double-reciprocal). Mark Km at Vmax/2.
   Use correct equations (competitive: Km_app = Km(1+[I]/Ki); uncompetitive: both divided by (1+[I]/Ki); non-competitive:
   Vmax_app = Vmax/(1+[I]/Ki)). Display the equation with current numbers.
8. **ProteinFolding** — a chain of ~20 residues (hydrophobic = one colour, polar = another) that collapses from random coil
   to compact state in stepped stages: coil → secondary structure (helix segment/β strand) → hydrophobic collapse (burying
   hydrophobic residues) → native tertiary. Slider = "folding progress"; toggle "add denaturant (urea)" unfolds it;
   mention Anfinsen. Energy-funnel mini plot optional. Do NOT claim to be a real simulation.
9. **PcrCycles** — step through denaturation (95 °C) → annealing (~55–65 °C) → extension (72 °C) with Taq; show strands,
   primers, and a copy-number counter doubling each cycle (2ⁿ), with a note on first cycles producing long products and
   target-length amplicon emerging from cycle 3. Slider for cycles up to 30; log-scale bar.
10. **CloningCutPaste** — plasmid ring + insert gene; choose a restriction enzyme (EcoRI G^AATTC, BamHI G^GATCC, HindIII
    A^AGCTT) — sticky ends shown; only matching ends ligate; steps: cut → mix → ligate → transform → select on antibiotic
    plate (blue/white or AmpR note). Wrong enzyme pair = fails with explanation. Keep sequences short and correct.
11. **SequenceAlignment** — Needleman–Wunsch global alignment on two short editable sequences (≤ 12 nt/aa each) with
    editable match/mismatch/gap scores; animate filling the DP matrix cell by cell (or step button), then trace back and show
    the alignment. Implement the algorithm correctly (test mentally: GATTACA vs GCATGCU with 1/−1/−1 → score 0).
12. **TitrationCurve** — Henderson–Hasselbalch: choose an amino acid (glycine pKa 2.34/9.60; alanine 2.34/9.69;
    glutamate 2.19/4.25/9.67; lysine 2.18/8.95/10.53; histidine 1.82/6.00/9.17) — values from standard textbooks (e.g.
    Lehninger/Berg); plot pH vs equivalents of OH⁻, mark pKa buffer regions and pI; slider for pH shows the dominant
    charged species and net charge. pI computed correctly (average of the two pKa flanking the neutral species).
13. **ImmuneResponse** — simplified innate → adaptive timeline on a canvas/SVG: pathogens appear, macrophage engulfs and
    presents antigen, helper T cell selects the matching B-cell clone (clonal selection among 5 clones with different
    receptors), plasma cells secrete antibodies, memory cells persist; "second exposure" button shows faster, larger response
    (plot of antibody titre vs time, primary vs secondary). Include "where the cybersecurity analogy breaks".
14. **CellScaleZoom** — powers-of-ten slider/zoom from a human (1 m) → organ → cell (10 µm) → organelle (mitochondrion
    ~1 µm) → protein (~5 nm) → DNA (2 nm width) → atom (~0.1 nm). Logarithmic scale bar with an animated counter, each
    stage with an original simple SVG illustration + one-line description. Typical sizes must be standard-textbook-correct.

## Assignment split
Agent A: DnaHelix, CentralDogma, GeneticCode, CellScaleZoom
Agent B: LacOperon, GlycolysisFlow, Chemiosmosis, ImmuneResponse
Agent C: MichaelisMenten, TitrationCurve, SequenceAlignment
Agent D: ProteinFolding, PcrCycles, CloningCutPaste
