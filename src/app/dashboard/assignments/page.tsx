"use client";

import { useEffect, useState } from "react";

import { fetchHubJson, formatDate } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface AssignmentItem {
  id: string;
  title: string;
  course_title: string;
  due_at: string | null;
  status: string;
  points_possible: number;
  points_earned?: number | null;
  description: string;
}

export default function AssignmentsPage() {
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ assignments: AssignmentItem[] }>(
        "/assignments"
      );
      if (err) setError(err);
      else setItems(data?.assignments ?? []);
      setLoading(false);
    })();
  }, []);

  function statusStyle(s: string) {
    switch (s) {
      case "graded":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
      case "submitted":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
      case "overdue":
        return "bg-red-500/15 text-red-700 dark:text-red-300";
      default:
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Assignments
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Course work, deadlines, and grades — synced from{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/assignments</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading assignments…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {a.course_title}
                  </p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{a.title}</h2>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${statusStyle(a.status)}`}>
                  {a.status}
                </span>
              </div>
              {a.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{a.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">event</span>
                  Due {formatDate(a.due_at ?? undefined)}
                </span>
                <span>
                  Points: {a.points_earned != null ? `${a.points_earned} / ` : ""}
                  {a.points_possible}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
