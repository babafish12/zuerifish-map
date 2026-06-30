import { useCallback, useEffect, useMemo, useState } from "react";
import { Fish, Map, ScanSearch, Settings, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FishProfilesView } from "./components/FishProfilesView";
import { FishRecognizerView } from "./components/FishRecognizerView";
import { LakePanel } from "./components/LakePanel";
import { MapView } from "./components/MapView";
import { getLake } from "./lib/data";
import type { LakeId } from "./types";

type AppTab = "map" | "fish" | "recognizer" | "settings";

const NAV_ITEMS: { id: AppTab; label: string; icon: LucideIcon }[] = [
  { id: "map", label: "Karte", icon: Map },
  { id: "fish", label: "Fische", icon: Fish },
  { id: "recognizer", label: "Fischerkenner", icon: ScanSearch },
  { id: "settings", label: "Settings", icon: Settings }
];

function App() {
  const [selectedLakeId, setSelectedLakeId] = useState<LakeId | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("map");

  const selectedLake = useMemo(() => {
    return selectedLakeId ? getLake(selectedLakeId) : null;
  }, [selectedLakeId]);

  const closePanel = useCallback(() => {
    setSelectedLakeId(null);
  }, []);

  const selectTab = useCallback(
    (tab: AppTab) => {
      setActiveTab(tab);

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
          <section className="start-card" aria-label="Kurzanleitung">
            <strong>See antippen.</strong>
            <span> Danach erscheinen Fische, Mindestmasse, Schonzeiten, Tageslimiten und Patentregeln.</span>
          </section>
        </main>
      ) : null}

      {activeTab === "fish" ? <FishProfilesView /> : null}
      {activeTab === "recognizer" ? <FishRecognizerView /> : null}
      {activeTab === "settings" ? <PlaceholderPage title="Settings" text="Einstellungen für Darstellung, Hinweise und Quellen werden hier vorbereitet." /> : null}

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

function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return (
    <main className="app-page placeholder-page" aria-labelledby={`${title}-title`}>
      <section>
        <h2 id={`${title}-title`}>{title}</h2>
        <p>{text}</p>
      </section>
    </main>
  );
}

export default App;
