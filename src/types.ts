export type LakeId = "zuerichsee" | "greifensee" | "pfaeffikersee";

export type FishStatus = "allowed" | "closed" | "protected" | "unclear";

export type DailyLimit = number | "none" | "protected";

export type MinSize = number | "none";

export interface ClosedSeason {
  start: string;
  end: string;
  label: string;
}

export interface Lake {
  id: LakeId;
  name: string;
  canton: string;
  summary: string;
  badges: string[];
  image: {
    src: string;
    alt: string;
    sourceId: string;
  };
  sourceIds: string[];
}

export interface Species {
  id: string;
  name: string;
  scientificName?: string;
  image: {
    src: string;
    alt: string;
    sourceId: string;
    sourceUrl: string;
    license: string;
    author: string;
    attributionRequired: boolean;
    generatedWith: string;
    prompt: string;
    usageStatus: string;
  };
}

export interface FishRule {
  lakeId: LakeId;
  speciesId: string;
  dailyLimit: DailyLimit;
  minSizeCm: MinSize;
  closedSeason: ClosedSeason | null;
  protectedAllYear?: boolean;
  localRestrictionWarning?: string;
  hint: string;
  sourceIds: string[];
}

export interface FreeFishingRule {
  label: string;
  value: string;
}

export interface GearRulesByLake {
  lakeId: LakeId;
  withoutPatent: string;
  shorePatent: string;
  stationaryBoat: string;
  trolling: string;
  time: string;
  note: string;
}

export interface GearRules {
  freeFishing: FreeFishingRule[];
  byLake: GearRulesByLake[];
}

export interface Source {
  id: string;
  type: "rules" | "image" | "map" | "internal";
  title: string;
  publisher: string;
  date: string;
  url?: string;
  usedFor: string;
  license?: string;
  author?: string;
  attributionRequired?: boolean;
  attributionText?: string;
  status?: string;
}

export interface LakeFeature {
  type: "Feature";
  properties: {
    id: LakeId;
    name: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface LakeFeatureCollection {
  type: "FeatureCollection";
  features: LakeFeature[];
}
