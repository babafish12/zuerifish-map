import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fish, Map, ScanSearch, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import zueriFishLogo from "./assets/brand/zuerifish-logo.png";
import { FishProfilesView } from "./components/FishProfilesView";
import { FishRecognizerView } from "./components/FishRecognizerView";
import { LakePanel } from "./components/LakePanel";
import { MapView } from "./components/MapView";
import { RulesOverviewView } from "./components/RulesOverviewView";
import { getLake, isKnownLakeId, lakes } from "./lib/data";
import type { LakeId } from "./types";

type AppTab = "map" | "fish" | "recognizer" | "rules";

const NAV_ITEMS: { id: AppTab; label: string; icon: LucideIcon }[] = [
  { id: "map", label: "Karte", icon: Map },
  { id: "fish", label: "Fische", icon: Fish },
  { id: "recognizer", label: "Fischerkenner", icon: ScanSearch },
  { id: "rules", label: "Seen", icon: Waves }
];

const LAKE_SELECTION_STORAGE_KEY = "zuerifish:selected-lake";

type AppHistoryState = {
  lakeId?: LakeId;
  tab?: AppTab;
};

function isAppTab(value: unknown): value is AppTab {
  return typeof value === "string" && NAV_ITEMS.some((item) => item.id === value);
}

function readHistoryState(): AppHistoryState {
  if (typeof window === "undefined" || typeof window.history.state !== "object" || window.history.state === null) {
    return {};
  }

  const state = window.history.state as Record<string, unknown>;
  return {
    lakeId: isKnownLakeId(state.lakeId) ? state.lakeId : undefined,
    tab: isAppTab(state.tab) ? state.tab : undefined
  };
}

function readActiveTab(): AppTab {
  if (typeof window === "undefined") {
    return "map";
  }

  const historyTab = readHistoryState().tab;

  if (historyTab) {
    return historyTab;
  }

  const hash = window.location.hash.replace(/^#/, "");
  return isAppTab(hash) ? hash : "map";
}

function readStoredLakeSelection(): LakeId | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedLakeId = window.localStorage.getItem(LAKE_SELECTION_STORAGE_KEY);
    return isKnownLakeId(storedLakeId) ? storedLakeId : null;
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
  const [selectedLakeId, setSelectedLakeId] = useState<LakeId | null>(() => readHistoryState().lakeId ?? readStoredLakeSelection());
  const [activeTab, setActiveTab] = useState<AppTab>(readActiveTab);
  const panelHistoryWasPushedRef = useRef(false);

  const selectedLake = useMemo(() => {
    return selectedLakeId ? getLake(selectedLakeId) : null;
  }, [selectedLakeId]);

  useEffect(() => {
    writeStoredLakeSelection(selectedLakeId);
  }, [selectedLakeId]);

  const closePanel = useCallback(() => {
    setSelectedLakeId(null);

    if (panelHistoryWasPushedRef.current) {
      panelHistoryWasPushedRef.current = false;
      window.history.back();
    }
  }, []);

  const selectTab = useCallback(
    (tab: AppTab) => {
      if (tab === activeTab) {
        return;
      }

      setActiveTab(tab);
      window.scrollTo({ top: 0 });

      if (tab !== "map") {
        setSelectedLakeId(null);
      }

      panelHistoryWasPushedRef.current = false;

      const nextHash = tab === "map" ? "" : `#${tab}`;
      window.history.pushState({ tab }, "", `${window.location.pathname}${window.location.search}${nextHash}`);
    },
    [activeTab]
  );

  const showLakeOnMap = useCallback((lakeId: LakeId) => {
    setSelectedLakeId(lakeId);
    setActiveTab("map");
    panelHistoryWasPushedRef.current = true;
    window.scrollTo({ top: 0 });
    window.history.pushState({ lakeId, tab: "map" }, "", `${window.location.pathname}${window.location.search}`);
  }, []);

  const openLakeOnMap = useCallback((lakeId: LakeId) => {
    setSelectedLakeId(lakeId);
    panelHistoryWasPushedRef.current = true;
    window.history.pushState({ lakeId, tab: "map" }, "", `${window.location.pathname}${window.location.search}`);
  }, []);

  useEffect(() => {
    function handlePopState() {
      const historyState = readHistoryState();
      panelHistoryWasPushedRef.current = false;
      setActiveTab(historyState.tab ?? readActiveTab());
      setSelectedLakeId(historyState.lakeId ?? null);
      window.scrollTo({ top: 0 });
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
      <a className="skip-link" href="#app-main">
        Zum Inhalt
      </a>

      {activeTab !== "map" ? (
        <header className="app-header">
          <div className="brand">
            <span className="brand-mark">
              <img className="brand-logo" src={zueriFishLogo} alt="ZüriFish Logo" />
            </span>
            <div>
              <span className="brand-kicker">Fischer-App Schweiz</span>
              <h1>ZüriFish</h1>
            </div>
          </div>
          <span className="app-section-label">{NAV_ITEMS.find((item) => item.id === activeTab)?.label}</span>
        </header>
      ) : null}

      {activeTab === "map" ? (
        <main id="app-main" className="map-stage" aria-label="Interaktive Fischerei-Karte">
          <div className="map-brand-card" aria-label={`ZüriFish · ${lakes.length} Schweizer Seen · offline bereit`}>
            <span className="map-brand-logo" aria-hidden="true">
              <img src={zueriFishLogo} alt="" />
            </span>
            <span>
              <strong>ZüriFish</strong>
              <small>{lakes.length} Seen · Offline</small>
            </span>
          </div>
          <MapView selectedLakeId={selectedLakeId} onSelectLake={openLakeOnMap} />
        </main>
      ) : null}

      {activeTab === "fish" ? <FishProfilesView /> : null}
      {activeTab === "recognizer" ? <FishRecognizerView /> : null}
      {activeTab === "rules" ? <RulesOverviewView onShowLake={showLakeOnMap} /> : null}

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
              aria-label={item.label}
              onClick={() => selectTab(item.id)}
            >
              <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
