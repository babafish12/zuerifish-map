import type { OfflineMapFeature } from "../types";

const OFFLINE_LABEL_DENSITY_MIN_ZOOM: Record<string, number> = {
  "place:village": 12,
  "place:suburb": 13,
  "place:hamlet": 14,
  "station:station": 14,
  "station:halt": 14
};

export function getOfflineDisplayMinZoom(feature: OfflineMapFeature): number {
  const { category, kind, layer, minZoom } = feature.properties;

  if (layer !== "label") {
    return minZoom;
  }

  const densityMinZoom = OFFLINE_LABEL_DENSITY_MIN_ZOOM[`${category}:${kind}`] ?? minZoom;
  return Math.max(minZoom, densityMinZoom);
}
