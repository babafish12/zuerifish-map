import { describe, expect, it } from "vitest";
import { getFishStatus, isDateInClosedSeason } from "../src/lib/seasonStatus";

describe("seasonStatus", () => {
  it("marks protected species before date checks", () => {
    expect(
      getFishStatus({
        dailyLimit: "protected",
        protectedAllYear: true,
        closedSeason: { start: "01-01", end: "01-31", label: "01.01.-31.01." }
      })
    ).toBe("protected");
  });

  it("detects regular closed seasons inclusively", () => {
    expect(isDateInClosedSeason(new Date(2026, 2, 1), "03-01", "04-30")).toBe(true);
    expect(isDateInClosedSeason(new Date(2026, 3, 30), "03-01", "04-30")).toBe(true);
    expect(isDateInClosedSeason(new Date(2026, 4, 1), "03-01", "04-30")).toBe(false);
  });

  it("supports closed seasons over the year boundary", () => {
    expect(isDateInClosedSeason(new Date(2026, 0, 5), "12-15", "01-20")).toBe(true);
    expect(isDateInClosedSeason(new Date(2026, 11, 20), "12-15", "01-20")).toBe(true);
    expect(isDateInClosedSeason(new Date(2026, 5, 20), "12-15", "01-20")).toBe(false);
  });

  it("marks missing or malformed season data as unclear", () => {
    expect(
      getFishStatus({
        dailyLimit: 5,
        closedSeason: { start: "13-01", end: "04-30", label: "kaputt" }
      })
    ).toBe("unclear");
  });

  it("marks fish without closed season as allowed", () => {
    expect(
      getFishStatus({
        dailyLimit: 50,
        closedSeason: null
      })
    ).toBe("allowed");
  });

  it("marks local restrictions as unclear instead of overstating allowed", () => {
    expect(
      getFishStatus({
        dailyLimit: 50,
        closedSeason: null,
        localRestrictionWarning: "Schutzgebiet prüfen"
      })
    ).toBe("unclear");
  });
});
