/**
 * Client-side learning path read progress (topics → subtopic indices).
 * Storage shape matches the Flutter app (`learning_topic_progress`) so the same
 * JSON schema can be reused if you ever sync accounts.
 */
const STORAGE_KEY = "learning_topic_progress";

type RawEntry = { c?: unknown; t?: unknown };

function parseMap(): Record<string, { c: number[]; t: number }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, RawEntry>;
    const out: Record<string, { c: number[]; t: number }> = {};
    for (const [k, v] of Object.entries(o)) {
      if (!v || typeof v !== "object") continue;
      const c = Array.isArray(v.c) ? v.c.map((x) => Number(x)).filter((n) => !Number.isNaN(n)) : [];
      const t = typeof v.t === "number" && v.t >= 0 ? v.t : 0;
      out[k] = { c: [...new Set(c)].sort((a, b) => a - b), t };
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, { c: number[]; t: number }>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export interface TopicProgressState {
  completed: number[];
  total: number;
}

export function getTopicProgress(topicKey: string): TopicProgressState {
  const m = parseMap();
  const p = m[topicKey];
  if (!p) return { completed: [], total: 0 };
  return { completed: [...p.c], total: p.t };
}

/** Linear completion 0–100 from counts (each subtopic counts equally). */
export function linearPercent(completedCount: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completedCount / total) * 100));
}

export function setTopicProgress(topicKey: string, completed: number[], total: number) {
  const m = parseMap();
  m[topicKey] = {
    c: [...new Set(completed)].sort((a, b) => a - b),
    t: total,
  };
  writeMap(m);
}

/** Idempotent: marks index as read (opening content counts toward linear %). */
export function markSubtopicRead(topicKey: string, index: number, total: number) {
  const cur = getTopicProgress(topicKey);
  const set = new Set(cur.completed);
  set.add(index);
  setTopicProgress(topicKey, [...set].sort((a, b) => a - b), total);
}

export function isSubtopicRead(topicKey: string, index: number): boolean {
  return getTopicProgress(topicKey).completed.includes(index);
}

/** Aggregate linear % across all topics that have a known total. */
export function getOverallPathPercent(topicKeys: string[]): number {
  let done = 0;
  let tot = 0;
  for (const k of topicKeys) {
    const p = getTopicProgress(k);
    if (p.total > 0) {
      done += p.completed.length;
      tot += p.total;
    }
  }
  if (tot <= 0) return 0;
  return Math.min(100, Math.round((done / tot) * 100));
}
