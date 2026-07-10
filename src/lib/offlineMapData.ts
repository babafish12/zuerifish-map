import offlineMapUrl from "../data/offline-map.geojson?url";
import type { OfflineMapFeatureCollection } from "../types";

let cachedOfflineMap: OfflineMapFeatureCollection | null = null;

export async function loadOfflineMap(signal?: AbortSignal): Promise<OfflineMapFeatureCollection> {
  if (cachedOfflineMap) {
    return cachedOfflineMap;
  }

  if (import.meta.env.MODE === "test") {
    return {
      type: "FeatureCollection",
      name: "zuerifish-offline-test-map",
      source: "OpenStreetMap test fixture",
      license: "Open Database License (ODbL)",
      bbox: [8.37, 47.18, 8.91, 47.43],
      generatedAt: "2026-07-01T21:23:21.976Z",
      features: []
    };
  }

  const response = await fetch(offlineMapUrl, { signal });

  if (!response.ok) {
    throw new Error(`Offline map responded with ${response.status}`);
  }

  const data = (await response.json()) as Partial<OfflineMapFeatureCollection>;

  if (data.type !== "FeatureCollection" || !Array.isArray(data.features) || typeof data.source !== "string") {
    throw new Error("Offline map has an invalid format");
  }

  cachedOfflineMap = data as OfflineMapFeatureCollection;
  return cachedOfflineMap;
}
