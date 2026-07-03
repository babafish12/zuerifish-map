import { describe, expect, it } from "vitest";
import { offlineMap } from "../src/lib/data";

describe("offline map data", () => {
  it("bundles real local map features for offline use", () => {
    const categories = new Set(offlineMap.features.map((feature) => feature.properties.category));

    expect(offlineMap.source).toContain("OpenStreetMap");
    expect(offlineMap.features.length).toBeGreaterThan(1000);
    expect([...categories]).toEqual(expect.arrayContaining(["forest", "place", "rail", "road", "water", "waterway"]));
    expect(offlineMap.features.every((feature) => feature.properties.source === "OpenStreetMap")).toBe(true);
  });
});
