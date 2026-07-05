import { describe, expect, it } from "vitest";
import { fishingRestrictionZones, lakes, sources } from "../src/lib/data";
import { getRestrictionPeriodStatus } from "../src/lib/restrictionPeriodStatus";

describe("fishingRestrictionZones", () => {
  it("contains mapped restriction features for verified lake groups", () => {
    const knownLakeIds = new Set(lakes.map((lake) => lake.id));
    const knownSourceIds = new Set(sources.map((source) => source.id));
    const lakeIds = new Set(fishingRestrictionZones.features.map((feature) => feature.properties.lakeId));
    const greifenseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "greifensee");
    const thunerseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "thunersee");
    const ticinoZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "verbano" || feature.properties.lakeId === "ceresio");
    const waegitalerseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "waegitalersee");
    const bodenseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "bodensee");
    const unterseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "untersee");
    const walenseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "walensee");
    const vierwaldstaetterseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "vierwaldstaettersee");
    const lungererseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "lungerersee");

    expect(lakeIds).toEqual(
      new Set([
        "zuerichsee",
        "greifensee",
        "pfaeffikersee",
        "brienzersee",
        "thunersee",
        "lac-de-bienne",
        "lac-de-joux",
        "verbano",
        "ceresio",
        "waegitalersee",
        "bodensee",
        "untersee",
        "walensee",
        "vierwaldstaettersee",
        "lungerersee",
      ])
    );
    expect(greifenseeZones).toHaveLength(6);
    expect(greifenseeZones.every((feature) => feature.properties.sourceIds.includes("zh-gis-schutzzonen"))).toBe(true);
    expect(thunerseeZones).toHaveLength(5);
    expect(thunerseeZones.every((feature) => feature.properties.sourceIds.includes("be-angfisch-schongebiete"))).toBe(true);
    expect(ticinoZones.every((feature) => feature.properties.sourceIds.includes("ti-zone-protezione-ittica-wfs"))).toBe(true);
    expect(waegitalerseeZones).toHaveLength(2);
    expect(waegitalerseeZones.every((feature) => feature.properties.sourceIds.includes("waegitalersee-vorschriften-2025"))).toBe(true);
    expect(bodenseeZones).toHaveLength(9);
    expect(bodenseeZones.every((feature) => feature.properties.sourceIds.includes("igkb-fischereikarten"))).toBe(true);
    expect(unterseeZones).toHaveLength(8);
    expect(unterseeZones.every((feature) => feature.properties.sourceIds.includes("untersee-fischereiordnung"))).toBe(true);
    expect(walenseeZones).toHaveLength(2);
    expect(walenseeZones.every((feature) => feature.properties.sourceIds.includes("sg-walensee"))).toBe(true);
    expect(vierwaldstaetterseeZones).toHaveLength(1);
    expect(vierwaldstaetterseeZones[0].properties.sourceIds).toContain("lu-fischerei-geoportal");
    expect(lungererseeZones).toHaveLength(1);
    expect(lungererseeZones[0].properties.sourceIds).toContain("ow-lungerersee");
    expect(fishingRestrictionZones.features.every((feature) => knownLakeIds.has(feature.properties.lakeId))).toBe(true);
    expect(fishingRestrictionZones.features.every((feature) => feature.properties.sourceIds.every((sourceId) => knownSourceIds.has(sourceId)))).toBe(true);
    expect(fishingRestrictionZones.features.every((feature) => feature.geometry.coordinates.length > 0)).toBe(true);
  });

  it("classifies active and inactive seasonal zones on 1 July 2026", () => {
    const currentDate = new Date(2026, 6, 1);
    const summerZone = fishingRestrictionZones.features.find((feature) => feature.properties.period === "1. April bis 15. August");
    const winterZone = fishingRestrictionZones.features.find((feature) => feature.properties.period === "20. November bis 31. März");
    const zurichseeMouth = fishingRestrictionZones.features.find((feature) => feature.properties.period === "16. November bis 31. Januar");
    const ticinoSpringZone = fishingRestrictionZones.features.find((feature) => feature.properties.period === "1. April bis 31. Mai");
    const walenseeAutumnZone = fishingRestrictionZones.features.find((feature) => feature.properties.id === "walensee-seezmuendung-150m");
    const lungererseeWinterZone = fishingRestrictionZones.features.find((feature) => feature.properties.id === "lungerersee-ganzer-see-wintersperre");

    expect(summerZone).toBeDefined();
    expect(winterZone).toBeDefined();
    expect(zurichseeMouth).toBeDefined();
    expect(ticinoSpringZone).toBeDefined();
    expect(walenseeAutumnZone).toBeDefined();
    expect(lungererseeWinterZone).toBeDefined();
    expect(getRestrictionPeriodStatus(summerZone!.properties.period, currentDate).tone).toBe("active");
    expect(getRestrictionPeriodStatus(winterZone!.properties.period, currentDate).tone).toBe("inactive");
    expect(getRestrictionPeriodStatus(zurichseeMouth!.properties.period, currentDate).tone).toBe("inactive");
    expect(getRestrictionPeriodStatus(ticinoSpringZone!.properties.period, currentDate).tone).toBe("inactive");
    expect(getRestrictionPeriodStatus(ticinoSpringZone!.properties.period, new Date(2026, 4, 1)).tone).toBe("active");
    expect(getRestrictionPeriodStatus(walenseeAutumnZone!.properties.period, new Date(2026, 9, 1)).tone).toBe("active");
    expect(getRestrictionPeriodStatus(walenseeAutumnZone!.properties.period, new Date(2026, 0, 1)).tone).toBe("inactive");
    expect(getRestrictionPeriodStatus(lungererseeWinterZone!.properties.period, new Date(2026, 11, 10)).tone).toBe("active");
    expect(getRestrictionPeriodStatus(lungererseeWinterZone!.properties.period, new Date(2026, 11, 26)).tone).toBe("inactive");
  });
});
