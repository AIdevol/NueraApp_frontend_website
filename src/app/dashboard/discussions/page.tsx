"use client";

import { useEffect, useState } from "react";

import { fetchHubJson, formatDate } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface DiscussionItem {
  id: string;
  title: string;
  category: string;
  author_display: string;
  replies_count: number;
  last_activity_at: string | null;
  excerpt: string;
  pinned: boolean;
}

export default function DiscussionsPage() {
  const [items, setItems] = useState<DiscussionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ discussions: DiscussionItem[] }>(
        "/discussions"
      );
      if (err) setError(err);
      else setItems(data?.discussions ?? []);
      setLoading(false);
    })();
  }, []);

  const sorted = [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const ta = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
    const tb = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
    return tb - ta;
  });

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Discussions
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Community threads —{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/discussions</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading discussions…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((d) => (
            <article
              key={d.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {d.pinned && (
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-primary/15" style={{ color: primary }}>
                      Pinned
                    </span>
                  )}
                  <span className="text-xs uppercase text-slate-500 dark:text-slate-400">{d.category}</span>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {d.last_activity_at ? formatDate(d.last_activity_at) : "—"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{d.title}</h2>
              {d.excerpt && <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{d.excerpt}</p>}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>{d.author_display}</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">chat</span>
                  {d.replies_count} replies
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
