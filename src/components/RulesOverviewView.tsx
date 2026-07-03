import { ExternalLink, ShieldAlert, Waves } from "lucide-react";
import { fishingRestrictionZones, gearRules, getGearRulesForLake, getRulesForLake, getSources, getSpecies, lakes, sources } from "../lib/data";
import { formatDailyLimit, formatMinSize, statusHint } from "../lib/formatRules";
import { getLakeInsight } from "../lib/lakeInsights";
import { getRestrictionPeriodStatus } from "../lib/restrictionPeriodStatus";
import { getFishStatus } from "../lib/seasonStatus";
import type { Lake, LakeId, Source } from "../types";

const RULE_SOURCE_IDS = [
  "zh-fischerei-page",
  "zh-angelfischerei-auszug-2026",
  "zh-fanglimiten-2026",
  "zh-freiangel",
  "zh-aeschenfangverbot-2026"
];

export function RulesOverviewView() {
  const ruleSources = sources.filter((source) => source.type === "rules" || source.type === "map");

  return (
    <main className="app-page rules-page" aria-labelledby="rules-overview-title">
      <header className="page-heading rules-heading">
        <div>
          <h2 id="rules-overview-title">Regeln</h2>
          <p>Die wichtigsten Unterschiede der drei Seen: Entnahme, Patent/Freiangeln, Sperrzonen und offizielle Quellen.</p>
        </div>
        <strong>Datenstand 2026</strong>
      </header>

      <section className="rules-lake-grid" aria-label="Regeln nach See">
        {lakes.map((lake) => (
          <RulesLakeCard key={lake.id} lake={lake} />
        ))}
      </section>

      <section className="rules-practice-grid" aria-label="Kontrollpunkte vor dem Fischen">
        <article>
          <ShieldAlert size={22} aria-hidden="true" />
          <h3>Vor dem Auswerfen prüfen</h3>
          <p>Mindestmass, Schonzeit, Tageslimite, lokale Sperrzone und Patentart gehören zusammen. Ein offener Fisch ist nicht automatisch an jedem Uferabschnitt erlaubt.</p>
        </article>
        <article>
          <Waves size={22} aria-hidden="true" />
          <h3>Freiangelrecht</h3>
          <p>{gearRules.freeFishing.map((rule) => `${rule.label}: ${rule.value}`).join(" ")}</p>
        </article>
      </section>

      <section className="rules-source-panel" aria-labelledby="rules-source-title">
        <div className="section-heading">
          <h3 id="rules-source-title">Quellen und Datenstand</h3>
          <span>{ruleSources.length} Regel- und Kartengrundlagen</span>
        </div>
        <div className="rules-source-list">
          {ruleSources.map((source) => (
            <SourceLink key={source.id} source={source} />
          ))}
        </div>
      </section>
    </main>
  );
}

function RulesLakeCard({ lake }: { lake: Lake }) {
  const insight = getLakeInsight(lake.id);
  const fishRules = getRulesForLake(lake.id);
  const gearRule = getGearRulesForLake(lake.id);
  const restrictions = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === lake.id);
  const activeRestrictions = restrictions.filter((feature) => getRestrictionPeriodStatus(feature.properties.period).isActive);
  const sourcesForLake = getLakeSources(lake.id);

  return (
    <article className="rules-lake-card">
      <header>
        <img src={lake.image.src} alt="" loading="lazy" />
        <div>
          <span>Kanton {lake.canton}</span>
          <h3>{lake.name}</h3>
          <p>{lake.summary}</p>
        </div>
      </header>

      <dl className="rules-stat-row">
        <div>
          <dt>Regelarten</dt>
          <dd>{insight.ruleCount}</dd>
        </div>
        <div>
          <dt>Bestätigte Fische</dt>
          <dd>{insight.confirmedFishCount}</dd>
        </div>
        <div>
          <dt>Sperrzonen</dt>
          <dd>
            {insight.activeRestrictionCount}/{insight.restrictionCount}
          </dd>
        </div>
      </dl>

      <section className="rules-card-section">
        <h4>Entnahme heute</h4>
        <div className="rules-species-list">
          {fishRules.map((rule) => {
            const species = getSpecies(rule.speciesId);
            const status = getFishStatus(rule);

            return (
              <div key={`${rule.lakeId}-${rule.speciesId}`}>
                <strong>{species.name}</strong>
                <span>{statusHint(status)}</span>
                <small>
                  {formatMinSize(rule.minSizeCm)} · {rule.closedSeason?.label ?? "keine Schonzeit"} · {formatDailyLimit(rule.dailyLimit)}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rules-card-section">
        <h4>Patent und Zonen</h4>
        <p>{gearRule.withoutPatent}: {gearRule.modeDetails.withoutPatent[0]?.value}</p>
        <p>{activeRestrictions.length > 0 ? `${activeRestrictions.length} Sperrzonen sind heute aktiv.` : "Heute sind keine saisonalen Sperrzonen aktiv; ganzjährige Zonen bleiben trotzdem massgeblich."}</p>
      </section>

      <section className="rules-card-section">
        <h4>Direkte Quellen</h4>
        <div className="rules-mini-sources">
          {sourcesForLake.slice(0, 4).map((source) => (
            <SourceLink key={source.id} source={source} compact />
          ))}
        </div>
      </section>
    </article>
  );
}

function getLakeSources(lakeId: LakeId): Source[] {
  const ruleIds = getRulesForLake(lakeId).flatMap((rule) => rule.sourceIds);
  const restrictionIds = fishingRestrictionZones.features
    .filter((feature) => feature.properties.lakeId === lakeId)
    .flatMap((feature) => feature.properties.sourceIds);
  const ids = Array.from(new Set([...RULE_SOURCE_IDS, ...ruleIds, ...restrictionIds]));

  return getSources(ids).filter((source) => source.type === "rules" || source.type === "map");
}

function SourceLink({ source, compact = false }: { source: Source; compact?: boolean }) {
  const body = (
    <>
      <strong>{source.title}</strong>
      {!compact ? <span>{source.publisher} · {source.date}</span> : null}
    </>
  );

  if (!source.url) {
    return <div className="rules-source-link">{body}</div>;
  }

  return (
    <a className="rules-source-link" href={source.url} target="_blank" rel="noreferrer">
      <span>{body}</span>
      <ExternalLink size={15} aria-hidden="true" />
    </a>
  );
}
