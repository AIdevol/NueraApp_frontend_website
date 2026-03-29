"use client";

import {
  getTopicProgress,
  linearPercent,
  markSubtopicRead,
  setTopicProgress,
} from "@/lib/learningPathProgress";
import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface TopicItem {
  name: string;
  value: string;
  ai_note?: string;
}

export default function LearningPathTopicPage() {
  const router = useRouter();
  const params = useParams();
  const topicKey = typeof params.topicKey === "string" ? params.topicKey : "";
  const [topicName, setTopicName] = useState("");
  const [subtopics, setSubtopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());

  const fetchSubtopics = useCallback(async () => {
    if (!topicKey) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/learning-path/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic_key: topicKey }),
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Failed to load subtopics");
        return;
      }
      const data = await res.json();
      setTopicName(data.name ?? topicKey);
      const list: TopicItem[] = data.topics ?? [];
      setSubtopics(list);
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }, [topicKey, router]);

  useEffect(() => {
    fetchSubtopics();
  }, [fetchSubtopics]);

  useEffect(() => {
    if (!topicKey || subtopics.length === 0) return;
    const p = getTopicProgress(topicKey);
    setTopicProgress(topicKey, p.completed, subtopics.length);
    const next = getTopicProgress(topicKey);
    setCompleted(new Set(next.completed));
  }, [topicKey, subtopics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin" style={{ borderTopColor: primary }} />
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  const displayName = topicName || topicKey.replace(/_/g, " ");
  const total = subtopics.length;
  const done = completed.size;
  const topicPct = linearPercent(done, total);

  const handleOpenLesson = (index: number, contentUrl: string) => {
    markSubtopicRead(topicKey, index, total);
    setCompleted(new Set(getTopicProgress(topicKey).completed));
    router.push(contentUrl);
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/learning-path" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: primary }}>
          <span className="material-symbols-outlined text-lg">arrow_back</span>Learning path
        </Link>
      </div>
      <div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1 capitalize">{displayName}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
          Linear progress: each subtopic is worth {total > 0 ? `${(100 / total).toFixed(1)}%` : "—"} of this topic.
        </p>
      </div>

      {error && subtopics.length === 0 ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button type="button" onClick={() => fetchSubtopics()} className="px-4 py-2 rounded-xl font-medium text-white" style={{ backgroundColor: primary }}>Retry</button>
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          {total > 0 ? (
            <div
              className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/40 p-4 backdrop-blur-sm"
              aria-label="Topic completion"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">This topic</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: primary }}>
                  {topicPct}%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {done} / {total} lessons read
              </p>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${topicPct}%`, backgroundColor: primary }}
                />
              </div>
            </div>
          ) : null}

          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Subtopics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subtopics.map((item, index) => {
              const slug = item.value.trim().replace(/\s+/g, "-");
              const contentUrl = `/dashboard/content/${encodeURIComponent(slug)}?topic=${encodeURIComponent(topicKey)}`;
              const read = completed.has(index);
              const rowPct = read ? 100 : 0;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleOpenLesson(index, contentUrl)}
                  className="text-left glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-2 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-xl shrink-0 ${read ? "" : "opacity-80"}`}
                      style={{ color: primary }}
                    >
                      {read ? "check_circle" : "menu_book"}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 flex-1 min-w-0">{item.name}</span>
                    <span className="text-xs font-bold tabular-nums shrink-0 w-10 text-right" style={{ color: primary }}>
                      {rowPct}%
                    </span>
                    <span className="material-symbols-outlined text-slate-400 shrink-0 text-lg">article</span>
                  </div>
                  {item.ai_note ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-9">
                      AI note: {item.ai_note}
                    </p>
                  ) : null}
                  <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden pl-9">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${rowPct}%`,
                        backgroundColor: primary,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
