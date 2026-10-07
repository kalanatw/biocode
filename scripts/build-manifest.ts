/** Writes src/content/manifest.json: per-course unit/video/paper counts so the home page needn't load every course. */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIR = join(ROOT, "src/content/courses");
const out: Record<string, { units: number; videos: number; papers: number; resources: number }> = {};
for (const f of readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
  const c = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  const sum = (k: string) => c.units.reduce((n: number, u: Record<string, unknown[]>) => n + (u[k]?.length ?? 0), 0);
  out[f.replace(".json", "")] = { units: c.units.length, videos: sum("videos") + (c.courseVideos?.length ?? 0), papers: sum("papers"), resources: sum("resources") + (c.textbooks?.length ?? 0) };
}
writeFileSync(join(ROOT, "src/content/manifest.json"), JSON.stringify(out, null, 1));
console.log(`manifest: ${Object.keys(out).length} courses`);
