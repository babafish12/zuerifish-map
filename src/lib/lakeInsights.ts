import { fishProfiles, fishingRestrictionZones, getLake, getRulesForLake } from "./data";
import { getRestrictionPeriodStatus } from "./restrictionPeriodStatus";
import type { LakeId } from "../types";

export interface LakeInsight {
  lakeId: LakeId;
  label: string;
  ruleCount: number;
  confirmedFishCount: number;
  restrictionCount: number;
  activeRestrictionCount: number;
  protectedRuleCount: number;
}

export function getLakeInsight(lakeId: LakeId): LakeInsight {
  const rules = getRulesForLake(lakeId);
  const restrictionZones = fishingRestrictionZones.features.filter((feature) => feature.properties.lakeId === lakeId);
  const lake = getLake(lakeId);

  return {
    lakeId,
    label: lake.name,
    ruleCount: rules.length,
    confirmedFishCount: fishProfiles.filter((profile) => isConfirmedLakeOccurrence(profile.occurrence[lakeId])).length,
    restrictionCount: restrictionZones.length,
    activeRestrictionCount: restrictionZones.filter((feature) => getRestrictionPeriodStatus(feature.properties.period).isActive).length,
    protectedRuleCount: rules.filter((rule) => rule.protectedAllYear || rule.dailyLimit === "protected").length
  };
}

export function isConfirmedLakeOccurrence(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();

  if (normalized.includes("nicht bestätigt") || normalized.includes("historisch") || normalized.includes("nicht separat")) {
    return false;
  }

  return normalized.includes("ja") || normalized.includes("selten") || normalized.includes("geschützt");
}
