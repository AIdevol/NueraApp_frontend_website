"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardWelcome } from "@/components/DashboardWelcome";
import { bearerAuthHeaders } from "@/lib/authHeaders";
import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

type Stats = {
  total_xp: number;
  streak_days: number;
  courses_enrolled: number;
  lessons_completed: number;
  in_progress_count: number;
  achievements_count: number;
};

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const headers = bearerAuthHeaders();
    if (!headers.Authorization) return;

    Promise.all([
      fetch(`${getPublicApiUrl()}/api/v1/profile/stats`, { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${getPublicApiUrl()}/api/v1/streak`, { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([profileStats, streakData]) => {
        if (cancelled) return;
        setStats({
          total_xp: profileStats?.total_xp ?? 0,
          streak_days: streakData?.streak_days ?? profileStats?.streak_days ?? 0,
          courses_enrolled: profileStats?.courses_enrolled ?? 0,
          lessons_completed: profileStats?.lessons_completed ?? 0,
          in_progress_count: profileStats?.in_progress_count ?? 0,
          achievements_count: profileStats?.achievements_count ?? 0,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const streak = stats?.streak_days ?? 0;
  const xp = stats?.total_xp ?? 0;
  const lessons = stats?.lessons_completed ?? 0;
  const courses = stats?.courses_enrolled ?? 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <DashboardWelcome />
          <p className="text-zinc-400 text-sm md:text-base">
            Ready to master the next generation of AI architectures?
          </p>
        </div>
        <div className="flex gap-2 text-sm font-medium">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20" style={{ color: primary }}>
            <span className="material-symbols-outlined text-base">local_fire_department</span>
            <span>{streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 text-zinc-300 border border-orange-500/15">
            <span className="material-symbols-outlined text-base">stars</span>
            <span>{xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Streak", value: `${streak} days`, icon: "local_fire_department" },
          { label: "Total XP", value: xp.toLocaleString(), icon: "stars" },
          { label: "Lessons", value: String(lessons), icon: "menu_book" },
          { label: "Courses", value: String(courses), icon: "school" },
        ].map((s) => (
          <div key={s.label} className="glassmorphism rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/15 shrink-0" style={{ color: primary }}>
              <span className="material-symbols-outlined text-xl">{s.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-50">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Current module CTA */}
      <section className="relative overflow-hidden rounded-2xl glassmorphism p-6 md:p-8 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/20 w-fit text-xs font-bold tracking-wider uppercase" style={{ color: primary }}>
              <span className="material-symbols-outlined text-sm">play_circle</span>Continue learning
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-zinc-50 mb-2">Pick up where you left off</h3>
              <p className="text-zinc-400">Jump into your learning path, courses, or practice problems.</p>
            </div>
            <Link href="/dashboard/learning-path" className="mt-2 flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold w-fit hover:brightness-110 shadow-[0_8px_28px_-4px_rgba(255,122,26,0.55)]" style={{ backgroundColor: primary }}>
              <span className="material-symbols-outlined">resume</span>Resume Learning
            </Link>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-zinc-50">Quick links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: "/dashboard/courses", label: "Courses", desc: "Your pathways", icon: "menu_book" },
            { href: "/dashboard/learning-path", label: "Learning Path", desc: "Explore topics", icon: "route" },
            { href: "/dashboard/practice", label: "Practice", desc: "Solve problems", icon: "code" },
            { href: "/dashboard/ai-chat", label: "AI Chat", desc: "Ask anything", icon: "smart_toy" },
            { href: "/dashboard/projects", label: "Projects", desc: "ML playground", icon: "folder_open" },
            { href: "/dashboard/profile", label: "Profile", desc: "View your stats", icon: "person" },
          ].map((q) => (
            <Link key={q.href} href={q.href} className="group glassmorphism rounded-xl p-5 hover:border-primary/40 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/20" style={{ color: primary }}>
                <span className="material-symbols-outlined text-2xl">{q.icon}</span>
              </div>
              <div>
                <h4 className="font-bold text-zinc-50 group-hover:text-primary transition-colors">{q.label}</h4>
                <p className="text-xs text-zinc-500">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
