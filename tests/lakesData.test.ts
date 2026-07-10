import { describe, expect, it } from "vitest";
import { gearRules, lakeDetailRules, lakePolygons, lakes, sources } from "../src/lib/data";
import { hasCompleteGearModeDetails } from "../src/lib/lakeGearRules";
import type { GearMode } from "../src/types";

const gearModes: GearMode[] = ["withoutPatent", "shorePatent", "stationaryBoat", "trolling"];

describe("lake data", () => {
  it("keeps only lakes with at least 2 km2 surface area", () => {
    expect(lakes).toHaveLength(38);
    expect(lakes.every((lake) => typeof lake.areaKm2 === "number" && lake.areaKm2 >= 2)).toBe(true);
    expect(lakes.map((lake) => lake.id)).not.toContain("lago-di-poschiavo");
  });

  it("has a real header image and detail rule entry for every listed lake", () => {
    const lakeIds = new Set(lakes.map((lake) => lake.id));
    const sourceIds = new Set(sources.map((source) => source.id));

    expect(lakes.every((lake) => lake.image?.src.startsWith("https://upload.wikimedia.org/"))).toBe(true);
    expect(lakes.every((lake) => lake.image?.alt.includes("Echtes Bild") || lake.image?.alt.length)).toBe(true);
    expect(new Set(lakeDetailRules.map((details) => details.lakeId))).toEqual(lakeIds);
    expect(lakeDetailRules).toHaveLength(lakes.length);

    for (const details of lakeDetailRules) {
      expect(lakeIds.has(details.lakeId)).toBe(true);
      expect(details.sections.length).toBeGreaterThan(0);
      expect(details.sections.every((section) => section.items.length > 0)).toBe(true);
      expect(details.sourceIds.every((sourceId) => sourceIds.has(sourceId))).toBe(true);
    }
  });

  it("has a clickable map polygon for every listed lake", () => {
    const lakeIds = new Set(lakes.map((lake) => lake.id));
    const polygonIds = new Set(lakePolygons.features.map((feature) => feature.properties.id));

    expect(lakePolygons.features).toHaveLength(lakes.length);
    expect(polygonIds).toEqual(lakeIds);
    expect(lakePolygons.features.every((feature) => feature.geometry.coordinates.length > 0)).toBe(true);
    expect(lakePolygons.features.every((feature) => feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")).toBe(true);
  });

  it("has patent and gear mode rules for every listed lake", () => {
    const lakeIds = new Set(lakes.map((lake) => lake.id));
    const gearLakeIds = new Set(gearRules.byLake.map((rule) => rule.lakeId));

    expect(gearRules.byLake).toHaveLength(lakes.length);
    expect(gearLakeIds).toEqual(lakeIds);

    for (const rule of gearRules.byLake) {
      expect(hasCompleteGearModeDetails(rule)).toBe(true);
      expect(rule.time.length).toBeGreaterThan(0);
      expect(rule.note.length).toBeGreaterThan(0);

      for (const mode of gearModes) {
        expect(rule[mode].length).toBeGreaterThan(0);
        expect(rule.modeDetails[mode].every((detail) => detail.label.length > 0 && detail.value.length > 0)).toBe(true);
      }
    }
  });
});
