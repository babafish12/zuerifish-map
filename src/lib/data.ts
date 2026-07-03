import lakesData from "../data/lakes.json";
import speciesData from "../data/species.json";
import fishProfilesData from "../data/fish-profiles.json";
import lakeRulesData from "../data/lake-rules.json";
import gearRulesData from "../data/gear-rules.json";
import fishingRestrictionZonesRaw from "../data/fishing-restriction-zones.geojson?raw";
import offlineMapRaw from "../data/offline-map.geojson?raw";
import sourcesData from "../data/sources.json";
import polygonsRaw from "../data/lake-polygons.geojson?raw";
import greifenseeImage from "../assets/lakes/greifensee.svg?url";
import pfaeffikerseeImage from "../assets/lakes/pfaeffikersee.svg?url";
import zuerichseeImage from "../assets/lakes/zuerichsee.svg?url";
import type {
  FishingRestrictionFeatureCollection,
  FishProfile,
  FishRule,
  GearRules,
  Lake,
  LakeFeatureCollection,
  LakeId,
  OfflineMapFeatureCollection,
  Source,
  Species
} from "../types";

const lakeImageUrls: Record<LakeId, string> = {
  greifensee: greifenseeImage,
  pfaeffikersee: pfaeffikerseeImage,
  zuerichsee: zuerichseeImage
};

export const lakes = (lakesData as Lake[]).map((entry) => ({
  ...entry,
  image: {
    ...entry.image,
    src: lakeImageUrls[entry.id] ?? entry.image.src
  }
}));
const speciesImageOverrides: Record<string, Partial<Species["image"]>> = {
  aesche: {
    src: "/assets/fish/cutouts-webp/aesche.webp",
    alt: "Fischbild Äsche aus dem Steckbrief-Dokument",
    sourceId: "fish-profile-pdf-images"
  },
  egli: {
    src: "/assets/fish/cutouts-webp/egli.webp",
    alt: "Fischbild Egli aus dem Steckbrief-Dokument",
    sourceId: "fish-profile-pdf-images"
  },
  felchenartige: {
    src: "/assets/fish/cutouts-webp/felchen.webp",
    alt: "Fischbild Felchen aus dem Steckbrief-Dokument",
    sourceId: "fish-profile-pdf-images"
  },
  forelle: {
    src: "/assets/fish/cutouts-webp/seeforelle.webp",
    alt: "Fischbild Seeforelle aus dem Steckbrief-Dokument",
    sourceId: "fish-profile-pdf-images"
  },
  hecht: {
    src: "/assets/fish/cutouts-webp/hecht.webp",
    alt: "Fischbild Hecht aus dem Steckbrief-Dokument",
    sourceId: "fish-profile-pdf-images"
  },
  seesaibling: {
    src: "/assets/fish/cutouts-webp/seesaiblinge.webp",
    alt: "Fischbild Seesaiblinge aus dem Steckbrief-Dokument",
    sourceId: "fish-profile-pdf-images"
  },
  zander: {
    src: "/assets/fish/cutouts-webp/zander.webp",
    alt: "Fischbild Zander aus dem Steckbrief-Dokument",
    sourceId: "fish-profile-pdf-images"
  }
};

export const species = (speciesData as Species[]).map((entry) => ({
  ...entry,
  image: {
    ...entry.image,
    ...(speciesImageOverrides[entry.id] ?? {})
  }
}));
export const fishProfiles = fishProfilesData as FishProfile[];
export const lakeRules = lakeRulesData as FishRule[];
export const gearRules = gearRulesData as GearRules;
export const sources = sourcesData as Source[];
export const lakePolygons = JSON.parse(polygonsRaw) as LakeFeatureCollection;
export const fishingRestrictionZones = JSON.parse(fishingRestrictionZonesRaw) as FishingRestrictionFeatureCollection;
export const offlineMap = JSON.parse(offlineMapRaw) as OfflineMapFeatureCollection;

export function getLake(id: LakeId): Lake {
  const lake = lakes.find((entry) => entry.id === id);

  if (!lake) {
    throw new Error(`Unknown lake: ${id}`);
  }

  return lake;
}

export function getRulesForLake(lakeId: LakeId): FishRule[] {
  return lakeRules.filter((rule) => rule.lakeId === lakeId);
}

export function getSpecies(speciesId: string): Species {
  const match = species.find((entry) => entry.id === speciesId);

  if (!match) {
    throw new Error(`Unknown species: ${speciesId}`);
  }

  return match;
}

export function getGearRulesForLake(lakeId: LakeId) {
  const match = gearRules.byLake.find((entry) => entry.lakeId === lakeId);

  if (!match) {
    throw new Error(`Unknown gear rules for lake: ${lakeId}`);
  }

  return match;
}

export function getSources(ids: string[]): Source[] {
  return ids.map((id) => {
    const source = sources.find((entry) => entry.id === id);

    if (!source) {
      throw new Error(`Unknown source: ${id}`);
    }

    return source;
  });
}
