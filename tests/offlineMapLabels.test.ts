import { describe, expect, it } from "vitest";
import { getOfflineDisplayMinZoom } from "../src/lib/offlineMapDisplay";
import type { OfflineMapFeature } from "../src/types";

function offlineFeature(properties: Partial<OfflineMapFeature["properties"]>): OfflineMapFeature {
  return {
    type: "Feature",
    properties: {
      id: "test-feature",
      category: "place",
      kind: "city",
      layer: "label",
      minZoom: 8,
      name: "Test",
      source: "OpenStreetMap",
      ...properties
    },
    geometry: {
      type: "Point",
      coordinates: [8.54, 47.37]
    }
  };
}

describe("offline map label density", () => {
  it("keeps overview labels visible and delays dense local labels", () => {
    expect(getOfflineDisplayMinZoom(offlineFeature({ kind: "city", minZoom: 8 }))).toBe(8);
    expect(getOfflineDisplayMinZoom(offlineFeature({ kind: "town", minZoom: 9 }))).toBe(9);
    expect(getOfflineDisplayMinZoom(offlineFeature({ kind: "village", minZoom: 10 }))).toBe(12);
    expect(getOfflineDisplayMinZoom(offlineFeature({ kind: "suburb", minZoom: 12 }))).toBe(13);
    expect(getOfflineDisplayMinZoom(offlineFeature({ kind: "hamlet", minZoom: 13 }))).toBe(14);
    expect(getOfflineDisplayMinZoom(offlineFeature({ category: "station", kind: "station", minZoom: 12 }))).toBe(14);
  });

  it("does not delay non-label map features", () => {
    expect(getOfflineDisplayMinZoom(offlineFeature({ category: "road", kind: "secondary", layer: "line", minZoom: 10 }))).toBe(10);
  });
});
