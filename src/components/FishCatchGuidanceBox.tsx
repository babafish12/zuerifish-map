import { AlertTriangle, BadgeCheck, Ban, SearchCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FishCatchGuidance, FishCatchStatus } from "../types";

const STATUS_ICON: Record<FishCatchStatus, LucideIcon> = {
  allowed: BadgeCheck,
  protected: Ban,
  nonNative: AlertTriangle,
  checkRules: SearchCheck
};

export function FishCatchGuidanceBox({ guidance, compact = false }: { guidance: FishCatchGuidance; compact?: boolean }) {
  const Icon = STATUS_ICON[guidance.status];

  return (
    <section className={`catch-guidance catch-guidance-${guidance.status}${compact ? " compact" : ""}`} aria-label="Was tun nach dem Fang">
      <div className="catch-guidance-header">
        <span className="catch-guidance-icon" aria-hidden="true">
          <Icon size={19} />
        </span>
        <div>
          <p>{guidance.label}</p>
          <h4>{guidance.headline}</h4>
        </div>
      </div>
      <p className="catch-guidance-summary">{guidance.summary}</p>
      <ul>
        {guidance.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      <p className="catch-guidance-note">{guidance.legalNote}</p>
    </section>
  );
}
