/**
 * Validates every course JSON against the Zod schema, then verifies externally:
 *  - DOIs resolve on Crossref and the registered title matches ours (fuzzy)
 *  - YouTube IDs resolve through oEmbed (video exists + embeddable) and report the real title
 *  - Resource URLs respond (HEAD, then GET fallback)
 *
 * Usage:
 *   npx tsx scripts/verify-content.ts                 # all courses
 *   npx tsx scripts/verify-content.ts BC3022 MB3022   # specific course codes (no space)
 *
 * Writes docs/link-report.json. Exit code 1 if anything fails.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { CourseSchema } from "../src/types/content";

const ROOT = resolve(import.meta.dirname, "..");
const DIR = join(ROOT, "src/content/courses");
const UA = "BiocodeVerifier/1.0 (mailto:kalana.weerakoon@h2o.ai)";

type Check = { kind: "doi" | "video" | "url"; course: string; unit: string; key: string; ok: boolean; detail: string };

const norm = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function similar(a: string, b: string) {
  const A = new Set(norm(a).split(" ")), B = new Set(norm(b).split(" "));
  let hit = 0;
  A.forEach((w) => B.has(w) && hit++);
  return hit / Math.max(1, Math.min(A.size, B.size));
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  const q = [...items];
  await Promise.all(Array.from({ length: n }, async () => { for (let x = q.shift(); x; x = q.shift()) await fn(x); }));
}

const cache = new Map<string, Promise<{ ok: boolean; detail: string }>>();
const once = (k: string, f: () => Promise<{ ok: boolean; detail: string }>) => (cache.has(k) ? cache.get(k)! : (cache.set(k, f()), cache.get(k)!));

async function checkDoi(doi: string, title: string) {
  return once("doi:" + doi + title, async () => {
    try {
      const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { headers: { "User-Agent": UA } });
      if (!r.ok) return { ok: false, detail: `Crossref HTTP ${r.status}` };
      const j = (await r.json()) as { message: { title?: string[] } };
      const real = j.message.title?.[0] ?? "";
      const s = similar(title, real);
      return s >= 0.6 ? { ok: true, detail: real } : { ok: false, detail: `TITLE MISMATCH (sim ${s.toFixed(2)}). Crossref says: "${real}"` };
    } catch (e) { return { ok: false, detail: String(e) }; }
  });
}

async function checkVideo(id: string, title: string) {
  return once("yt:" + id, async () => {
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}&format=json`);
      if (!r.ok) return { ok: false, detail: `oEmbed HTTP ${r.status} (private, removed, or embedding disabled)` };
      const j = (await r.json()) as { title: string; author_name: string };
      const s = similar(title, j.title);
      return s >= 0.4 ? { ok: true, detail: `${j.title} — ${j.author_name}` } : { ok: false, detail: `TITLE MISMATCH (sim ${s.toFixed(2)}). YouTube says: "${j.title}" by ${j.author_name}` };
    } catch (e) { return { ok: false, detail: String(e) }; }
  });
}

async function checkUrl(url: string) {
  return once("url:" + url, async () => {
    const opts = { redirect: "follow" as const, headers: { "User-Agent": "Mozilla/5.0 " + UA }, signal: AbortSignal.timeout(20000) };
    try {
      let r = await fetch(url, { ...opts, method: "HEAD" });
      if (!r.ok) r = await fetch(url, { ...opts, method: "GET" });
      // 403/429 from bot walls (publishers) are reported as "warn" but counted ok
      if (r.status === 403 || r.status === 429) return { ok: true, detail: `HTTP ${r.status} (bot-wall; manual check advised)` };
      return { ok: r.ok, detail: `HTTP ${r.status}` };
    } catch (e) { return { ok: false, detail: String(e) }; }
  });
}

async function main() {
  const wanted = process.argv.slice(2).map((s) => s.replace(/\s+/g, ""));
  const files = readdirSync(DIR).filter((f) => f.endsWith(".json")).filter((f) => !wanted.length || wanted.some((w) => f.startsWith(w)));
  const checks: Check[] = [];
  const schemaErrors: string[] = [];
  const jobs: (() => Promise<void>)[] = [];

  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(DIR, f), "utf8"));
    const parsed = CourseSchema.safeParse(raw);
    if (!parsed.success) {
      schemaErrors.push(`${f}: ` + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | "));
      continue;
    }
    const c = parsed.data;
    const push = (kind: Check["kind"], unit: string, key: string, fn: () => Promise<{ ok: boolean; detail: string }>) =>
      jobs.push(async () => { const r = await fn(); checks.push({ kind, course: c.code, unit, key, ...r }); });
    c.courseVideos.forEach((v) => push("video", "_course", v.youtubeId, () => checkVideo(v.youtubeId, v.title)));
    c.textbooks.forEach((t) => push("url", "_course", t.url, () => checkUrl(t.url)));
    for (const u of c.units) {
      u.videos.forEach((v) => push("video", u.id, v.youtubeId, () => checkVideo(v.youtubeId, v.title)));
      u.papers.forEach((p) => push("doi", u.id, p.doi, () => checkDoi(p.doi, p.title)));
      u.papers.forEach((p) => p.openAccessUrl && push("url", u.id, p.openAccessUrl, () => checkUrl(p.openAccessUrl!)));
      u.resources.forEach((r) => push("url", u.id, r.url, () => checkUrl(r.url)));
    }
  }

  await pool(jobs, 6, (j) => j());
  const failed = checks.filter((c) => !c.ok);
  mkdirSync(join(ROOT, "docs"), { recursive: true });
  const reportPath = join(ROOT, "docs/link-report.json");
  // merge with previous report when verifying a subset
  let prev: Check[] = [];
  if (wanted.length && existsSync(reportPath)) {
    try { prev = (JSON.parse(readFileSync(reportPath, "utf8")).checks as Check[]).filter((c) => !checks.some((n) => n.course === c.course)); } catch { /* ignore */ }
  }
  writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), schemaErrors, checks: [...prev, ...checks] }, null, 1));

  console.log(`Courses: ${files.length}  checks: ${checks.length}  failed: ${failed.length}  schemaErrors: ${schemaErrors.length}`);
  schemaErrors.forEach((e) => console.log("SCHEMA  " + e));
  failed.forEach((c) => console.log(`FAIL ${c.kind.padEnd(5)} ${c.course} / ${c.unit} / ${c.key}\n       ${c.detail}`));
  process.exit(failed.length || schemaErrors.length ? 1 : 0);
}
main();
