import { Link } from "react-router-dom";
import { CURRICULUM, slug } from "../content/curriculum";
import { hasContent, manifestFor, MANIFEST } from "../lib/content";
import { courseDoneCount, useProgress } from "../lib/store";

const YEAR_NAME = ["", "Foundations", "Core Molecules & Methods", "Depth & Practice", "Research & Frontiers"];
const nf = new Intl.NumberFormat("en");

export default function Home() {
  const done = useProgress((s) => s.done);
  const total = Object.values(done).length;
  const sum = Object.values(MANIFEST).reduce((a, m) => ({ units: a.units + m.units, videos: a.videos + m.videos, papers: a.papers + m.papers, resources: a.resources + m.resources }), { units: 0, videos: 0, papers: 0, resources: 0 });

  return (
    <div className="wrap">
      <section className="hero">
        <p className="script">Exploring the source code of life</p>
        <h1>The best free resources in biochemistry, <span>organised so you can actually use them.</span></h1>
        <p className="tagline">
          DNA is the language. Proteins are the machinery. Cells are the cities. Life is the operating system.
          Every topic below is broken into short units, each with a story, key concepts, an interactive animation,
          hand-picked videos, landmark papers, free references and a self-check — and every link is verified.
        </p>
        <p className="dim">
          {sum.units} units · {nf.format(sum.videos)} videos · {sum.papers} papers · {nf.format(sum.resources)} free references
          {total > 0 && <> · {total} units completed <span aria-hidden="true">💗</span></>}
        </p>
      </section>

      <div className="notice" style={{ marginBottom: 8 }}>
        <b>How this guide is built.</b> It follows international curricula and current practice and points toward where the field is heading — it is not tied to any one syllabus.
        Explanations are original; videos, papers and references are linked out to their source. Use it alongside your own notes.
      </div>

      {[1, 2, 3, 4].map((lvl) => (
        <section className="year" key={lvl} aria-labelledby={`y${lvl}`}>
          <div className="year-head">
            <span className="num" aria-hidden="true">{lvl}</span>
            <h2 id={`y${lvl}`}>Year {lvl} — {YEAR_NAME[lvl]}</h2>
          </div>
          {[1, 2].map((sem) => {
            const list = CURRICULUM.filter((c) => c.level === lvl && c.semester === sem);
            if (!list.length) return null;
            return (
              <div key={sem}>
                <div className="sem-label">Semester {sem}</div>
                <div className="grid">
                  {list.map((c) => {
                    const s = slug(c.code);
                    const m = manifestFor(c.code);
                    const ok = hasContent(s);
                    const d = courseDoneCount(done, s);
                    const pct = m ? Math.round((d / m.units) * 100) : 0;
                    const inner = (
                      <>
                        <span className="code">{c.code}</span>
                        <h3>{c.title}</h3>
                        <div className="meta">
                          <span className="chip">{c.credits} cr</span>
                          <span className="chip">{c.hours}</span>
                          {c.kind !== "lecture" && <span className="chip pink">{c.kind}</span>}
                          {c.provenance === "provisional" && <span className="chip gold">foundation</span>}
                          {ok && m ? <span className="chip">{m.units} units · {m.videos} videos</span> : <span className="chip">coming soon</span>}
                        </div>
                        {ok && m && <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress"><i style={{ width: `${pct}%` }} /></div>}
                      </>
                    );
                    return ok ? (
                      <Link key={c.code} to={`/course/${s}`} className="glass hover course-card">{inner}</Link>
                    ) : (
                      <div key={c.code} className="glass course-card" style={{ opacity: 0.6 }}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
