"use client";

import { useEffect, useState } from "react";

import { fetchHubJson } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface InterviewPrepItem {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  description: string;
}

export default function InterviewPrepPage() {
  const [items, setItems] = useState<InterviewPrepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ items: InterviewPrepItem[] }>(
        "/interview-prep"
      );
      if (err) setError(err);
      else setItems(data?.items ?? []);
      setLoading(false);
    })();
  }, []);

  const byCat = items.reduce<Record<string, InterviewPrepItem[]>>((acc, it) => {
    const k = it.category || "other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(it);
    return acc;
  }, {});

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Interview Prep
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Practice modules by category —{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/interview-prep</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading prep modules…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {Object.entries(byCat)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, list]) => (
            <section key={cat}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 capitalize">
                {cat.replace(/_/g, " ")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((it) => (
                  <article
                    key={it.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{it.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{it.difficulty}</span>
                      <span>·</span>
                      <span>{it.duration_minutes} min</span>
                    </div>
                    {it.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{it.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
