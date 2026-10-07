import type { Paper, Resource } from "../../types/content";

export function PaperCard({ p }: { p: Paper }) {
  return (
    <article className="paper">
      <h4>
        <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">{p.title}</a>
      </h4>
      <div className="dim" style={{ fontSize: "0.85rem" }}>
        {p.authors} · <i>{p.journal}</i> · {p.year} · <span className="chip">{p.level}</span>{" "}
        {p.openAccessUrl && <a className="chip gold" href={p.openAccessUrl} target="_blank" rel="noreferrer">open access</a>}
      </div>
      <p style={{ margin: "8px 0 0" }}>{p.whyItMatters}</p>
      {p.readingQuestions && p.readingQuestions.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary>Guiding questions while you read</summary>
          <ul>{p.readingQuestions.map((q) => <li key={q}>{q}</li>)}</ul>
        </details>
      )}
    </article>
  );
}

export function ResourceCard({ r }: { r: Resource }) {
  return (
    <article className="resource">
      <h4><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></h4>
      <div className="dim" style={{ fontSize: "0.85rem" }}>
        {r.provider} · <span className="chip">{r.type}</span> <span className={`chip ${r.free ? "gold" : ""}`}>{r.free ? "free" : "paid"}</span>{" "}
        <span className="chip">{r.level}</span>
      </div>
      <p style={{ margin: "8px 0 0" }}>{r.note}</p>
    </article>
  );
}
