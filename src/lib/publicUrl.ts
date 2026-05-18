/**
 * Public API base URL for the backend.
 * Set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:8000 or https://api.example.com).
 * When behind nginx on same host, use http://localhost or your public domain.
 */

function getEnvApiUrl(): string {
  if (typeof process === "undefined") return "";
  const url = process.env.NEXT_PUBLIC_API_URL;
  return typeof url === "string" && url.trim() ? url.trim().replace(/\/$/, "") : "";
}

/** Public backend API base URL (no trailing slash). Used for fetch() and redirects. */
export function getPublicApiUrl(): string {
  return getEnvApiUrl();
}

function isNgrokHost(url: string): boolean {
  return url.includes("ngrok-free.app") || url.includes("ngrok-free.dev") || url.includes("ngrok.io");
}

/** Plain-object headers for ngrok free tier (merge into fetch `headers`). */
export function getNgrokHeaders(): Record<string, string> {
  const base = getPublicApiUrl();
  if (base && isNgrokHost(base)) {
    return { "ngrok-skip-browser-warning": "true" };
  }
  return {};
}

/** Extra headers for browser fetch when the API is behind ngrok. */
export function getApiRequestHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  for (const [key, value] of Object.entries(getNgrokHeaders())) {
    headers.set(key, value);
  }
  return headers;
}

/** Fetch against the public API base with ngrok headers when needed. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getPublicApiUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  const normalizedPath = path.startsWith("/") ? path : `/api/v1/${path}`;
  const url = path.startsWith("http") ? path : `${base}${normalizedPath}`;
  return fetch(url, {
    ...init,
    headers: getApiRequestHeaders(init?.headers),
  });
}
