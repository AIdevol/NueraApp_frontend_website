import { getPublicApiUrl } from "@/lib/publicUrl";

/** User's local calendar date YYYY-MM-DD (matches profile heatmap cells). */
export function localCalendarDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Records one lesson read for today (deduped per content per day in sessionStorage).
 * Uses the user's local date so the profile heatmap lines up with colored boxes.
 */
export async function recordLessonActivityForHeatmap(contentDedupeKey: string): Promise<void> {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("token");
  if (!token) return;

  const date = localCalendarDateString();
  const dedupeKey = `neura_learning_activity_${date}_${contentDedupeKey}`;
  if (sessionStorage.getItem(dedupeKey)) return;

  try {
    const res = await fetch(`${getPublicApiUrl()}/api/v1/streak/activity`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count: 1, activity_date: date }),
    });
    if (res.ok) {
      sessionStorage.setItem(dedupeKey, "1");
    }
  } catch {
    // non-blocking
  }
}
