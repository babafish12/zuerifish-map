import { AlertTriangle } from "lucide-react";
import { getSpecies } from "../lib/data";
import { formatDailyLimit, formatMinSize, statusHint, statusLabel } from "../lib/formatRules";
import { getFishStatus } from "../lib/seasonStatus";
import type { FishRule } from "../types";

interface FishCardProps {
  rule: FishRule;
}

export function FishCard({ rule }: FishCardProps) {
  const species = getSpecies(rule.speciesId);
  const status = getFishStatus(rule);
  const closedSeasonText = rule.protectedAllYear ? "ganzjährig geschützt" : rule.closedSeason?.label ?? "keine Schonzeit";

  return (
    <article className="fish-card">
      <div className="fish-image-wrap">
        <img src={species.image.src} alt={species.image.alt} loading="lazy" />
      </div>
      <div className="fish-card-body">
        <div className="fish-card-title">
          <div>
            <h4>{species.name}</h4>
            {species.scientificName ? <p>{species.scientificName}</p> : null}
          </div>
          <span className={`status-chip ${status}`}>
            {status === "unclear" ? <AlertTriangle size={14} aria-hidden="true" /> : null}
            {statusLabel(status)}
          </span>
        </div>
        <dl className="rule-list">
          <div>
            <dt>Mindestmass</dt>
            <dd>{formatMinSize(rule.minSizeCm)}</dd>
          </div>
          <div>
            <dt>Schonzeit</dt>
            <dd>{closedSeasonText}</dd>
          </div>
          <div>
            <dt>Tageslimite</dt>
            <dd>{formatDailyLimit(rule.dailyLimit)}</dd>
          </div>
        </dl>
        <p className="status-note">
          {statusHint(status)}. {rule.hint}
          {rule.localRestrictionWarning ? ` ${rule.localRestrictionWarning}` : ""}
        </p>
      </div>
    </article>
  );
}
