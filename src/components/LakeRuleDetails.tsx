import { AlertTriangle, CheckCircle2, ExternalLink, ShieldAlert } from "lucide-react";
import { getSources } from "../lib/data";
import type { LakeDetailRuleCoverage, LakeDetailRules, Source } from "../types";

interface LakeRuleDetailsProps {
  details: LakeDetailRules;
}

const COVERAGE_LABELS: Record<LakeDetailRuleCoverage, string> = {
  verified: "amtlich geprüft",
  partial: "teilweise geklärt",
  delegatedPacht: "Pachtregeln"
};

export function LakeRuleDetails({ details }: LakeRuleDetailsProps) {
  const sources = getSources(details.sourceIds);
  const CoverageIcon = details.coverage === "verified" ? CheckCircle2 : AlertTriangle;

  return (
    <section className="panel-section lake-detail-rules" aria-labelledby={`lake-detail-rules-${details.lakeId}`}>
      <div className="section-heading">
        <h3 id={`lake-detail-rules-${details.lakeId}`}>Amtliche Detailregeln</h3>
        <span>{details.checkedAt}</span>
      </div>

      <div className={`lake-rule-status ${details.coverage}`}>
        <CoverageIcon size={18} aria-hidden="true" />
        <div>
          <strong>{COVERAGE_LABELS[details.coverage]}</strong>
          <span>{details.jurisdictionLabel}</span>
        </div>
      </div>

      <p className="lake-detail-summary">{details.summary}</p>

      <div className="lake-detail-section-list">
        {details.sections.map((section) => (
          <section key={section.id} className={`lake-detail-section ${section.tone ?? "info"}`}>
            <h4>
              {section.tone === "ban" ? <ShieldAlert size={16} aria-hidden="true" /> : null}
              {section.tone === "warning" ? <AlertTriangle size={16} aria-hidden="true" /> : null}
              <span>{section.title}</span>
            </h4>
            <dl>
              {section.items.map((item) => (
                <div key={`${section.id}-${item.label}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="lake-detail-sources" aria-label="Quellen der Detailregeln">
        {sources.map((source) => (
          <SourcePill key={source.id} source={source} />
        ))}
      </div>
    </section>
  );
}

function SourcePill({ source }: { source: Source }) {
  if (!source.url) {
    return <span>{source.title}</span>;
  }

  return (
    <a href={source.url} target="_blank" rel="noreferrer">
      <span>{source.title}</span>
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}
