import { useState } from "react";
import type { Video } from "../../types/content";

/** Click-to-load YouTube embed (privacy-friendly nocookie domain; no iframe/JS cost until play). */
export function LiteYouTube({ video }: { video: Video }) {
  const [on, setOn] = useState(false);
  const start = video.startSeconds ? `&start=${video.startSeconds}` : "";
  return (
    <div className="video">
      <div className="frame">
        {on ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&cc_load_policy=1${start}`}
            title={video.title}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <>
            <img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" />
            <button className="play" onClick={() => setOn(true)} aria-label={`Play video: ${video.title}`}>
              <span aria-hidden="true">▶</span>
            </button>
          </>
        )}
      </div>
      <h4 style={{ margin: "10px 0 2px", fontSize: "0.98rem" }}>{video.title}</h4>
      <div className="dim" style={{ fontSize: "0.85rem" }}>
        {video.channel} · <span className="chip">{video.level}</span>
      </div>
      <p style={{ fontSize: "0.9rem", margin: "6px 0 0" }}>{video.whyWatch}</p>
      <a style={{ fontSize: "0.8rem" }} href={`https://www.youtube.com/watch?v=${video.youtubeId}${video.startSeconds ? `&t=${video.startSeconds}s` : ""}`} target="_blank" rel="noreferrer">
        Open on YouTube ↗
      </a>
    </div>
  );
}
