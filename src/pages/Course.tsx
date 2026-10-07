import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Course, Level, Unit } from "../types/content";
import { loadCourse } from "../lib/content";
import { useProgress } from "../lib/store";
import { VIZ } from "../components/viz/registry";
import { LiteYouTube } from "../components/ui/LiteYouTube";
import { PaperCard, ResourceCard } from "../components/ui/Cards";
import { SelfCheck } from "../components/ui/SelfCheck";

export default function CoursePage() {
  const { slug = "" } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setCourse(null); setErr(null);
    loadCourse(slug).then(setCourse).catch((e: Error) => setErr(e.message));
  }, [slug]);

  if (err) return <div className="wrap" style={{ paddingTop: 40 }}><p className="notice">{err}</p><Link to="/">← Back to the degree map</Link></div>;
  if (!course) return <div className="wrap" style={{ paddingTop: 40 }}><p className="dim">Loading course…</p></div>;
  return <CourseView course={course} slug={slug} />;
}

function CourseView({ course, slug }: { course: Course; slug: string }) {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const done = useProgress((s) => s.done);
  const idx = Math.min(Math.max(0, course.units.findIndex((u) => u.id === params.get("unit"))), course.units.length - 1);
  const overview = params.get("unit") === null;
  const unit = course.units[idx];
  const doneN = course.units.filter((u) => done[`${slug}/${u.id}`]).length;

  const go = (id: string | null) => {
    setParams(id ? { unit: id } : {}, { replace: false });
    window.scrollTo({ top: 0 });
  };
  useEffect(() => { document.title = `${course.code} ${course.title} · BIOCODE`; }, [course]);

  return (
    <div className="wrap">
      <p style={{ marginTop: 20 }}><Link to="/" onClick={(e) => { e.preventDefault(); nav("/"); }}>← All topics</Link></p>
      <div className="course-layout">
        <aside className="glass side" aria-label="Course units">
          <button className="btn sm" onClick={() => go(null)} aria-current={overview ? "true" : undefined}>Course overview</button>
          <div className="bar" aria-hidden="true"><i style={{ width: `${(doneN / course.units.length) * 100}%` }} /></div>
          <p className="dim" style={{ fontSize: "0.8rem", margin: "6px 0 0" }}>{doneN}/{course.units.length} units complete</p>
          <ol>
            {course.units.map((u, i) => {
              const d = done[`${slug}/${u.id}`];
              return (
                <li key={u.id}>
                  <button onClick={() => go(u.id)} aria-current={!overview && i === idx ? "true" : undefined}>
                    <span className={`dot ${d ? "done" : ""}`} aria-hidden="true">{d ? "✓" : i + 1}</span>
                    <span>{u.title}<span className="sr-only">{d ? " (completed)" : ""}</span></span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <div>
          {overview ? <Overview course={course} onStart={() => go(course.units[0].id)} />
            : <UnitView key={unit.id} unit={unit} slug={slug} idx={idx} total={course.units.length}
                onPrev={() => go(course.units[idx - 1].id)} onNext={() => go(idx + 1 < course.units.length ? course.units[idx + 1].id : null)} />}
        </div>
      </div>
    </div>
  );
}

function Overview({ course, onStart }: { course: Course; onStart: () => void }) {
  return (
    <>
      <div className="glass unit">
        <span className="mono" style={{ color: "var(--pink)" }}>{course.code} · Year {course.level} · Semester {course.semester}</span>
        <h1 style={{ margin: "6px 0" }}>{course.title}</h1>
        <p className="script" style={{ margin: "0 0 12px" }}>{course.tagline}</p>
        <p>
          <span className="chip">{course.credits} credits</span> <span className="chip">{course.hours}</span>{" "}
          {course.provenance === "provisional" && <span className="chip gold">foundation module</span>}
        </p>
        <p>{course.overview}</p>
        <h3>Why it matters</h3>
        <p>{course.whyItMatters}</p>
        {course.prerequisites.length > 0 && <p className="dim">Helpful background: {course.prerequisites.join(", ")}</p>}
        <h3>How to study this course</h3>
        <ul>{course.studyTips.map((t) => <li key={t}>{t}</li>)}</ul>
        {course.careerLinks.length > 0 && <p className="dim">Leads toward: {course.careerLinks.join(" · ")}</p>}
        <button className="btn primary" onClick={onStart}>Begin unit 1 →</button>
      </div>
      {course.courseVideos.length > 0 && (
        <div className="glass unit"><h2>Whole-course videos</h2><div className="videos">{course.courseVideos.map((v) => <LiteYouTube key={v.youtubeId} video={v} />)}</div></div>
      )}
      {course.textbooks.length > 0 && (
        <div className="glass unit"><h2>Textbooks &amp; references</h2>{course.textbooks.map((r) => <ResourceCard key={r.url} r={r} />)}</div>
      )}
    </>
  );
}

function UnitView({ unit, slug, idx, total, onPrev, onNext }: { unit: Unit; slug: string; idx: number; total: number; onPrev: () => void; onNext: () => void }) {
  const key = `${slug}/${unit.id}`;
  const done = useProgress((s) => !!s.done[key]);
  const toggle = useProgress((s) => s.toggleDone);
  const [layer, setLayer] = useState<Level>("beginner");
  const Viz = unit.animation ? VIZ[unit.animation] : null;

  return (
    <>
      <article className="glass unit">
        <span className="mono dim">Unit {idx + 1} of {total}{unit.hours ? ` · ~${unit.hours} h` : ""}</span>
        <h1 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", margin: "4px 0 16px" }}>{unit.title}</h1>
        <p className="hook">{unit.hook}</p>

        <h2>After this unit you can…</h2>
        <ul>{unit.learningObjectives.map((o) => <li key={o}>{o}</li>)}</ul>

        <h2>Key concepts</h2>
        <div className="concepts">{unit.keyConcepts.map((c) => <div className="concept" key={c.term}><b>{c.term}</b>{c.definition}</div>)}</div>

        {Viz && (
          <>
            <h2 style={{ marginTop: 28 }}>See it move</h2>
            <Suspense fallback={<div className="glass viz dim">Loading animation…</div>}><Viz /></Suspense>
          </>
        )}

        <h2 style={{ marginTop: 28 }}>Go deeper</h2>
        <div className="tabs" role="tablist" aria-label="Depth">
          {(["beginner", "intermediate", "advanced"] as const).map((l) => (
            <button key={l} role="tab" aria-selected={layer === l} onClick={() => setLayer(l)}>{l}</button>
          ))}
        </div>
        <div role="tabpanel"><p>{unit.deeper[layer]}</p></div>

        <h3>Common mistakes</h3>
        {unit.commonMistakes.map((m) => <div className="callout" key={m}>{m}</div>)}

        <h2 style={{ marginTop: 28 }}>Watch</h2>
        <div className="videos">{unit.videos.map((v) => <LiteYouTube key={v.youtubeId + (v.startSeconds ?? 0)} video={v} />)}</div>

        {unit.papers.length > 0 && <><h2 style={{ marginTop: 28 }}>Read the originals</h2>{unit.papers.map((p) => <PaperCard key={p.doi} p={p} />)}</>}
        {unit.resources.length > 0 && <><h2 style={{ marginTop: 28 }}>Go further</h2>{unit.resources.map((r) => <ResourceCard key={r.url} r={r} />)}</>}

        <h2 style={{ marginTop: 28 }}>Self-check</h2>
        <SelfCheck unit={unit} storeKey={key} />

        <div className="nav-row">
          <button className="btn" onClick={onPrev} disabled={idx === 0}>← Previous</button>
          <button className={`btn ${done ? "" : "primary"}`} onClick={() => toggle(key)} aria-pressed={done}>{done ? "✓ Completed (undo)" : "Mark unit complete"}</button>
          <button className="btn" onClick={onNext}>{idx + 1 < total ? "Next unit →" : "Finish course"}</button>
        </div>
      </article>
    </>
  );
}
