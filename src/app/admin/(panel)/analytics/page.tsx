"use client";

import { TrafficAreaChart, type TrafficPoint } from "@/components/admin/AdminCharts";
import { adminFetch } from "@/lib/adminApi";
import { primary } from "@/lib/theme";
import { useCallback, useEffect, useState } from "react";

const RANGES = [7, 30, 90] as const;

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [points, setPoints] = useState<TrafficPoint[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (n: number) => {
    setError("");
    setLoading(true);
    const r = await adminFetch<TrafficPoint[]>(`/admin/traffic/daily?days=${n}`);
    setLoading(false);
    if (!r.ok) {
      setError(r.detail);
      return;
    }
    setPoints(r.data);
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const total = points.reduce((s, d) => s + d.visits, 0);
  const peak = points.reduce((m, d) => Math.max(m, d.visits), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500">Site traffic from the analytics beacon (per day).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDays(n)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                days === n
                  ? "text-white shadow-lg shadow-orange-500/20"
                  : "border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
              style={days === n ? { background: primary } : undefined}
            >
              {n} days
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Period visits</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-100">{loading ? "…" : total}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Peak day</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-orange-400">{loading ? "…" : peak}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Avg / day</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-sky-400">
            {loading ? "…" : points.length ? Math.round((total / points.length) * 10) / 10 : 0}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/80 bg-linear-to-br from-zinc-900/80 to-zinc-950 p-5 shadow-lg shadow-black/20">
        <h2 className="text-sm font-semibold text-zinc-200">Traffic over time</h2>
        <p className="mb-4 text-xs text-zinc-600">Each point is total page views for that calendar day.</p>
        {loading && points.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-zinc-500">Loading chart…</div>
        ) : (
          <TrafficAreaChart data={points} />
        )}
      </div>
    </div>
  );
}
