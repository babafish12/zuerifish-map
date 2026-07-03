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
    sourceUrl?: string;
    license?: string;
    author?: string;
    attributionRequired?: boolean;
    generatedWith?: string;
    prompt?: string;
    usageStatus?: string;
  };
}

export interface FishProfile {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  image: {
    src: string;
    alt: string;
    sourceId: string;
  };
  occurrence: Record<LakeId, string>;
  note: string;
}

export type FishProfileCategoryGroup =
  | "Salmoniden"
  | "Raubfische"
  | "Friedfische"
  | "Kleinfische"
  | "Geschützte Arten"
  | "Landesfremde Arten";

export interface FishProfileDetail {
  categoryGroup: FishProfileCategoryGroup;
  portrait: string;
  identification: string[];
  habitats: string[];
  catchingTips: string[];
  eatingNote: string;
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

export type GearMode = "withoutPatent" | "shorePatent" | "stationaryBoat" | "trolling";

export interface GearRulesByLake {
  lakeId: LakeId;
  withoutPatent: string;
  shorePatent: string;
  stationaryBoat: string;
  trolling: string;
  modeDetails: Record<GearMode, FreeFishingRule[]>;
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

export type GeoPosition = [number, number];

export type FishingRestrictionGeometry =
  | {
      type: "Polygon";
      coordinates: GeoPosition[][];
    }
  | {
      type: "MultiPolygon";
      coordinates: GeoPosition[][][];
    };

export interface FishingRestrictionFeature {
  type: "Feature";
  properties: {
    id: string;
    lakeId: LakeId;
    name: string;
    zone: string;
    period: string;
    rule: string;
    sourceIds: string[];
  };
  geometry: FishingRestrictionGeometry;
}

export interface FishingRestrictionFeatureCollection {
  type: "FeatureCollection";
  name: string;
  features: FishingRestrictionFeature[];
}

export interface LakeFeature {
  type: "Feature";
  properties: {
    id: LakeId;
    name: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: GeoPosition[][];
  };
}

export interface LakeFeatureCollection {
  type: "FeatureCollection";
  features: LakeFeature[];
}

export type OfflineMapCategory = "forest" | "land" | "path" | "place" | "rail" | "road" | "station" | "water" | "waterway" | "wetland";

export interface OfflineMapFeature {
  type: "Feature";
  properties: {
    id: string;
    category: OfflineMapCategory;
    kind: string;
    name?: string;
    minZoom: number;
    layer: "area" | "label" | "line";
    source: "OpenStreetMap";
  };
  geometry:
    | {
        type: "Point";
        coordinates: GeoPosition;
      }
    | {
        type: "LineString";
        coordinates: GeoPosition[];
      }
    | {
        type: "Polygon";
        coordinates: GeoPosition[][];
      };
}

export interface OfflineMapFeatureCollection {
  type: "FeatureCollection";
  name: string;
  source: string;
  license: string;
  bbox: [number, number, number, number];
  generatedAt: string;
  features: OfflineMapFeature[];
}
