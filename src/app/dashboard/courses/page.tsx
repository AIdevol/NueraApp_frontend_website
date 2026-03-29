 "use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import Link from "next/link";
import { useEffect, useState } from "react";

import { primary } from "@/lib/theme";

interface Course {
  id: string;
  title: string;
  category: string;
  duration: string;
  level: string;
  track: "ai" | "software";
}


export default function CoursesPage() {
  const [aiCourses, setAiCourses] = useState<Course[]>([]);
  const [devCourses, setDevCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const api = getPublicApiUrl();
        const [aiRes, devRes] = await Promise.all([
          fetch(`${api}/api/v1/courses/track/ai`),
          fetch(`${api}/api/v1/courses/track/software`),
        ]);

        const aiJson = await aiRes.json().catch(() => ({}));
        const devJson = await devRes.json().catch(() => ({}));

        if (!aiRes.ok || !devRes.ok) {
          setError((aiJson as any).detail || (devJson as any).detail || "Failed to load courses");
          return;
        }

        setAiCourses((aiJson as any).courses ?? []);
        setDevCourses((devJson as any).courses ?? []);
      } catch {
        setError("Connection error.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">Courses</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">AI and software development learning pathways.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white hover:opacity-90"
          style={{ backgroundColor: primary }}
        >
          <span className="material-symbols-outlined text-lg">menu_book</span>
          Browse all
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading courses…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        </div>
      ) : (
        <>
          {!!aiCourses.length && (
            <section className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI pathways</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/courses/${encodeURIComponent(c.id)}`}
                    className="group glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: primary }}>
                      {c.category}
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{c.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {c.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                        {c.level}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!!devCourses.length && (
            <section className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Software development pathways</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {devCourses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/courses/${encodeURIComponent(c.id)}`}
                    className="group glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: primary }}>
                      {c.category}
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{c.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {c.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                        {c.level}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
