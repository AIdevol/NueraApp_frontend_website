/**
 * WebSocket URL builder (uses public API URL; ws/wss from http/https).
 */

import { getPublicApiUrl } from "../publicUrl";

export function getWsUrl(path: string, token?: string | null): string {
  const base = getPublicApiUrl();
  const protocol = base.startsWith("https") ? "wss" : "ws";
  const host =
    base.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.host : "localhost:8000");
  const url = `${protocol}://${host}${path}`;
  if (token) {
    return `${url}?token=${encodeURIComponent(token)}`;
  }
  return url;
}
