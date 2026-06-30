import type { DailyLimit, FishStatus, MinSize } from "../types";

export function formatDailyLimit(limit: DailyLimit): string {
  if (limit === "protected") {
    return "geschützt / nicht entnehmen";
  }

  if (limit === "none") {
    return "keine Tageslimite";
  }

  return `max. ${limit} Fisch/Tag`;
}

export function formatMinSize(minSize: MinSize): string {
  if (minSize === "none") {
    return "kein Mindestmass";
  }

  return `Mindestmass ${minSize} cm`;
}

export function statusLabel(status: FishStatus): string {
  switch (status) {
    case "allowed":
      return "Heute erlaubt";
    case "closed":
      return "Heute Schonzeit";
    case "protected":
      return "Ganzjährig geschützt";
    case "unclear":
      return "Unklar";
  }
}

export function statusHint(status: FishStatus): string {
  switch (status) {
    case "allowed":
      return "Regeln trotzdem prüfen";
    case "closed":
      return "nicht entnehmen";
    case "protected":
      return "nicht entnehmen";
    case "unclear":
      return "offizielle Quelle prüfen";
  }
}

