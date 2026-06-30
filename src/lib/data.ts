import lakesData from "../data/lakes.json";
import speciesData from "../data/species.json";
import lakeRulesData from "../data/lake-rules.json";
import gearRulesData from "../data/gear-rules.json";
import sourcesData from "../data/sources.json";
import polygonsRaw from "../data/lake-polygons.geojson?raw";
import aescheImage from "../assets/fish/aesche.svg?url";
import egliImage from "../assets/fish/egli.svg?url";
import felchenImage from "../assets/fish/felchen.svg?url";
import forelleImage from "../assets/fish/forelle.svg?url";
import hechtImage from "../assets/fish/hecht.svg?url";
import seesaiblingImage from "../assets/fish/seesaibling.svg?url";
import zanderImage from "../assets/fish/zander.svg?url";
import greifenseeImage from "../assets/lakes/greifensee.svg?url";
import pfaeffikerseeImage from "../assets/lakes/pfaeffikersee.svg?url";
import zuerichseeImage from "../assets/lakes/zuerichsee.svg?url";
import type { FishRule, GearRules, Lake, LakeFeatureCollection, LakeId, Source, Species } from "../types";

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
const speciesImageUrls: Record<string, string> = {
  aesche: aescheImage,
  egli: egliImage,
  felchenartige: felchenImage,
  forelle: forelleImage,
  hecht: hechtImage,
  seesaibling: seesaiblingImage,
  zander: zanderImage
};

export const species = (speciesData as Species[]).map((entry) => ({
  ...entry,
  image: {
    ...entry.image,
    src: speciesImageUrls[entry.id] ?? entry.image.src
  }
}));
export const lakeRules = lakeRulesData as FishRule[];
export const gearRules = gearRulesData as GearRules;
export const sources = sourcesData as Source[];
export const lakePolygons = JSON.parse(polygonsRaw) as LakeFeatureCollection;

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
