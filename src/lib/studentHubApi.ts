/**
 * Types + helpers for student/career hub APIs (assignments, quizzes, etc.).
 */

import { getNgrokHeaders, getPublicApiUrl } from "@/lib/publicUrl";

export async function fetchHubJson<T>(path: string): Promise<{ data: T | null; error: string }> {
  const base = getPublicApiUrl();
  if (!base) {
    return { data: null, error: "API URL not configured (NEXT_PUBLIC_API_URL)." };
  }
  try {
    const res = await fetch(`${base}/api/v1${path}`, {
      cache: "no-store",
      headers: getNgrokHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        data: null,
        error: typeof (json as { detail?: string }).detail === "string"
          ? (json as { detail: string }).detail
          : "Request failed",
      };
    }
    return { data: json as T, error: "" };
  } catch {
    return { data: null, error: "Connection error." };
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
