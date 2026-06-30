export const FISH_RECOGNITION_ENDPOINT = "/api/fish-recognition";
export const MAX_RECOGNITION_IMAGE_BYTES = 20 * 1024 * 1024;

export interface FishRecognitionDefinition {
  commonName: string;
  scientificName: string;
  imageUrl?: string;
}

export interface FishRecognitionCandidate extends FishRecognitionDefinition {
  id: string;
  certainty: number;
}

export interface FishRecognitionObject {
  bbox?: [number, number, number, number];
  shape?: number[];
  species: FishRecognitionCandidate[];
}

export interface FishRecognitionResult {
  ok: true;
  queryToken?: string;
  objects: FishRecognitionObject[];
}

interface FishialSpeciesCandidate {
  id: string;
  certainty: number;
}

interface FishialObject {
  bbox?: number[];
  shape?: number[];
  species?: FishialSpeciesCandidate[];
}

interface FishialRecognitionResponse {
  ok: boolean;
  queryToken?: string;
  objects?: FishialObject[];
  definitions?: Record<string, FishRecognitionDefinition>;
  error?: string;
  message?: string;
}

export class FishRecognitionError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "FishRecognitionError";
    this.code = code;
    this.status = status;
  }
}

export function validateFishImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Bitte ein Bild auswählen.";
  }

  if (file.size > MAX_RECOGNITION_IMAGE_BYTES) {
    return "Das Bild ist zu gross. Fishial akzeptiert maximal 20 MB.";
  }

  return null;
}

export async function recognizeFishImage(file: File, endpoint = FISH_RECOGNITION_ENDPOINT): Promise<FishRecognitionResult> {
  const validationError = validateFishImageFile(file);

  if (validationError) {
    throw new FishRecognitionError(validationError, "invalid_image");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream"
    },
    body: file
  });

  const payload = (await parseJsonResponse(response)) as FishialRecognitionResponse | null;

  if (!response.ok || payload?.ok === false) {
    throw new FishRecognitionError(
      payload?.message ?? "Die Online-Erkennung ist fehlgeschlagen.",
      payload?.error ?? "recognition_failed",
      response.status
    );
  }

  if (!payload) {
    throw new FishRecognitionError("Die Online-Erkennung hat keine lesbare Antwort geliefert.", "invalid_response", response.status);
  }

  return normalizeFishialResponse(payload);
}

async function parseJsonResponse(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeFishialResponse(response: FishialRecognitionResponse): FishRecognitionResult {
  const definitions = response.definitions ?? {};
  const objects = (response.objects ?? []).map((object) => ({
    bbox: normalizeBoundingBox(object.bbox),
    shape: object.shape,
    species: (object.species ?? []).map((candidate) => {
      const definition = definitions[candidate.id] ?? {
        commonName: "Unbekannte Art",
        scientificName: candidate.id
      };

      return {
        id: candidate.id,
        certainty: candidate.certainty,
        commonName: definition.commonName,
        scientificName: definition.scientificName,
        imageUrl: definition.imageUrl
      };
    })
  }));

  return {
    ok: true,
    queryToken: response.queryToken,
    objects
  };
}

function normalizeBoundingBox(bbox: number[] | undefined): [number, number, number, number] | undefined {
  if (!bbox || bbox.length !== 4) {
    return undefined;
  }

  return [bbox[0], bbox[1], bbox[2], bbox[3]];
}
