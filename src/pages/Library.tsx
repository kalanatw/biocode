import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Fuse from "fuse.js";
import type { Course } from "../types/content";
import { loadAllCourses } from "../lib/content";
import { slug as mkSlug } from "../content/curriculum";
import { PaperCard, ResourceCard } from "../components/ui/Cards";
import { LiteYouTube } from "../components/ui/LiteYouTube";

type Row =
  | { kind: "paper"; course: string; unit: string; text: string; data: Course["units"][number]["papers"][number] }
  | { kind: "video"; course: string; unit: string; text: string; data: Course["units"][number]["videos"][number] }
  | { kind: "resource"; course: string; unit: string; text: string; data: Course["units"][number]["resources"][number] };

export default function Library() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | Row["kind"]>("all");
  const [shown, setShown] = useState(30);

  useEffect(() => {
    loadAllCourses().then((cs) => {
      const seen = new Set<string>();
      const out: Row[] = [];
      for (const c of cs) {
        const add = (r: Row, id: string) => { if (!seen.has(id)) { seen.add(id); out.push(r); } };
        for (const u of c.units) {
          u.papers.forEach((p) => add({ kind: "paper", course: c.code, unit: u.title, text: `${p.title} ${p.authors} ${p.journal} ${p.whyItMatters}`, data: p }, "p" + p.doi));
          u.videos.forEach((v) => add({ kind: "video", course: c.code, unit: u.title, text: `${v.title} ${v.channel} ${v.whyWatch}`, data: v }, "v" + v.youtubeId));
          u.resources.forEach((r) => add({ kind: "resource", course: c.code, unit: u.title, text: `${r.title} ${r.provider} ${r.note}`, data: r }, "r" + r.url));
        }
        c.textbooks.forEach((r) => add({ kind: "resource", course: c.code, unit: "Course textbook", text: `${r.title} ${r.provider} ${r.note}`, data: r }, "r" + r.url));
      }
      setRows(out);
    });
  }, []);

  const fuse = useMemo(() => (rows ? new Fuse(rows, { keys: ["text", "course", "unit"], threshold: 0.35, ignoreLocation: true }) : null), [rows]);
  const list = useMemo(() => {
    if (!rows) return [];
    const base = q.trim() && fuse ? fuse.search(q).map((r) => r.item) : rows;
    return base.filter((r) => kind === "all" || r.kind === kind);
  }, [rows, fuse, q, kind]);

  return (
    <div className="wrap" style={{ paddingTop: 32 }}>
      <h1>Library</h1>
      <p className="dim">Every paper, video and resource across all courses, searchable.</p>
      <input className="field" type="search" placeholder="Search e.g. “CRISPR”, “enzyme kinetics”, “Mitchell”…" aria-label="Search library" value={q} onChange={(e) => { setQ(e.target.value); setShown(30); }} />
      <div className="tabs" role="tablist" aria-label="Type">
        {(["all", "paper", "video", "resource"] as const).map((k) => <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setShown(30); }}>{k === "all" ? "Everything" : k + "s"}</button>)}
      </div>
      {!rows ? <p className="dim">Loading…</p> : <p className="dim">{list.length} results</p>}
      <div className={kind === "video" ? "videos" : ""}>
        {list.slice(0, shown).map((r, i) => (
          <div key={i}>
            <p className="dim" style={{ fontSize: "0.78rem", margin: "10px 0 2px" }}>
              <Link to={`/course/${mkSlug(r.course)}`}>{r.course}</Link> · {r.unit}
            </p>
            {r.kind === "paper" ? <PaperCard p={r.data} /> : r.kind === "video" ? <LiteYouTube video={r.data} /> : <ResourceCard r={r.data} />}
          </div>
        ))}
      </div>
      {list.length > shown && <button className="btn" onClick={() => setShown(shown + 30)}>Show more</button>}
    </div>
  );
}
