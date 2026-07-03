import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Fish, Map, ScanSearch, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FishProfilesView } from "./components/FishProfilesView";
import { FishRecognizerView } from "./components/FishRecognizerView";
import { LakePanel } from "./components/LakePanel";
import { MapView } from "./components/MapView";
import { RulesOverviewView } from "./components/RulesOverviewView";
import { getLake, lakes } from "./lib/data";
import { getLakeInsight } from "./lib/lakeInsights";
import type { LakeId } from "./types";

type AppTab = "map" | "fish" | "recognizer" | "rules";

const NAV_ITEMS: { id: AppTab; label: string; icon: LucideIcon }[] = [
  { id: "map", label: "Karte", icon: Map },
  { id: "fish", label: "Fische", icon: Fish },
  { id: "recognizer", label: "Fischerkenner", icon: ScanSearch },
  { id: "rules", label: "Regeln", icon: BookOpenCheck }
];

const LAKE_SELECTION_STORAGE_KEY = "zuerifish:selected-lake";
const LAKE_IDS: readonly LakeId[] = ["zuerichsee", "greifensee", "pfaeffikersee"];

function isLakeId(value: unknown): value is LakeId {
  return typeof value === "string" && LAKE_IDS.includes(value as LakeId);
}

function readStoredLakeSelection(): LakeId | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedLakeId = window.localStorage.getItem(LAKE_SELECTION_STORAGE_KEY);
    return isLakeId(storedLakeId) ? storedLakeId : null;
  } catch {
    return null;
  }
}

function writeStoredLakeSelection(lakeId: LakeId | null) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (lakeId) {
      window.localStorage.setItem(LAKE_SELECTION_STORAGE_KEY, lakeId);
      return;
    }

    window.localStorage.removeItem(LAKE_SELECTION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted contexts. Selection persistence is optional.
  }
}

function App() {
  const [selectedLakeId, setSelectedLakeId] = useState<LakeId | null>(readStoredLakeSelection);
  const [activeTab, setActiveTab] = useState<AppTab>("map");

  const selectedLake = useMemo(() => {
    return selectedLakeId ? getLake(selectedLakeId) : null;
  }, [selectedLakeId]);

  useEffect(() => {
    writeStoredLakeSelection(selectedLakeId);
  }, [selectedLakeId]);

  const closePanel = useCallback(() => {
    setSelectedLakeId(null);
  }, []);

  const selectTab = useCallback(
    (tab: AppTab) => {
      setActiveTab(tab);
      window.scrollTo({ top: 0 });

      if (tab !== "map") {
        closePanel();
      }
    },
    [closePanel]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePanel]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Fish size={22} />
          </span>
          <div>
            <h1>ZüriFish Map</h1>
            <p>Fischerei-Regeln für Zürichsee, Greifensee und Pfäffikersee</p>
          </div>
        </div>
        <div className="trust-note">
          <ShieldAlert size={18} aria-hidden="true" />
          <span className="trust-full">Orientierungshilfe, nicht rechtsverbindlich</span>
          <span className="trust-short">Hinweis</span>
        </div>
      </header>

      {activeTab === "map" ? (
        <main className="map-stage" aria-label="Interaktive Fischerei-Karte">
          <MapView selectedLakeId={selectedLakeId} onSelectLake={setSelectedLakeId} />
          <LakeQuickCards selectedLakeId={selectedLakeId} onSelectLake={setSelectedLakeId} />
        </main>
      ) : null}

      {activeTab === "fish" ? <FishProfilesView /> : null}
      {activeTab === "recognizer" ? <FishRecognizerView /> : null}
      {activeTab === "rules" ? <RulesOverviewView /> : null}

      {selectedLake ? (
        <div className="panel-layer" onMouseDown={closePanel} aria-label="Detailpanel Ebene">
          <LakePanel lake={selectedLake} onClose={closePanel} />
        </div>
      ) : null}

      <nav className="bottom-tab-bar" aria-label="Hauptnavigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? "bottom-tab active" : "bottom-tab"}
              aria-current={isActive ? "page" : undefined}
              onClick={() => selectTab(item.id)}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function LakeQuickCards({
  selectedLakeId,
  onSelectLake
}: {
  selectedLakeId: LakeId | null;
  onSelectLake: (lakeId: LakeId) => void;
}) {
  return (
    <section className="lake-quick-cards" aria-label="Seen und Kernzahlen">
      <div className="lake-quick-heading">
        <strong>See wählen</strong>
        <span>Regeln, Fische und Sperrzonen</span>
      </div>
      <div className="lake-quick-list">
        {lakes.map((lake) => {
          const insight = getLakeInsight(lake.id);
          const isSelected = selectedLakeId === lake.id;

          return (
            <button
              key={lake.id}
              type="button"
              className={isSelected ? "lake-quick-card active" : "lake-quick-card"}
              aria-pressed={isSelected}
              aria-label={`${lake.name} Regeln öffnen`}
              onClick={() => onSelectLake(lake.id)}
            >
              <span className="lake-quick-name">{lake.name}</span>
              <span className="lake-quick-summary">{lake.summary}</span>
              <span className="lake-quick-stats" aria-hidden="true">
                <span>{insight.ruleCount} Regeln</span>
                <span>{insight.confirmedFishCount} Arten</span>
                <span>
                  {insight.activeRestrictionCount}/{insight.restrictionCount} Zonen aktiv
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default App;
