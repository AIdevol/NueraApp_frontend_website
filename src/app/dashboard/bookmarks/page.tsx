"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchHubJson, formatDate } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface BookmarkItem {
  id: string;
  title: string;
  resource_type: string;
  href: string;
  saved_at: string | null;
  notes: string;
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function BookmarksPage() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ bookmarks: BookmarkItem[] }>(
        "/bookmarks"
      );
      if (err) setError(err);
      else setItems(data?.bookmarks ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Bookmarks
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Saved content —{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/bookmarks</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading bookmarks…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((b) => {
            const href = b.href || "#";
            const external = isExternal(href);
            const inner = (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {b.resource_type}
                  </span>
                  {b.saved_at && (
                    <span className="text-xs text-slate-500">Saved {formatDate(b.saved_at)}</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:underline">
                  {b.title}
                </h2>
                {b.notes && <p className="text-sm text-slate-600 dark:text-slate-400">{b.notes}</p>}
                <span className="text-xs font-medium inline-flex items-center gap-1" style={{ color: primary }}>
                  Open
                  <span className="material-symbols-outlined text-sm">
                    {external ? "open_in_new" : "chevron_right"}
                  </span>
                </span>
              </>
            );
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 group"
              >
                {external ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                    {inner}
                  </a>
                ) : (
                  <Link href={href} className="block">
                    {inner}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
