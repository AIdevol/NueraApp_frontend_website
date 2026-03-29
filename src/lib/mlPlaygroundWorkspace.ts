/**
 * ML Playground workspace sync with the backend API (scalable persistence).
 * Falls back to localStorage migration when the server has an empty workspace
 * but the browser still has legacy data.
 */

import { bearerAuthHeaders } from "@/lib/authHeaders";
import { getPublicApiUrl } from "@/lib/publicUrl";

export const WORKSPACE_VERSION = 1;

export function workspaceStorageKey(projectId: string) {
  return `ml-playground-workspace:${projectId}`;
}

export interface HyperParamsShape {
  learningRate: string;
  batchSize: string;
  epochs: string;
  optimizer: string;
  dropout: string;
  hiddenSize: string;
}

/** Loose file tree node (matches playground FSNode). */
export type FSNodeJson =
  | { kind: "file"; id: string; name: string; content: string }
  | { kind: "folder"; id: string; name: string; children: FSNodeJson[]; open: boolean };

export interface WorkspacePayload {
  version: number;
  tree: FSNodeJson[];
  hyperParams: HyperParamsShape;
  datasets: { name: string; size: number }[];
  openTabIds: string[];
  openFileId: string | null;
}

export interface WorkspaceApiResponse {
  project_id: string;
  version: number;
  updated_at: string | null;
  payload: WorkspacePayload;
}

const defaultHyperParams = (): HyperParamsShape => ({
  learningRate: "",
  batchSize: "",
  epochs: "",
  optimizer: "",
  dropout: "",
  hiddenSize: "",
});

export function emptyWorkspacePayload(): WorkspacePayload {
  return {
    version: WORKSPACE_VERSION,
    tree: [],
    hyperParams: defaultHyperParams(),
    datasets: [],
    openTabIds: [],
    openFileId: null,
  };
}

export function isEffectivelyEmptyWorkspace(w: WorkspacePayload): boolean {
  if (w.tree.length > 0 || w.datasets.length > 0) return false;
  const hp = w.hyperParams || defaultHyperParams();
  return !Object.values(hp).some((v) => (v ?? "").toString().trim());
}

function apiBase(): string {
  const base = getPublicApiUrl();
  if (!base) return "";
  return `${base}/api/v1`;
}

export async function fetchWorkspace(
  projectId: string
): Promise<WorkspaceApiResponse | null> {
  const base = apiBase();
  if (!base) return null;
  const res = await fetch(
    `${base}/playground/${encodeURIComponent(projectId)}/workspace`,
    { cache: "no-store", headers: { ...bearerAuthHeaders() } }
  );
  if (!res.ok) return null;
  return (await res.json()) as WorkspaceApiResponse;
}

export async function putWorkspace(
  projectId: string,
  payload: WorkspacePayload
): Promise<{ ok: boolean; detail?: string }> {
  const base = apiBase();
  if (!base) return { ok: false, detail: "NEXT_PUBLIC_API_URL not set" };
  try {
    const res = await fetch(
      `${base}/playground/${encodeURIComponent(projectId)}/workspace`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...bearerAuthHeaders(),
        },
        body: JSON.stringify({ payload }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        detail: typeof err?.detail === "string" ? err.detail : res.statusText,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : "Network error",
    };
  }
}

/** Parse legacy localStorage JSON (may be partial). */
export function parseLocalWorkspace(raw: string): WorkspacePayload | null {
  try {
    const w = JSON.parse(raw) as Partial<WorkspacePayload>;
    if (w.version !== WORKSPACE_VERSION || !Array.isArray(w.tree)) return null;
    return {
      version: WORKSPACE_VERSION,
      tree: w.tree as FSNodeJson[],
      hyperParams: { ...defaultHyperParams(), ...w.hyperParams },
      datasets: Array.isArray(w.datasets) ? w.datasets : [],
      openTabIds: Array.isArray(w.openTabIds) ? w.openTabIds : [],
      openFileId: w.openFileId ?? null,
    };
  } catch {
    return null;
  }
}
