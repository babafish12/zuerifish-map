import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChevronDown, X } from "lucide-react";
import { FishCard } from "./FishCard";
import { GearRules } from "./GearRules";
import { SourceList } from "./SourceList";
import { fishProfiles, getGearRulesForLake, getRulesForLake, getSources } from "../lib/data";
import type { FishProfile, FishRule, GearMode, Lake, LakeId } from "../types";

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

export function LakePanel({ lake, onClose }: LakePanelProps) {
  const [mode, setMode] = useState<GearMode>("withoutPatent");
  const [showMoreFish, setShowMoreFish] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fishRules = useMemo(() => getRulesForLake(lake.id), [lake.id]);
  const gearRules = useMemo(() => getGearRulesForLake(lake.id), [lake.id]);
  const additionalFishProfiles = useMemo(() => getAdditionalFishProfilesForLake(lake.id, fishRules), [fishRules, lake.id]);

  useEffect(() => {
    setShowMoreFish(false);
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
        <div className="lake-header-image" aria-hidden="true">
          <img src={lake.image.src} alt="" />
        </div>
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

      <section className="panel-section" aria-labelledby="fish-title">
        <div className="section-heading">
          <h3 id="fish-title">Fischarten</h3>
          <span>{fishRules.length} wichtige Regeln</span>
        </div>
        <div className="fish-list">
          {fishRules.map((rule) => (
            <FishCard key={`${rule.lakeId}-${rule.speciesId}`} rule={rule} />
          ))}
        </div>
      </section>

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
                    <small>{profile.occurrence[lake.id]}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <GearRules gearRules={gearRules} selectedMode={mode} onModeChange={setMode} />

      <SourceList sources={getSources(OFFICIAL_SOURCE_IDS)} />
    </aside>
  );
}

function getAdditionalFishProfilesForLake(lakeId: LakeId, fishRules: FishRule[]): FishProfile[] {
  const importantProfileIds = new Set(fishRules.flatMap((rule) => RULE_PROFILE_IDS_BY_SPECIES_ID[rule.speciesId] ?? [rule.speciesId]));

  return fishProfiles
    .filter((profile) => !importantProfileIds.has(profile.id))
    .filter((profile) => isConfirmedLakeOccurrence(profile.occurrence[lakeId]));
}

function isConfirmedLakeOccurrence(value: string): boolean {
  const normalized = value.toLowerCase();

  if (normalized.includes("nicht bestätigt") || normalized.includes("historisch") || normalized.includes("nicht separat")) {
    return false;
  }

  return normalized.includes("ja") || normalized.includes("selten") || normalized.includes("geschützt");
}
