import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ExternalLink, X } from "lucide-react";
import { FishCard } from "./FishCard";
import { GearRules } from "./GearRules";
import { SourceList } from "./SourceList";
import { getGearRulesForLake, getRulesForLake, getSources } from "../lib/data";
import { getFishStatus } from "../lib/seasonStatus";
import { statusLabel } from "../lib/formatRules";
import type { Lake } from "../types";

interface LakePanelProps {
  lake: Lake;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function LakePanel({ lake, onClose }: LakePanelProps) {
  const [mode, setMode] = useState<"withoutPatent" | "shorePatent" | "stationaryBoat" | "trolling">("withoutPatent");
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fishRules = getRulesForLake(lake.id);
  const gearRules = getGearRulesForLake(lake.id);

  const sourceIds = useMemo(() => {
    return Array.from(new Set([...lake.sourceIds, ...fishRules.flatMap((rule) => rule.sourceIds), "fish-illustrations", "map-sketch"]));
  }, [fishRules, lake.sourceIds]);

  const summary = useMemo(() => {
    return fishRules.reduce(
      (counts, rule) => {
        counts[getFishStatus(rule)] += 1;
        return counts;
      },
      { allowed: 0, closed: 0, protected: 0, unclear: 0 }
    );
  }, [fishRules]);

  useEffect(() => {
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

      <section className="panel-section today-status" aria-labelledby="today-status-title">
        <h3 id="today-status-title">Heute-Status</h3>
        <div className="status-grid">
          <StatusCount label={statusLabel("allowed")} value={summary.allowed} tone="allowed" />
          <StatusCount label={statusLabel("closed")} value={summary.closed} tone="closed" />
          <StatusCount label={statusLabel("protected")} value={summary.protected} tone="protected" />
          <StatusCount label={statusLabel("unclear")} value={summary.unclear} tone="unclear" />
        </div>
      </section>

      <section className="panel-section" aria-labelledby="fish-title">
        <div className="section-heading">
          <h3 id="fish-title">Fischarten</h3>
          <span>{fishRules.length} Karten aus Datenmodell</span>
        </div>
        <div className="fish-list">
          {fishRules.map((rule) => (
            <FishCard key={`${rule.lakeId}-${rule.speciesId}`} rule={rule} />
          ))}
        </div>
      </section>

      <GearRules gearRules={gearRules} selectedMode={mode} onModeChange={setMode} />

      <section className="panel-section disclaimer" aria-labelledby="legal-title">
        <h3 id="legal-title">Rechtlicher Hinweis</h3>
        <p>
          Diese App ist eine Orientierungshilfe. Massgebend sind die offiziellen Vorschriften, das gültige Patent, die eFJ-App, lokale Tafeln,
          Schutzgebiete, temporäre Verbote und Anweisungen der Fischereiaufsicht.
        </p>
        <a href="https://www.zh.ch/de/umwelt-tiere/tiere/fischerei-jagd/fischerei.html" target="_blank" rel="noreferrer">
          Offizielle Fischerei-Seite Kanton Zürich
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </section>

      <SourceList sources={getSources(sourceIds)} />
    </aside>
  );
}

function StatusCount({ label, value, tone }: { label: string; value: number; tone: "allowed" | "closed" | "protected" | "unclear" }) {
  return (
    <div className={`status-count ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
