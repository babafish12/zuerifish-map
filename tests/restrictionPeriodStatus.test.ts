import { describe, expect, it } from "vitest";
import { getRestrictionPeriodStatus, isRestrictionPeriodActive } from "../src/lib/restrictionPeriodStatus";

describe("restrictionPeriodStatus", () => {
  it("marks ganzjährig periods as active", () => {
    expect(isRestrictionPeriodActive("ganzjährig", new Date(2026, 6, 1))).toBe(true);
    expect(getRestrictionPeriodStatus("ganzjährig", new Date(2026, 6, 1))).toMatchObject({
      isActive: true,
      isYearRound: true,
      label: "ganzjährig aktiv",
      tone: "active"
    });
  });

  it("checks normal seasons inclusively", () => {
    expect(isRestrictionPeriodActive("1. April bis 15. August", new Date(2026, 3, 1))).toBe(true);
    expect(isRestrictionPeriodActive("1. April bis 15. August", new Date(2026, 7, 15))).toBe(true);
    expect(isRestrictionPeriodActive("1. April bis 15. August", new Date(2026, 8, 1))).toBe(false);
  });

  it("checks seasons over the year boundary", () => {
    expect(isRestrictionPeriodActive("16. November bis 31. Januar", new Date(2026, 10, 20))).toBe(true);
    expect(isRestrictionPeriodActive("16. November bis 31. Januar", new Date(2026, 0, 10))).toBe(true);
    expect(isRestrictionPeriodActive("16. November bis 31. Januar", new Date(2026, 5, 10))).toBe(false);
  });

  it("returns map tones for the current July 2026 date", () => {
    expect(getRestrictionPeriodStatus("1. April bis 15. August", new Date(2026, 6, 1))).toMatchObject({
      isActive: true,
      label: "heute aktiv",
      tone: "active"
    });
    expect(getRestrictionPeriodStatus("20. November bis 31. März", new Date(2026, 6, 1))).toMatchObject({
      isActive: false,
      label: "saisonal, heute nicht aktiv",
      tone: "inactive"
    });
  });

  it("marks unknown periods as inactive instead of overstating a ban", () => {
    expect(getRestrictionPeriodStatus("nach lokaler Signalisation", new Date(2026, 6, 1))).toMatchObject({
      isActive: false,
      isYearRound: false,
      label: "Zeitraum unklar",
      tone: "inactive"
    });
  });
});
