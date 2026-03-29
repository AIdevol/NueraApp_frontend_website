"use client";

import { useEffect, useState } from "react";

import { fetchHubJson, formatDate } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  work_type: string;
  posted_at?: string | null;
  apply_url: string;
  salary_range?: string | null;
  stack: string[];
}

export default function JobsPage() {
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ jobs: JobItem[] }>("/jobs");
      if (err) setError(err);
      else setItems(data?.jobs ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Jobs</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Roles aligned with AI & engineering —{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/jobs</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading jobs…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((j) => (
            <article
              key={j.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 flex flex-col gap-3"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{j.title}</h2>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{j.company}</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {j.location}
                </span>
                <span className="capitalize">{j.work_type}</span>
                {j.posted_at && <span>Posted {formatDate(j.posted_at)}</span>}
              </div>
              {j.salary_range && (
                <p className="text-sm text-slate-600 dark:text-slate-300">{j.salary_range}</p>
              )}
              {j.stack?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {j.stack.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {j.apply_url && (
                <a
                  href={j.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium mt-1 hover:underline"
                  style={{ color: primary }}
                >
                  Apply <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
