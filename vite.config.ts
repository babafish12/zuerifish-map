import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

const FISHIAL_API_BASE_URL = "https://api-recognition.fishial.ai";
const FISHIAL_MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const FISHIAL_TOKEN_TTL_MS = 9 * 60 * 1000;

type EnvLookup = (key: string) => string | undefined;

interface FishialTokenCache {
  token: string | null;
  expiresAt: number;
}

interface FishialAuthResponse {
  access_token?: string;
  token_type?: string;
  ok?: false;
  error?: string;
  message?: string;
}

interface FishialErrorResponse {
  ok: false;
  error: string;
  message: string;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      fishialRecognitionProxy((key) => process.env[key] ?? env[key])
    ],
    test: {
      environment: "jsdom",
      setupFiles: "./vitest.setup.ts"
    }
  };
});

function fishialRecognitionProxy(getEnv: EnvLookup): Plugin {
  const tokenCache: FishialTokenCache = {
    token: null,
    expiresAt: 0
  };

  return {
    name: "zuerifish-fishial-recognition-proxy",
    configureServer(server) {
      server.middlewares.use("/api/fish-recognition", createFishialRecognitionMiddleware(getEnv, tokenCache));
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/fish-recognition", createFishialRecognitionMiddleware(getEnv, tokenCache));
    }
  };
}

function createFishialRecognitionMiddleware(getEnv: EnvLookup, tokenCache: FishialTokenCache): Connect.NextHandleFunction {
  return async (request, response) => {
    if (request.method !== "POST") {
      sendJson(response, 405, {
        ok: false,
        error: "method_not_allowed",
        message: "Fischbilder müssen per POST gesendet werden."
      });
      return;
    }

    const clientId = getEnv("FISHIAL_CLIENT_ID");
    const clientSecret = getEnv("FISHIAL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      sendJson(response, 503, {
        ok: false,
        error: "fishial_not_configured",
        message: "Fishial ist nicht konfiguriert. Setze FISHIAL_CLIENT_ID und FISHIAL_CLIENT_SECRET auf dem Server."
      });
      return;
    }

    const contentType = request.headers["content-type"] ?? "";

    if (!isAllowedImageContentType(contentType)) {
      sendJson(response, 415, {
        ok: false,
        error: "unsupported_file_format",
        message: "Bitte ein unterstütztes Bildformat hochladen."
      });
      return;
    }

    try {
      const imageBody = await readRequestBody(request, FISHIAL_MAX_IMAGE_BYTES);
      const token = await getFishialAccessToken(clientId, clientSecret, tokenCache);
      const recognitionResponse = await recognizeWithFishial(imageBody, contentType, token);

      if (recognitionResponse.status === 401) {
        tokenCache.token = null;
        tokenCache.expiresAt = 0;
        const refreshedToken = await getFishialAccessToken(clientId, clientSecret, tokenCache);
        const retryResponse = await recognizeWithFishial(imageBody, contentType, refreshedToken);
        await forwardFishialResponse(response, retryResponse);
        return;
      }

      await forwardFishialResponse(response, recognitionResponse);
    } catch (error) {
      const mappedError = mapProxyError(error);
      sendJson(response, mappedError.status, mappedError.body);
    }
  };
}

async function getFishialAccessToken(clientId: string, clientSecret: string, tokenCache: FishialTokenCache): Promise<string> {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const response = await fetch(`${FISHIAL_API_BASE_URL}/v2/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const payload = (await parseJson(response)) as FishialAuthResponse | null;

  if (!response.ok || !payload?.access_token) {
    throw new ProxyRequestError(payload?.message ?? "Fishial-Authentifizierung ist fehlgeschlagen.", payload?.error ?? "fishial_auth_failed", 502);
  }

  tokenCache.token = payload.access_token;
  tokenCache.expiresAt = Date.now() + FISHIAL_TOKEN_TTL_MS;
  return payload.access_token;
}

function recognizeWithFishial(imageBody: Buffer, contentType: string, token: string): Promise<Response> {
  const body = imageBody.buffer.slice(imageBody.byteOffset, imageBody.byteOffset + imageBody.byteLength) as ArrayBuffer;

  return fetch(`${FISHIAL_API_BASE_URL}/v2/recognize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType
    },
    body
  });
}

async function forwardFishialResponse(response: ServerResponse, fishialResponse: Response) {
  const payload = await parseJson(fishialResponse);

  if (!payload) {
    sendJson(response, fishialResponse.ok ? 502 : fishialResponse.status, {
      ok: false,
      error: "fishial_invalid_response",
      message: `Fishial hat HTTP ${fishialResponse.status} ohne lesbare JSON-Antwort geliefert.`
    });
    return;
  }

  sendJson(response, fishialResponse.status, payload);
}

function readRequestBody(request: IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    request.on("data", (chunk: Buffer) => {
      size += chunk.length;

      if (size > maxBytes) {
        reject(new ProxyRequestError("Das Bild ist zu gross. Fishial akzeptiert maximal 20 MB.", "payload_too_large", 413));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      if (size === 0) {
        reject(new ProxyRequestError("Bitte ein Bild hochladen.", "empty_image", 400));
        return;
      }

      resolve(Buffer.concat(chunks));
    });

    request.on("error", () => {
      reject(new ProxyRequestError("Das Bild konnte nicht gelesen werden.", "request_read_failed", 400));
    });
  });
}

async function parseJson(response: Response): Promise<unknown | null> {
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

function isAllowedImageContentType(contentType: string | string[]): boolean {
  if (Array.isArray(contentType)) {
    return contentType.some(isAllowedImageContentType);
  }

  const normalized = contentType.split(";")[0].trim().toLowerCase();
  return normalized.startsWith("image/") || normalized === "application/octet-stream";
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function mapProxyError(error: unknown): { status: number; body: FishialErrorResponse } {
  if (error instanceof ProxyRequestError) {
    return {
      status: error.status,
      body: {
        ok: false,
        error: error.code,
        message: error.message
      }
    };
  }

  return {
    status: 502,
    body: {
      ok: false,
      error: "fishial_proxy_failed",
      message: "Die Online-Erkennung ist aktuell nicht erreichbar."
    }
  };
}

class ProxyRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ProxyRequestError";
    this.code = code;
    this.status = status;
  }
}
