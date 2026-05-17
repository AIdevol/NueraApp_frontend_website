import { getPublicApiUrl } from "@/lib/publicUrl";

const ADMIN_TOKEN_KEY = "admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

/** Decode JWT payload (no signature verification — UI gating only). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** True when the admin dashboard JWT is stored and declares `role: "admin"`. */
export function hasAdminSession(): boolean {
  const t = getAdminToken();
  if (!t) return false;
  const payload = decodeJwtPayload(t);
  return payload?.role === "admin";
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function adminAuthHeaders(): HeadersInit {
  const t = getAdminToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; detail: string }> {
  const base = getPublicApiUrl();
  if (!base) {
    return { ok: false, status: 0, detail: "NEXT_PUBLIC_API_URL is not set." };
  }
  const res = await fetch(`${base}/api/v1${path}`, {
    ...init,
    headers: { ...adminAuthHeaders(), ...init?.headers },
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  if (res.status === 204) {
    return { ok: true, data: undefined as T };
  }
  if (!res.ok) {
    const detail =
      typeof json === "object" && json && "detail" in json && typeof (json as { detail: unknown }).detail === "string"
        ? (json as { detail: string }).detail
        : text || "Request failed";
    return { ok: false, status: res.status, detail };
  }
  return { ok: true, data: json as T };
}
