import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { AnimationId } from "../../types/content";

/** Every animation is a lazy-loaded default export with no props. Add a file, add a line. */
export const VIZ: Record<AnimationId, LazyExoticComponent<ComponentType>> = {
  "dna-helix": lazy(() => import("./DnaHelix")),
  "central-dogma": lazy(() => import("./CentralDogma")),
  "genetic-code": lazy(() => import("./GeneticCode")),
  "lac-operon": lazy(() => import("./LacOperon")),
  "glycolysis-flow": lazy(() => import("./GlycolysisFlow")),
  "chemiosmosis": lazy(() => import("./Chemiosmosis")),
  "michaelis-menten": lazy(() => import("./MichaelisMenten")),
  "protein-folding": lazy(() => import("./ProteinFolding")),
  "pcr-cycles": lazy(() => import("./PcrCycles")),
  "cloning-cut-paste": lazy(() => import("./CloningCutPaste")),
  "sequence-alignment": lazy(() => import("./SequenceAlignment")),
  "titration-curve": lazy(() => import("./TitrationCurve")),
  "immune-response": lazy(() => import("./ImmuneResponse")),
  "cell-scale-zoom": lazy(() => import("./CellScaleZoom")),
};
