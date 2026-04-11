"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

type PracticeProblem = {
  id: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  tags?: string[];
  statement: string;
  constraints?: string | null;
  examples?: string | null;
};

export default function PracticePage() {
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const counts = useMemo(() => {
    const c = { total: problems.length, easy: 0, medium: 0, hard: 0 };
    for (const p of problems) {
      const d = String(p.difficulty || "").toLowerCase();
      if (d === "easy") c.easy += 1;
      else if (d === "medium") c.medium += 1;
      else if (d === "hard") c.hard += 1;
    }
    return c;
  }, [problems]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const api = getPublicApiUrl();

        const [libRes, customRes] = await Promise.all([
          fetch(`${api}/api/v1/problem-library/dsa`),
          fetch(`${api}/api/v1/practice-problems`),
        ]);

        const libJson = (await libRes.json().catch(() => ({}))) as { problems?: PracticeProblem[]; detail?: string };
        const customJson = (await customRes.json().catch(() => ({}))) as { problems?: PracticeProblem[]; detail?: string };

        const customProblems = customRes.ok ? (customJson.problems ?? []) : [];
        const libProblems = libRes.ok ? (libJson.problems ?? []) : [];

        // Custom / cohort problems first, then built-in library
        const merged = [...customProblems, ...libProblems];
        setProblems(merged);

        const parts: string[] = [];
        if (!customRes.ok) {
          parts.push(
            customJson.detail || `Custom problems unavailable (${customRes.status}). Is the API running?`
          );
        }
        if (!libRes.ok) {
          parts.push(libJson.detail || `Built-in library unavailable (${libRes.status}).`);
        }
        if (merged.length === 0) {
          setError(parts.join(" ") || "No problems to display.");
        } else {
          setError("");
        }
      } catch {
        setError("Connection error.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="min-h-full flex flex-col bg-background-dark rounded-xl p-4 md:p-5 border border-orange-500/10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            {/* <span className="material-symbols-outlined text-lg">code</span> */}
            <Link href="/dashboard/dsa" className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-sm font-bold border border-orange-500/25 hover:bg-orange-500/10 transition-colors shrink-0" style={{ color: primary }}>
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </Link>
            Practice Problems
          </h1>
          <p className="mt-1 text-zinc-400 text-sm max-w-2xl">
            Solve DSA problems by topic and difficulty. Create your own problems for your cohort.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/practice/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create problem
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl p-4 bg-[#0c0c0f] border border-orange-500/10">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Total</p>
          <p className="text-2xl font-bold text-zinc-50">{counts.total}</p>
        </div>
        <div className="rounded-2xl p-4 bg-[#0c0c0f] border border-orange-500/10">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Easy</p>
          <p className="text-2xl font-bold text-zinc-50">{counts.easy}</p>
        </div>
        <div className="rounded-2xl p-4 bg-[#0c0c0f] border border-orange-500/10">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Medium</p>
          <p className="text-2xl font-bold text-zinc-50">{counts.medium}</p>
        </div>
        <div className="rounded-2xl p-4 bg-[#0c0c0f] border border-orange-500/10">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Hard</p>
          <p className="text-2xl font-bold text-zinc-50">{counts.hard}</p>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-zinc-400">Loading problems…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6">
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
        </div>
      ) : problems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-8 flex flex-col items-center justify-center min-h-[260px] text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-500 mb-4" style={{ color: primary }}>
            code
          </span>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No problems yet</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm max-w-md">
            Create your first practice problem to start a problem set.
          </p>
          <Link
            href="/dashboard/practice/create"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create problem
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {problems.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/practice/${encodeURIComponent(p.id)}/solve`}
              className="group rounded-2xl p-6 bg-[#0c0c0f] border border-orange-500/10 hover:border-primary/45 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: primary }}>
                    {p.topic}
                  </p>
                  <h3 className="text-lg font-bold text-zinc-50 leading-snug line-clamp-2">
                    {p.title}
                  </h3>
                </div>
                <span
                  className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor:
                      String(p.difficulty).toLowerCase() === "easy"
                        ? "rgba(16,185,129,0.35)"
                        : String(p.difficulty).toLowerCase() === "medium"
                          ? "rgba(245,158,11,0.35)"
                          : "rgba(239,68,68,0.35)",
                    color:
                      String(p.difficulty).toLowerCase() === "easy"
                        ? "rgb(16 185 129)"
                        : String(p.difficulty).toLowerCase() === "medium"
                          ? "rgb(245 158 11)"
                          : "rgb(239 68 68)",
                    backgroundColor: "rgba(255,255,255,0.55)",
                  }}
                >
                  {p.difficulty}
                </span>
              </div>

              {!!p.tags?.length && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.slice(0, 6).map((t) => (
                    <span
                      key={t}
                      className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 text-sm text-zinc-500 line-clamp-2">
                {p.statement}
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: primary }}>
                Open problem <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
