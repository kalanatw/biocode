import { describe, expect, it, afterEach } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { createElement, type ComponentType } from "react";
import { AnimationIdEnum } from "../types/content";

const modules = import.meta.glob<{ default: ComponentType }>("../components/viz/*.tsx");
const nameOf = (id: string) => id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const FILE: Record<string, string> = { "central-dogma": "CentralDogma", "dna-helix": "DnaHelix", "genetic-code": "GeneticCode", "lac-operon": "LacOperon", "glycolysis-flow": "GlycolysisFlow", "chemiosmosis": "Chemiosmosis", "michaelis-menten": "MichaelisMenten", "protein-folding": "ProteinFolding", "pcr-cycles": "PcrCycles", "cloning-cut-paste": "CloningCutPaste", "sequence-alignment": "SequenceAlignment", "titration-curve": "TitrationCurve", "immune-response": "ImmuneResponse", "cell-scale-zoom": "CellScaleZoom" };

afterEach(cleanup);

describe("inline animations", () => {
  for (const id of AnimationIdEnum.options) {
    it(`${id}: renders, has honesty note, survives clicking every button`, async () => {
      const path = `../components/viz/${FILE[id] ?? nameOf(id)}.tsx`;
      expect(modules[path], `missing file ${path}`).toBeTruthy();
      const Comp = (await modules[path]()).default;
      const { container } = render(createElement(Comp));
      expect(container.querySelector("figure.viz")).toBeTruthy();
      expect(container.textContent).toMatch(/Simplified for story/);
      expect(container.querySelector("svg, canvas, table, [aria-live]")).toBeTruthy();
      // every button once, then every range slider to its max and min
      for (const b of Array.from(container.querySelectorAll("button"))) fireEvent.click(b);
      for (const r of Array.from(container.querySelectorAll<HTMLInputElement>('input[type="range"]'))) {
        fireEvent.change(r, { target: { value: r.max } });
        fireEvent.change(r, { target: { value: r.min } });
      }
      for (const b of Array.from(container.querySelectorAll("button"))) fireEvent.click(b);
      expect(container.querySelector("figure.viz")).toBeTruthy();
    });
  }
});
