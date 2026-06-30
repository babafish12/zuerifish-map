import { ExternalLink } from "lucide-react";
import type { Source } from "../types";

interface SourceListProps {
  sources: Source[];
}

export function SourceList({ sources }: SourceListProps) {
  return (
    <section className="panel-section sources" aria-labelledby="source-title">
      <div className="section-heading">
        <h3 id="source-title">Quellen und Datenstand</h3>
        <span>Regelstand: 2026</span>
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
              {source.status ? <small>{source.status}</small> : null}
              {source.license ? <small>Lizenz: {source.license}</small> : null}
              {source.author ? <small>Autor: {source.author}</small> : null}
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

