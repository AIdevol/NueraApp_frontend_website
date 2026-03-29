"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import {
  getOverallPathPercent,
  getTopicProgress,
  linearPercent,
} from "@/lib/learningPathProgress";
import { primary } from "@/lib/theme";
import Link from "next/link";
import { useCallback, useEffect, useReducer, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Topic {
  key: string;
  name: string;
  ai_note?: string;
}

export default function LearningPathPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  /** Bumps on navigation / tab focus so we re-read localStorage when returning from a topic. */
  const [, bumpProgressRead] = useReducer((x: number) => x + 1, 0);

  const fetchTopics = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/learning-path`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Failed to load learning path");
        return;
      }
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    bumpProgressRead();
  }, [pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") bumpProgressRead();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin" style={{ borderTopColor: primary }} />
        <p className="text-slate-500 dark:text-slate-400">Loading learning path…</p>
      </div>
    );
  }

  if (error && topics.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button type="button" onClick={() => fetchTopics()} className="px-4 py-2 rounded-xl font-medium text-white" style={{ backgroundColor: primary }}>Retry</button>
      </div>
    );
  }

  const topicKeys = topics.map((t) => t.key);
  let overallDone = 0;
  let overallTotal = 0;
  for (const k of topicKeys) {
    const p = getTopicProgress(k);
    if (p.total > 0) {
      overallDone += p.completed.length;
      overallTotal += p.total;
    }
  }
  const overallPct = getOverallPathPercent(topicKeys);

  return (
    <>
      <div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">Learning path</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
          Each lesson counts the same: completion is{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">lessons read ÷ total lessons</span> per topic.
        </p>
      </div>

      {overallTotal > 0 ? (
        <section
          className="glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6"
          aria-label="Overall learning path progress"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Overall path progress</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: primary }}>
              {overallPct}%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {overallDone} / {overallTotal} lessons read across topics you started
          </p>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${overallPct}%`, backgroundColor: primary }}
            />
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Topics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => {
            const p = getTopicProgress(topic.key);
            const pct = linearPercent(p.completed.length, p.total);
            const label =
              p.total > 0
                ? `${p.completed.length}/${p.total} subtopics read`
                : "Open topic to track progress";

            return (
              <Link
                key={topic.key}
                href={`/dashboard/learning-path/${encodeURIComponent(topic.key)}`}
                className="group glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary/50 transition-colors flex flex-col gap-3"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/20"
                    style={{ color: primary }}
                  >
                    <span className="material-symbols-outlined text-2xl">route</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:underline truncate">
                      {topic.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                    {topic.ai_note ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        AI note: {topic.ai_note}
                      </p>
                    ) : null}
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary shrink-0">
                    arrow_forward
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Completion</span>
                  <span className="font-bold tabular-nums" style={{ color: primary }}>
                    {p.total > 0 ? `${pct}%` : "—"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-300 ease-out"
                    style={{
                      width: `${p.total > 0 ? pct : 0}%`,
                      backgroundColor: primary,
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
