import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChevronDown, X } from "lucide-react";
import { FishCard } from "./FishCard";
import { GearRules } from "./GearRules";
import { LakeRuleDetails } from "./LakeRuleDetails";
import { SourceList } from "./SourceList";
import { findGearRulesForLake, fishingRestrictionZones, fishProfiles, getLakeDetailRulesForLake, getRulesForLake, getSources } from "../lib/data";
import { isConfirmedLakeOccurrence } from "../lib/lakeInsights";
import type { FishProfile, FishRule, GearMode, Lake, LakeId, Source } from "../types";

interface LakePanelProps {
  lake: Lake;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const OFFICIAL_SOURCE_IDS = [
  "zh-fischerei-page",
  "zh-angelfischerei-auszug-2026",
  "zh-fanglimiten-2026",
  "zh-freiangel",
  "zh-aeschenfangverbot-2026"
];
const RULE_PROFILE_IDS_BY_SPECIES_ID: Record<string, string[]> = {
  aesche: ["aesche"],
  egli: ["egli"],
  felchenartige: ["felchen"],
  forelle: ["bachforelle", "seeforelle"],
  hecht: ["hecht"],
  seesaibling: ["seesaiblinge"],
  zander: ["zander"]
};

const DETAIL_RULE_PROFILE_MATCHERS: Array<{ profileId: string; terms: string[] }> = [
  { profileId: "seeforelle", terms: ["seeforelle", "lake trout"] },
  { profileId: "seesaiblinge", terms: ["seesaibling", "saibling", "salmerino", "roetel", "rötel"] },
  { profileId: "felchen", terms: ["felchen", "felchenartige", "coregone", "lavarello", "bondella", "albeli", "balchen", "gangfisch"] },
  { profileId: "hecht", terms: ["hecht", "luccio"] },
  { profileId: "zander", terms: ["zander"] },
  { profileId: "egli", terms: ["egli", "barsch", "pesce persico"] },
  { profileId: "aesche", terms: ["aesche", "äsche"] },
  { profileId: "karpfen", terms: ["karpfen"] },
  { profileId: "schleie", terms: ["schleie", "tinca"] },
  { profileId: "wels", terms: ["wels"] },
  { profileId: "aal", terms: ["aal"] },
  { profileId: "bachforelle", terms: ["forellen", "forelle", "trota"] }
];

type LakeDetailFishPicture = {
  profile: FishProfile;
  detail: string;
};

export function LakePanel({ lake, onClose }: LakePanelProps) {
  const [mode, setMode] = useState<GearMode>("withoutPatent");
  const [showMoreFish, setShowMoreFish] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fishRules = useMemo(() => getRulesForLake(lake.id), [lake.id]);
  const lakeDetailRules = useMemo(() => getLakeDetailRulesForLake(lake.id), [lake.id]);
  const gearRules = useMemo(() => findGearRulesForLake(lake.id), [lake.id]);
  const additionalFishProfiles = useMemo(() => getAdditionalFishProfilesForLake(lake.id, fishRules), [fishRules, lake.id]);
  const detailFishPictures = useMemo(() => getDetailFishPictures(lakeDetailRules, fishRules), [fishRules, lakeDetailRules]);
  const lakePanelSources = useMemo(() => getLakePanelSources(lake, fishRules, lakeDetailRules?.sourceIds ?? []), [fishRules, lake, lakeDetailRules]);

  useEffect(() => {
    setShowMoreFish(false);
    setMode("withoutPatent");
    closeButtonRef.current?.focus();
  }, [lake.id]);

  function handlePanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && (activeElement === firstElement || activeElement === panel || !panel.contains(activeElement))) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && (activeElement === lastElement || activeElement === panel || !panel.contains(activeElement))) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <aside
      className="lake-panel"
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${lake.name} Detailregeln`}
      onKeyDown={handlePanelKeyDown}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <header className="panel-header">
        {lake.image ? (
          <div className="lake-header-image" aria-hidden="true">
            <img src={lake.image.src} alt="" />
          </div>
        ) : (
          <div className="lake-header-image lake-header-fallback" aria-hidden="true" />
        )}
        <div>
          <span className="panel-kicker">Kanton {lake.canton}</span>
          <h2>{lake.name}</h2>
          <p>{lake.summary}</p>
        </div>
        <button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label="Panel schliessen">
          <X size={20} />
        </button>
      </header>

      <div className="badge-row" aria-label="See-Hinweise">
        {lake.badges.map((badge) => (
          <span key={badge} className="lake-badge">
            {badge}
          </span>
        ))}
      </div>

      <section className="panel-section lake-facts" aria-labelledby="lake-facts-title">
        <div className="section-heading">
          <h3 id="lake-facts-title">Seeinformationen</h3>
          <span>{lake.detailLevel === "full" ? "Detaildaten" : "Übersicht"}</span>
        </div>
        <dl className="lake-fact-grid">
          {getLakeFacts(lake).map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {gearRules ? <GearRules gearRules={gearRules} selectedMode={mode} onModeChange={setMode} /> : null}

      {fishRules.length > 0 ? (
        <section className="panel-section" aria-labelledby="fish-title">
          <div className="section-heading">
            <h3 id="fish-title">Fischarten und Schonzeiten</h3>
            <span>{fishRules.length} wichtige Regeln</span>
          </div>
          <div className="fish-list">
            {fishRules.map((rule) => (
              <FishCard key={`${rule.lakeId}-${rule.speciesId}`} rule={rule} />
            ))}
          </div>
        </section>
      ) : lakeDetailRules ? null : (
        <section className="panel-section lake-rule-note" aria-labelledby="lake-rule-note-title">
          <div className="section-heading">
            <h3 id="lake-rule-note-title">Regeln prüfen</h3>
            <span>kantonal</span>
          </div>
          <p>
            Für diesen See sind in der App noch keine belastbaren Fischarten-, Schonzeit- und Fanglimiten-Detailregeln hinterlegt.
            Prüfe vor dem Fischen die verlinkten kantonalen Patent- und Vorschriftenseiten.
          </p>
        </section>
      )}

      {lakeDetailRules ? <LakeRuleDetails details={lakeDetailRules} /> : null}

      {detailFishPictures.length > 0 ? (
        <section className="panel-section lake-rule-fish-pictures" aria-labelledby="lake-rule-fish-pictures-title">
          <div className="section-heading">
            <h3 id="lake-rule-fish-pictures-title">Fischarten im Steckbrief</h3>
            <span>{detailFishPictures.length} mit Bild</span>
          </div>
          <div className="lake-more-fish-list lake-rule-fish-list">
            {detailFishPictures.map(({ profile, detail }) => (
              <article key={profile.id} className="lake-more-fish-item lake-rule-fish-item">
                <img src={profile.image.src} alt={profile.image.alt} loading="lazy" />
                <div>
                  <strong>{profile.name}</strong>
                  <span>{profile.category}</span>
                  <small>{detail}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {additionalFishProfiles.length > 0 ? (
        <section className="panel-section lake-more-fish" aria-labelledby="lake-more-fish-title">
          <button
            type="button"
            className="lake-more-fish-toggle"
            aria-expanded={showMoreFish}
            aria-controls="lake-more-fish-list"
            onClick={() => setShowMoreFish((current) => !current)}
          >
            <span>
              <strong id="lake-more-fish-title">Weitere Fische in diesem See</strong>
              <small>{additionalFishProfiles.length} Arten aus den Steckbriefen</small>
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>

          {showMoreFish ? (
            <div className="lake-more-fish-list" id="lake-more-fish-list">
              {additionalFishProfiles.map((profile) => (
                <article key={profile.id} className="lake-more-fish-item">
                  <img src={profile.image.src} alt="" loading="lazy" />
                  <div>
                    <strong>{profile.name}</strong>
                    <span>{profile.category}</span>
                    <small>{profile.occurrence[lake.id] ?? "nicht erfasst"}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <SourceList sources={lakePanelSources} title="Patent & Vorschriften" meta={`${lakePanelSources.length} Links`} />
    </aside>
  );
}

function getAdditionalFishProfilesForLake(lakeId: LakeId, fishRules: FishRule[]): FishProfile[] {
  const importantProfileIds = new Set(fishRules.flatMap((rule) => RULE_PROFILE_IDS_BY_SPECIES_ID[rule.speciesId] ?? [rule.speciesId]));

  return fishProfiles
    .filter((profile) => !importantProfileIds.has(profile.id))
    .filter((profile) => isConfirmedLakeOccurrence(profile.occurrence[lakeId]));
}

function getDetailFishPictures(lakeDetailRules: ReturnType<typeof getLakeDetailRulesForLake>, fishRules: FishRule[]): LakeDetailFishPicture[] {
  if (!lakeDetailRules || fishRules.length > 0) {
    return [];
  }

  const profilesById = new Map(fishProfiles.map((profile) => [profile.id, profile]));
  const seenProfileIds = new Set<string>();
  const pictures: LakeDetailFishPicture[] = [];

  lakeDetailRules.sections.forEach((section) => {
    section.items.forEach((item) => {
      const profileId = getProfileIdFromDetailRule(`${item.label} ${item.value}`);
      const profile = profileId ? profilesById.get(profileId) : null;

      if (!profile || seenProfileIds.has(profile.id)) {
        return;
      }

      seenProfileIds.add(profile.id);
      pictures.push({
        profile,
        detail: item.value
      });
    });
  });

  return pictures.slice(0, 8);
}

function getProfileIdFromDetailRule(text: string): string | null {
  const normalizedText = normalizeRuleText(text);
  const match = DETAIL_RULE_PROFILE_MATCHERS.find(({ terms }) => terms.some((term) => normalizedText.includes(normalizeRuleText(term))));
  return match?.profileId ?? null;
}

function normalizeRuleText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}

function getLakeFacts(lake: Lake): Array<{ label: string; value: string }> {
  return [
    { label: "Region", value: lake.canton },
    ...(lake.areaKm2 ? [{ label: "Fläche", value: `${formatMetric(lake.areaKm2)} km²` }] : []),
    ...(lake.elevationM ? [{ label: "Höhe", value: `${formatMetric(lake.elevationM)} m ü. M.` }] : []),
    ...(lake.maxDepthM ? [{ label: "Max. Tiefe", value: `${formatMetric(lake.maxDepthM)} m` }] : []),
    ...(lake.riverBasin ? [{ label: "Einzugsgebiet", value: lake.riverBasin }] : [])
  ];
}

function formatMetric(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function getLakePanelSources(lake: Lake, fishRules: FishRule[], lakeDetailSourceIds: string[]): Source[] {
  const restrictionSourceIds = fishingRestrictionZones.features
    .filter((feature) => feature.properties.lakeId === lake.id)
    .flatMap((feature) => feature.properties.sourceIds);
  const ids = Array.from(
    new Set([
      ...(lake.detailLevel === "full" ? OFFICIAL_SOURCE_IDS : []),
      ...lake.sourceIds,
      ...(lake.licenseSourceIds ?? []),
      ...fishRules.flatMap((rule) => rule.sourceIds),
      ...lakeDetailSourceIds,
      ...restrictionSourceIds
    ])
  );

  return getSources(ids).filter((source) => source.type === "rules");
}
