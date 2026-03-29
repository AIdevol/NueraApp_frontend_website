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
