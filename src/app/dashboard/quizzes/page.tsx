"use client";

import { useEffect, useState } from "react";

import { fetchHubJson } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface QuizItem {
  id: string;
  title: string;
  topic: string;
  duration_minutes: number;
  questions_count: number;
  status: string;
  best_score_percent?: number | null;
}

export default function QuizzesPage() {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ quizzes: QuizItem[] }>("/quizzes");
      if (err) setError(err);
      else setItems(data?.quizzes ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Quizzes</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Timed checks across topics —{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/quizzes</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading quizzes…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((q) => (
            <article
              key={q.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 flex flex-col gap-3"
            >
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: primary }}>
                {q.topic}
              </div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">{q.title}</h2>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {q.duration_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">help</span>
                  {q.questions_count} Qs
                </span>
                <span className="capitalize">{q.status.replace("_", " ")}</span>
              </div>
              {q.best_score_percent != null && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Best score: {q.best_score_percent}%
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
