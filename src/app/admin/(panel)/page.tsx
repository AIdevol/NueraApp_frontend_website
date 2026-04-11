"use client";

import { ContentMixPie, SignupsBarChart, TrafficAreaChart } from "@/components/admin/AdminCharts";
import { adminFetch } from "@/lib/adminApi";
import { primary } from "@/lib/theme";
import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  total_users: number;
  active_users: number;
  visits_today: number;
  visits_last_7_days: { day: string; visits: number }[];
  visits_last_30_days: { day: string; visits: number }[];
  signups_last_30_days: { day: string; signups: number }[];
  total_student_notes: number;
  total_projects: number;
};

const quickLinks = [
  { href: "/admin/users", label: "Users", desc: "Activate accounts & roles", accent: "from-orange-500/20 to-orange-600/5" },
  { href: "/admin/content", label: "Content", desc: "Notes & ML projects", accent: "from-emerald-500/20 to-emerald-600/5" },
  { href: "/admin/problems", label: "Practice", desc: "Create & remove problems", accent: "from-violet-500/20 to-violet-600/5" },
  { href: "/admin/analytics", label: "Analytics", desc: "Traffic detail & ranges", accent: "from-sky-500/20 to-sky-600/5" },
] as const;

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const r = await adminFetch<Stats>("/admin/stats");
      if (!r.ok) {
        setError(r.detail);
        return;
      }
      setStats(r.data);
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-red-300">
        {error}{" "}
        <Link href="/admin/login" className="underline" style={{ color: primary }}>
          Sign in again
        </Link>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500"
            aria-hidden
          />
          <p className="text-sm text-zinc-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const inactive = Math.max(0, stats.total_users - stats.active_users);
  const pieSegments = [
    { name: "Student notes", value: stats.total_student_notes },
    { name: "ML projects", value: stats.total_projects },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Traffic, sign-ups, and content at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Registered users" value={stats.total_users} color={primary} />
        <StatCard label="Active accounts" value={stats.active_users} className="text-emerald-400" />
        <StatCard label="Inactive" value={inactive} className="text-amber-400/90" />
        <StatCard label="Student notes" value={stats.total_student_notes} className="text-orange-300" />
        <StatCard label="ML projects" value={stats.total_projects} className="text-sky-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800/80 bg-linear-to-br from-zinc-900/80 to-zinc-950 p-5 shadow-lg shadow-black/20 lg:col-span-2">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">Traffic</h2>
            <span className="text-xs text-zinc-500">Today: {stats.visits_today} visits</span>
          </div>
          <p className="mb-4 text-xs text-zinc-600">Page views (analytics beacon) — last 30 days</p>
          <TrafficAreaChart data={stats.visits_last_30_days} />
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-linear-to-br from-zinc-900/80 to-zinc-950 p-5 shadow-lg shadow-black/20">
          <h2 className="text-sm font-semibold text-zinc-200">Content mix</h2>
          <p className="mb-2 text-xs text-zinc-600">Learner-created artifacts</p>
          <ContentMixPie segments={pieSegments} />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/80 bg-linear-to-br from-zinc-900/80 to-zinc-950 p-5 shadow-lg shadow-black/20">
        <h2 className="text-sm font-semibold text-zinc-200">New registrations</h2>
        <p className="mb-4 text-xs text-zinc-600">Accounts created per day — last 30 days</p>
        <SignupsBarChart data={stats.signups_last_30_days} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-400">Manage</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className={`group rounded-2xl border border-zinc-800 bg-linear-to-br ${q.accent} p-4 transition hover:border-orange-500/30 hover:shadow-md hover:shadow-orange-500/5`}
            >
              <p className="text-sm font-semibold text-zinc-100 group-hover:text-orange-200">{q.label}</p>
              <p className="mt-1 text-xs text-zinc-500">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-300">Last 7 days (compact)</h2>
        <div className="mt-4 flex h-32 items-end gap-1">
          {(() => {
            const maxVisits = Math.max(1, ...stats.visits_last_7_days.map((d) => d.visits));
            return stats.visits_last_7_days.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full max-w-[40px] rounded-t bg-orange-500/75"
                  style={{ height: `${(d.visits / maxVisits) * 100}%`, minHeight: d.visits ? 4 : 0 }}
                  title={`${d.day}: ${d.visits}`}
                />
                <span className="text-[10px] text-zinc-600">{d.day.slice(5)}</span>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  className = "",
}: {
  label: string;
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${className}`}
        style={className ? undefined : color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
