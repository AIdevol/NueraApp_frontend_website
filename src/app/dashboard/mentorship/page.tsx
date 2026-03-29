"use client";

import { useEffect, useState } from "react";

import { fetchHubJson } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface MentorshipItem {
  id: string;
  mentor_name: string;
  title: string;
  focus_areas: string[];
  bio: string;
  slots_available: number;
  session_type: string;
  book_url: string;
}

export default function MentorshipPage() {
  const [items, setItems] = useState<MentorshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ mentors: MentorshipItem[] }>(
        "/mentorships"
      );
      if (err) setError(err);
      else setItems(data?.mentors ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mentorship
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Book time with mentors —{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/mentorships</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading mentors…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: primary }}
                >
                  {m.mentor_name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">{m.mentor_name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{m.title}</p>
                </div>
              </div>
              {m.bio && <p className="text-sm text-slate-600 dark:text-slate-300">{m.bio}</p>}
              {m.focus_areas?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.focus_areas.map((f) => (
                    <span
                      key={f}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="capitalize">{m.session_type} sessions</span>
                <span>{m.slots_available} slots open</span>
              </div>
              {m.book_url && (
                <a
                  href={m.book_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: primary }}
                >
                  Book session
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
