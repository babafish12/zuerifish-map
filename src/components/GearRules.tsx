import { Anchor, Sailboat, Waves } from "lucide-react";
import type { GearMode, GearRulesByLake } from "../types";

interface GearRulesProps {
  gearRules: GearRulesByLake;
  selectedMode: GearMode;
  onModeChange: (mode: GearMode) => void;
}

const modeLabels: Record<GearMode, string> = {
  withoutPatent: "Ohne Patent",
  shorePatent: "Patent Ufer",
  stationaryBoat: "Boot / stehend",
  trolling: "Schleppangeln"
};

export function GearRules({ gearRules, selectedMode, onModeChange }: GearRulesProps) {
  const detailRules = gearRules.modeDetails[selectedMode];

  return (
    <section className="panel-section" aria-labelledby="gear-title">
      <div className="section-heading">
        <h3 id="gear-title">Freiangelrecht und Patent</h3>
        <span>Kontextfilter im Panel</span>
      </div>

      <div className="mode-control" role="tablist" aria-label="Patent- und Gerätemodus">
        {(Object.keys(modeLabels) as GearMode[]).map((mode) => (
          <button key={mode} type="button" role="tab" aria-selected={selectedMode === mode} onClick={() => onModeChange(mode)}>
            {modeLabels[mode]}
          </button>
        ))}
      </div>

      <div className="mode-result">
        <div className="mode-icon" aria-hidden="true">
          {selectedMode === "trolling" ? <Waves size={24} /> : selectedMode === "stationaryBoat" ? <Sailboat size={24} /> : <Anchor size={24} />}
        </div>
        <div>
          <strong>{modeLabels[selectedMode]}</strong>
          <p>{gearRules[selectedMode]}</p>
          <small>{selectedMode === "withoutPatent" ? "Freiangelregeln unten beachten." : gearRules.note}</small>
        </div>
      </div>

      <dl className="free-rules" aria-label={`${modeLabels[selectedMode]} Detailregeln`}>
        {detailRules.map((rule) => (
          <div key={rule.label}>
            <dt>{rule.label}</dt>
            <dd>{rule.value}</dd>
          </div>
        ))}
      </dl>

      <div className="time-limit">
        <span>Zeit</span>
        <strong>{gearRules.time}</strong>
      </div>
    </section>
  );
}
