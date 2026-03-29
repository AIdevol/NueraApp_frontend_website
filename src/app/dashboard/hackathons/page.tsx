"use client";

import { useEffect, useState } from "react";

import { fetchHubJson, formatDate } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface HackathonItem {
  id: string;
  title: string;
  theme: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string;
  prize_summary: string;
  registration_url: string;
  status: string;
  team_size_max: number;
}

function statusBadge(status: string) {
  switch (status) {
    case "live":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "ended":
      return "bg-slate-500/15 text-slate-600 dark:text-slate-400";
    default:
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  }
}

export default function HackathonsPage() {
  const [items, setItems] = useState<HackathonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ hackathons: HackathonItem[] }>(
        "/hackathons"
      );
      if (err) setError(err);
      else setItems(data?.hackathons ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Hackathons
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Compete and build —{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/hackathons</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading hackathons…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((h) => (
            <article
              key={h.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{h.title}</h2>
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${statusBadge(h.status)}`}>
                  {h.status}
                </span>
              </div>
              {h.theme && (
                <p className="text-sm" style={{ color: primary }}>
                  Theme: {h.theme}
                </p>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  {formatDate(h.starts_at ?? undefined)}
                  {h.ends_at && ` → ${formatDate(h.ends_at)}`}
                </p>
                <p className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {h.location}
                </p>
                <p>Teams up to {h.team_size_max}</p>
              </div>
              {h.prize_summary && (
                <p className="text-sm text-slate-600 dark:text-slate-300">{h.prize_summary}</p>
              )}
              {h.registration_url && (
                <a
                  href={h.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium mt-1 hover:underline inline-flex items-center gap-1"
                  style={{ color: primary }}
                >
                  Register <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
