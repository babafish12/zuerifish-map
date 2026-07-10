import { ExternalLink } from "lucide-react";
import type { Source } from "../types";

interface SourceListProps {
  sources: Source[];
  title?: string;
  meta?: string;
}

export function SourceList({ sources, title = "Links und Quellen", meta = "offizielle Seiten" }: SourceListProps) {
  return (
    <section className="panel-section sources" aria-labelledby="source-title">
      <div className="section-heading">
        <h3 id="source-title">{title}</h3>
        <span>{meta}</span>
      </div>
      <div className="source-list">
        {sources.map((source) => (
          <article key={source.id} className="source-item">
            <div>
              <strong>{source.title}</strong>
              <p>
                {source.publisher} · {source.date}
              </p>
              <small>{source.usedFor}</small>
            </div>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer" aria-label={`${source.title} öffnen`}>
                <ExternalLink size={16} />
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
