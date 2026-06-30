import { useCallback, useEffect, useMemo, useState } from "react";
import { Fish, ShieldAlert } from "lucide-react";
import { LakePanel } from "./components/LakePanel";
import { MapView } from "./components/MapView";
import { getLake } from "./lib/data";
import type { LakeId } from "./types";

function App() {
  const [selectedLakeId, setSelectedLakeId] = useState<LakeId | null>(null);

  const selectedLake = useMemo(() => {
    return selectedLakeId ? getLake(selectedLakeId) : null;
  }, [selectedLakeId]);

  const closePanel = useCallback(() => {
    setSelectedLakeId(null);
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

      <main className="map-stage" aria-label="Interaktive Fischerei-Karte">
        <MapView selectedLakeId={selectedLakeId} onSelectLake={setSelectedLakeId} />
        <section className="start-card" aria-label="Kurzanleitung">
          <strong>See antippen.</strong>
          <span> Danach erscheinen Fische, Mindestmasse, Schonzeiten, Tageslimiten und Patentregeln.</span>
        </section>
      </main>

      {selectedLake ? (
        <div className="panel-layer" onMouseDown={closePanel} aria-label="Detailpanel Ebene">
          <LakePanel lake={selectedLake} onClose={closePanel} />
        </div>
      ) : null}
    </div>
  );
}

export default App;
