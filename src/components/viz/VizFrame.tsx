import type { ReactNode } from "react";

interface Props {
  title: string;
  /** One sentence: what the student should notice. */
  caption: string;
  children: ReactNode;
  controls?: ReactNode;
  /** What this animation simplifies or where its analogy breaks. Required — educational honesty. */
  simplified: string;
}

/** Shared chrome for every inline animation: title, caption, controls row, and the mandatory "Simplified for story" note. */
export function VizFrame({ title, caption, children, controls, simplified }: Props) {
  return (
    <figure className="glass viz" style={{ margin: "20px 0" }}>
      <div className="viz-head">
        <h4>{title}</h4>
        <span className="chip pink">interactive</span>
      </div>
      <p className="dim" style={{ margin: "4px 0 12px" }}>{caption}</p>
      {children}
      {controls && <div className="viz-controls">{controls}</div>}
      <figcaption className="viz-note"><b>Simplified for story:</b> {simplified}</figcaption>
    </figure>
  );
}
