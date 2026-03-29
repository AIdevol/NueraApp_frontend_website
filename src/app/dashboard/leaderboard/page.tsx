"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";
import { useEffect, useState } from "react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  is_current_user?: boolean;
  avatar_url?: string | null;
  country?: string | null;
};

type Tab = "week" | "all";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("week");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${getPublicApiUrl()}/api/v1/leaderboard`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        if (!cancelled) setEntries(data.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load leaderboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-1">Leaderboard</h2>
          <p className="text-zinc-400 text-sm md:text-base">Compete with the community. Earn XP and streaks.</p>
        </div>
        <div className="flex gap-2 text-sm font-medium">
          <button
            type="button"
            onClick={() => setTab("week")}
            className={`px-3 py-1.5 rounded-full border ${tab === "week" ? "bg-primary/10 border-primary/20" : "bg-zinc-900/60 border-zinc-700 text-zinc-400"}`}
            style={tab === "week" ? { color: primary } : undefined}
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-3 py-1.5 rounded-full border ${tab === "all" ? "bg-primary/10 border-primary/20" : "bg-zinc-900/60 border-zinc-700 text-zinc-400"}`}
            style={tab === "all" ? { color: primary } : undefined}
          >
            All time
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="text-zinc-500 text-sm">Loading leaderboard…</span></div>
      ) : error ? (
        <div className="flex justify-center py-16"><span className="text-red-400 text-sm">{error}</span></div>
      ) : entries.length === 0 ? (
        <div className="flex justify-center py-16"><span className="text-zinc-500 text-sm">No entries yet.</span></div>
      ) : (
        <section className="glassmorphism rounded-xl border border-orange-500/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-orange-500/10 bg-[#0c0c0f]">
                  <th className="py-4 px-5 text-xs font-bold uppercase text-zinc-500 w-16">#</th>
                  <th className="py-4 px-5 text-xs font-bold uppercase text-zinc-500">Learner</th>
                  <th className="py-4 px-5 text-xs font-bold uppercase text-zinc-500 text-right">XP</th>
                  <th className="py-4 px-5 text-xs font-bold uppercase text-zinc-500 text-right">Streak</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr
                    key={row.rank}
                    className={`border-b border-zinc-800/60 hover:bg-zinc-800/20 ${row.is_current_user ? "bg-primary/5 border-l-4" : ""}`}
                    style={row.is_current_user ? { borderLeftColor: primary } : undefined}
                  >
                    <td className="py-4 px-5">
                      <span className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-sm font-bold ${row.rank <= 3 ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-medium text-zinc-100">
                      {row.name}
                      {row.is_current_user && <span className="ml-2 text-xs text-zinc-500">(you)</span>}
                    </td>
                    <td className="py-4 px-5 text-right font-semibold text-zinc-100">{row.xp.toLocaleString()} XP</td>
                    <td className="py-4 px-5 text-right text-zinc-300">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-amber-500 text-sm">local_fire_department</span>
                        {row.streak} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
