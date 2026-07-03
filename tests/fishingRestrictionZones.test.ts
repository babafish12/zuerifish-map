import { describe, expect, it } from "vitest";
import { fishingRestrictionZones } from "../src/lib/data";
import { getRestrictionPeriodStatus } from "../src/lib/restrictionPeriodStatus";

describe("fishingRestrictionZones", () => {
  it("contains mapped restriction features for all three lakes", () => {
    const lakeIds = new Set(fishingRestrictionZones.features.map((feature) => feature.properties.lakeId));
    const greifenseeZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === "greifensee");

    expect(lakeIds).toEqual(new Set(["zuerichsee", "greifensee", "pfaeffikersee"]));
    expect(greifenseeZones).toHaveLength(6);
    expect(greifenseeZones.every((feature) => feature.properties.sourceIds.includes("zh-gis-schutzzonen"))).toBe(true);
  });

  it("classifies active and inactive seasonal zones on 1 July 2026", () => {
    const currentDate = new Date(2026, 6, 1);
    const summerZone = fishingRestrictionZones.features.find((feature) => feature.properties.period === "1. April bis 15. August");
    const winterZone = fishingRestrictionZones.features.find((feature) => feature.properties.period === "20. November bis 31. März");
    const zurichseeMouth = fishingRestrictionZones.features.find((feature) => feature.properties.period === "16. November bis 31. Januar");

    expect(summerZone).toBeDefined();
    expect(winterZone).toBeDefined();
    expect(zurichseeMouth).toBeDefined();
    expect(getRestrictionPeriodStatus(summerZone!.properties.period, currentDate).tone).toBe("active");
    expect(getRestrictionPeriodStatus(winterZone!.properties.period, currentDate).tone).toBe("inactive");
    expect(getRestrictionPeriodStatus(zurichseeMouth!.properties.period, currentDate).tone).toBe("inactive");
  });
});
