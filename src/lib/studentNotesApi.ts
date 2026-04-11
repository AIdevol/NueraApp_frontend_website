import { bearerAuthHeaders } from "@/lib/authHeaders";
import { getPublicApiUrl } from "@/lib/publicUrl";

export type NoteSummary = {
  id: number;
  title: string;
  updated_at: string | null;
};

export type NoteDetail = NoteSummary & {
  scene_json: string | null;
  created_at: string | null;
};

function detailFromResponse(json: unknown): string {
  if (json && typeof json === "object" && "detail" in json) {
    const d = (json as { detail?: unknown }).detail;
    if (typeof d === "string") return d;
  }
  return "Request failed";
}

export async function fetchNotesList(): Promise<
  { ok: true; data: NoteSummary[] } | { ok: false; status: number; detail: string }
> {
  const base = getPublicApiUrl();
  if (!base) return { ok: false, status: 0, detail: "API URL not configured (NEXT_PUBLIC_API_URL)." };
  const res = await fetch(`${base}/api/v1/notes`, {
    headers: { ...bearerAuthHeaders() },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, detail: detailFromResponse(json) };
  return { ok: true, data: json as NoteSummary[] };
}

export async function fetchNote(id: number): Promise<
  { ok: true; data: NoteDetail } | { ok: false; status: number; detail: string }
> {
  const base = getPublicApiUrl();
  if (!base) return { ok: false, status: 0, detail: "API URL not configured (NEXT_PUBLIC_API_URL)." };
  const res = await fetch(`${base}/api/v1/notes/${id}`, {
    headers: { ...bearerAuthHeaders() },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, detail: detailFromResponse(json) };
  return { ok: true, data: json as NoteDetail };
}

export async function createNote(payload?: {
  title?: string;
  scene_json?: string | null;
}): Promise<{ ok: true; data: NoteDetail } | { ok: false; status: number; detail: string }> {
  const base = getPublicApiUrl();
  if (!base) return { ok: false, status: 0, detail: "API URL not configured (NEXT_PUBLIC_API_URL)." };
  const res = await fetch(`${base}/api/v1/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...bearerAuthHeaders(),
    },
    body: JSON.stringify(payload ?? {}),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, detail: detailFromResponse(json) };
  return { ok: true, data: json as NoteDetail };
}

export async function patchNote(
  id: number,
  payload: { title?: string | null; scene_json?: string | null }
): Promise<{ ok: true; data: NoteDetail } | { ok: false; status: number; detail: string }> {
  const base = getPublicApiUrl();
  if (!base) return { ok: false, status: 0, detail: "API URL not configured (NEXT_PUBLIC_API_URL)." };
  const res = await fetch(`${base}/api/v1/notes/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...bearerAuthHeaders(),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, detail: detailFromResponse(json) };
  return { ok: true, data: json as NoteDetail };
}

export async function deleteNote(
  id: number
): Promise<{ ok: true } | { ok: false; status: number; detail: string }> {
  const base = getPublicApiUrl();
  if (!base) return { ok: false, status: 0, detail: "API URL not configured (NEXT_PUBLIC_API_URL)." };
  const res = await fetch(`${base}/api/v1/notes/${id}`, {
    method: "DELETE",
    headers: { ...bearerAuthHeaders() },
  });
  if (res.status === 204) return { ok: true };
  const json = await res.json().catch(() => ({}));
  return { ok: false, status: res.status, detail: detailFromResponse(json) };
}
