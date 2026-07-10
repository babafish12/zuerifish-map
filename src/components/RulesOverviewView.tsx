import { ChevronDown, ExternalLink, MapPinned, Search, ShieldAlert, Waves, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PageIntro } from "./PageIntro";
import {
  findGearRulesForLake,
  fishingRestrictionZones,
  getLakeDetailRulesForLake,
  getRulesForLake,
  getSources,
  getSpecies,
  lakes,
  sources
} from "../lib/data";
import { formatDailyLimit, formatMinSize, statusHint } from "../lib/formatRules";
import { getRestrictionPeriodStatus } from "../lib/restrictionPeriodStatus";
import { getFishStatus } from "../lib/seasonStatus";
import type { FishRule, GearMode, GearRulesByLake, Lake, LakeDetailRules, LakeId, Source } from "../types";

const RULE_SOURCE_IDS = [
  "zh-fischerei-page",
  "zh-angelfischerei-auszug-2026",
  "zh-fanglimiten-2026",
  "zh-freiangel",
  "zh-aeschenfangverbot-2026"
];
const GEAR_MODES: GearMode[] = ["withoutPatent", "shorePatent", "stationaryBoat", "trolling"];
const GEAR_MODE_LABELS: Record<GearMode, string> = {
  withoutPatent: "Ohne Patent",
  shorePatent: "Uferpatent",
  stationaryBoat: "Boot / stehend",
  trolling: "Schleppangeln"
};

type LakeFilter = "all" | "zurich" | "detailed" | "cross-border";

const LAKE_FILTERS: Array<{ id: LakeFilter; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "zurich", label: "Kanton Zürich" },
  { id: "detailed", label: "Mit Detailregeln" },
  { id: "cross-border", label: "Grenzseen" }
];

function normalizeSearchValue(value: string) {
  return value
    .toLocaleLowerCase("de-CH")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchesLakeFilter(lake: Lake, filter: LakeFilter) {
  if (filter === "zurich") {
    return lake.canton.includes("Zürich");
  }

  if (filter === "detailed") {
    return getRulesForLake(lake.id).length > 0 || getLakeDetailRulesForLake(lake.id) !== null;
  }

  if (filter === "cross-border") {
    return ["Deutschland", "Frankreich", "Italien", "Österreich"].some((country) => lake.canton.includes(country));
  }

  return true;
}

export function RulesOverviewView({ onShowLake }: { onShowLake: (lakeId: LakeId) => void }) {
  const [expandedLakeId, setExpandedLakeId] = useState<LakeId | null>(null);
  const [query, setQuery] = useState("");
  const [lakeFilter, setLakeFilter] = useState<LakeFilter>("all");
  const dataSources = sources.filter((source) => source.id === "swiss-lakes-wikipedia" || source.id === "wikidata-lake-coordinates");
  const filteredLakes = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    return lakes.filter((lake) => {
      const matchesQuery = normalizedQuery.length === 0 || normalizeSearchValue(`${lake.name} ${lake.canton}`).includes(normalizedQuery);
      return matchesQuery && matchesLakeFilter(lake, lakeFilter);
    });
  }, [lakeFilter, query]);

  return (
    <main id="app-main" className="app-page rules-page lakes-page" aria-labelledby="rules-overview-title">
      <PageIntro
        id="rules-overview-title"
        eyebrow="Gewässerverzeichnis"
        title="Seen"
        description="See wählen, Regeln prüfen und mit einem Griff zur richtigen Stelle auf der Karte springen."
        stat={`${lakes.length} Seen`}
      />

      <section className="page-tools" aria-label="Seen filtern">
        <div className="search-control">
          <Search size={19} aria-hidden="true" />
          <label className="sr-only" htmlFor="lake-directory-search">
            See oder Region suchen
          </label>
          <input
            id="lake-directory-search"
            type="search"
            value={query}
            placeholder="See oder Region"
            aria-label="See oder Region suchen"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          {query ? (
            <button type="button" aria-label="Seesuche leeren" onClick={() => setQuery("")}>
              <X size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="filter-chip-row" role="group" aria-label="Seengruppe filtern">
          {LAKE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={lakeFilter === filter.id ? "filter-chip active" : "filter-chip"}
              aria-pressed={lakeFilter === filter.id}
              onClick={() => setLakeFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <p className="filter-result" aria-live="polite">
          {filteredLakes.length === lakes.length ? "Alle Seen sichtbar" : `${filteredLakes.length} von ${lakes.length} Seen`}
        </p>
      </section>

      {filteredLakes.length > 0 ? (
        <section className="lake-directory-list" aria-label="Schweizer Seen">
          {filteredLakes.map((lake) => (
            <LakeDirectoryCard
              key={lake.id}
              lake={lake}
              isExpanded={expandedLakeId === lake.id}
              onShowOnMap={() => onShowLake(lake.id)}
              onToggle={() => setExpandedLakeId((currentId) => (currentId === lake.id ? null : lake.id))}
            />
          ))}
        </section>
      ) : (
        <section className="search-empty-state" aria-live="polite">
          <Search size={24} aria-hidden="true" />
          <h3>Kein See gefunden</h3>
          <p>Versuche einen anderen Namen, Kanton oder Filter.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setLakeFilter("all");
            }}
          >
            Filter zurücksetzen
          </button>
        </section>
      )}

      <section className="rules-practice-grid" aria-label="Kontrollpunkte vor dem Fischen">
        <article>
          <ShieldAlert size={22} aria-hidden="true" />
          <h3>Vor dem Auswerfen prüfen</h3>
          <p>Patent, Gewässerabschnitt, Schonzeit, Mindestmass, Tageslimite, lokale Sperrzone und Uferregeln gehören zusammen.</p>
        </article>
        <article>
          <Waves size={22} aria-hidden="true" />
          <h3>Datenstand</h3>
          <p>Schweizer Seen unter 2 km² sind ausgeblendet. Für jeden gelisteten See sind amtliche Regelquellen oder ein geklärter Sonderstatus hinterlegt.</p>
        </article>
      </section>

      <section className="rules-source-panel" aria-labelledby="rules-source-title">
        <div className="section-heading">
          <h3 id="rules-source-title">Datenquellen</h3>
          <span>{dataSources.length} Grundlagen</span>
        </div>
        <div className="rules-source-list">
          {dataSources.map((source) => (
            <SourceLink key={source.id} source={source} />
          ))}
        </div>
      </section>
    </main>
  );
}

function LakeDirectoryCard({
  lake,
  isExpanded,
  onShowOnMap,
  onToggle
}: {
  lake: Lake;
  isExpanded: boolean;
  onShowOnMap: () => void;
  onToggle: () => void;
}) {
  const fishRules = getRulesForLake(lake.id);
  const lakeDetails = getLakeDetailRulesForLake(lake.id);
  const gearRule = findGearRulesForLake(lake.id);
  const restrictions = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === lake.id);
  const activeRestrictions = restrictions.filter((feature) => getRestrictionPeriodStatus(feature.properties.period).isActive);
  const lakeSources = getLakeSources(lake, fishRules);
  const licenseSources = getSources(lake.licenseSourceIds ?? []);
  const detailId = `lake-directory-${lake.id}`;

  return (
    <article className={isExpanded ? "rules-lake-card lake-directory-card expanded" : "rules-lake-card lake-directory-card"}>
      <button
        type="button"
        className="lake-directory-summary"
        aria-expanded={isExpanded}
        aria-controls={detailId}
        aria-label={`${lake.name} Seeinfos ${isExpanded ? "schliessen" : "öffnen"}`}
        onClick={onToggle}
      >
        <span className="lake-directory-title">
          <strong>{lake.name}</strong>
          <span>{lake.canton}</span>
        </span>
        <span className="lake-directory-meta">
          {lake.areaKm2 ? `${formatMetric(lake.areaKm2)} km²` : "See"}
          {fishRules.length > 0 ? ` · ${fishRules.length} Detailregeln` : " · Patent prüfen"}
        </span>
        <ChevronDown className="profile-chevron" size={18} aria-hidden="true" />
      </button>

      {isExpanded ? (
        <div className="lake-directory-detail" id={detailId}>
          <div className="lake-directory-actions">
            <button type="button" className="lake-map-action" onClick={onShowOnMap}>
              <MapPinned size={18} aria-hidden="true" />
              Auf Karte zeigen
            </button>
          </div>

          <dl className="rules-stat-row lake-directory-facts">
            {getLakeFacts(lake, fishRules.length, restrictions.length, activeRestrictions.length).map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          {fishRules.length > 0 ? <FishRuleSummary fishRules={fishRules} /> : lakeDetails ? null : <RuleCheckNotice />}

          {lakeDetails ? <LakeDetailSummary details={lakeDetails} /> : null}

          {gearRule ? <GearRuleSummary gearRule={gearRule} /> : null}

          <section className="rules-card-section">
            <h4>Patente / Lizenzen kaufen</h4>
            <div className="rules-mini-sources">
              {licenseSources.length > 0 ? (
                licenseSources.map((source) => <SourceLink key={source.id} source={source} compact />)
              ) : (
                <p>Kantonale Patentstelle über die verlinkten Quellen prüfen.</p>
              )}
            </div>
          </section>

          {lakeSources.length > 0 ? (
            <section className="rules-card-section">
              <h4>Vorschriften</h4>
              <div className="rules-mini-sources">
                {lakeSources.map((source) => (
                  <SourceLink key={source.id} source={source} compact />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function GearRuleSummary({ gearRule }: { gearRule: GearRulesByLake }) {
  return (
    <section className="rules-card-section lake-directory-gear-rules">
      <h4>Patent und Geräte</h4>
      <div className="rules-gear-mode-list">
        {GEAR_MODES.map((mode) => (
          <article key={mode} className="rules-gear-mode-card">
            <strong>{GEAR_MODE_LABELS[mode]}</strong>
            <span>{gearRule[mode]}</span>
            <dl>
              {gearRule.modeDetails[mode].slice(0, 3).map((rule) => (
                <div key={`${mode}-${rule.label}`}>
                  <dt>{rule.label}</dt>
                  <dd>{rule.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <p>{gearRule.note}</p>
    </section>
  );
}

function FishRuleSummary({ fishRules }: { fishRules: FishRule[] }) {
  return (
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
  );
}

function LakeDetailSummary({ details }: { details: LakeDetailRules }) {
  const sources = getSources(details.sourceIds).filter((source) => source.type === "rules");
  const importantItems = details.sections.flatMap((section) => section.items).slice(0, 5);

  return (
    <section className={`rules-card-section lake-directory-detail-rules ${details.coverage}`}>
      <h4>Amtliche Detailregeln</h4>
      <p>{details.summary}</p>
      <div className="rules-species-list">
        {importantItems.map((item) => (
          <div key={`${details.lakeId}-${item.label}`}>
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
      <div className="rules-mini-sources">
        {sources.slice(0, 4).map((source) => (
          <SourceLink key={source.id} source={source} compact />
        ))}
      </div>
    </section>
  );
}

function RuleCheckNotice() {
  return (
    <section className="rules-card-section lake-rule-note">
      <h4>Regeln prüfen</h4>
      <p>Für diesen See sind noch keine belastbaren App-Detailregeln hinterlegt. Prüfe vor Ort die kantonalen Patent-, Schonzeit- und Fanglimiten-Seiten.</p>
    </section>
  );
}

function getLakeFacts(lake: Lake, ruleCount: number, restrictionCount: number, activeRestrictionCount: number) {
  return [
    { label: "Region", value: lake.canton },
    ...(lake.areaKm2 ? [{ label: "Fläche", value: `${formatMetric(lake.areaKm2)} km²` }] : []),
    ...(lake.elevationM ? [{ label: "Höhe", value: `${formatMetric(lake.elevationM)} m` }] : []),
    ...(lake.maxDepthM ? [{ label: "Max. Tiefe", value: `${formatMetric(lake.maxDepthM)} m` }] : []),
    { label: "Detailregeln", value: ruleCount > 0 ? String(ruleCount) : "prüfen" },
    { label: "Sperrzonen", value: restrictionCount > 0 ? `${activeRestrictionCount}/${restrictionCount}` : "nicht erfasst" }
  ];
}

function formatMetric(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function getLakeSources(lake: Lake, fishRules: FishRule[]): Source[] {
  const licenseIds = new Set(lake.licenseSourceIds ?? []);
  const restrictionIds = fishingRestrictionZones.features
    .filter((feature) => feature.properties.lakeId === lake.id)
    .flatMap((feature) => feature.properties.sourceIds);
  const ids = Array.from(
    new Set([
      ...(lake.detailLevel === "full" ? RULE_SOURCE_IDS : []),
      ...lake.sourceIds.filter((sourceId) => !licenseIds.has(sourceId)),
      ...fishRules.flatMap((rule) => rule.sourceIds),
      ...restrictionIds
    ])
  );

  return getSources(ids).filter((source) => source.type === "rules" && !licenseIds.has(source.id));
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
