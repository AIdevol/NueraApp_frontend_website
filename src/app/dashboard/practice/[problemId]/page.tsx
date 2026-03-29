"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

type PracticeProblem = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  tags?: string[];
  statement: string;
  constraints?: string | null;
  examples?: string | null;
};

export default function PracticeProblemPage() {
  const router = useRouter();
  const params = useParams<{ problemId: string }>();
  const problemId = useMemo(() => decodeURIComponent(params.problemId ?? ""), [params.problemId]);

  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const api = getPublicApiUrl();
        // Try custom problems first; if not found, fall back to library.
        const res1 = await fetch(`${api}/api/v1/practice-problems/${encodeURIComponent(problemId)}`);
        if (res1.ok) {
          const data1 = await res1.json().catch(() => ({}));
          setProblem(data1 as PracticeProblem);
          return;
        }
        const res2 = await fetch(`${api}/api/v1/problem-library/dsa/${encodeURIComponent(problemId)}`);
        const data2 = await res2.json().catch(() => ({}));
        if (!res2.ok) {
          setError((data2 as any).detail || "Failed to load problem");
          setProblem(null);
          return;
        }
        setProblem(data2 as PracticeProblem);
      } catch {
        setError("Connection error.");
        setProblem(null);
      } finally {
        setLoading(false);
      }
    }
    if (problemId) void load();
  }, [problemId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:opacity-80"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/practice"
            className="text-sm font-semibold hover:opacity-80"
            style={{ color: primary }}
          >
            Practice list
          </Link>
          <Link
            href={`/dashboard/practice/${encodeURIComponent(problemId)}/solve`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 hover:border-primary/50 text-sm"
          >
            <span className="material-symbols-outlined text-lg" style={{ color: primary }}>
              terminal
            </span>
            Solve in IDE
          </Link>
          <Link
            href="/dashboard/practice/create"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-white hover:opacity-90 text-sm"
            style={{ backgroundColor: primary }}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading problem…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6">
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
        </div>
      ) : !problem ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 p-6">
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Problem not found.</p>
        </div>
      ) : (
        <div className="glassmorphism rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: primary }}>
                {problem.topic}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {problem.title}
              </h1>
              {!!problem.tags?.length && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {problem.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border w-fit"
              style={{
                borderColor:
                  String(problem.difficulty).toLowerCase() === "easy"
                    ? "rgba(16,185,129,0.35)"
                    : String(problem.difficulty).toLowerCase() === "medium"
                      ? "rgba(245,158,11,0.35)"
                      : "rgba(239,68,68,0.35)",
                color:
                  String(problem.difficulty).toLowerCase() === "easy"
                    ? "rgb(16 185 129)"
                    : String(problem.difficulty).toLowerCase() === "medium"
                      ? "rgb(245 158 11)"
                      : "rgb(239 68 68)",
                backgroundColor: "rgba(255,255,255,0.55)",
              }}
            >
              {problem.difficulty}
            </span>
          </div>

          <div className="mt-6 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Problem</h2>
              <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {problem.statement}
              </div>
            </section>

            {!!problem.constraints && (
              <section>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Constraints</h2>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {problem.constraints}
                </div>
              </section>
            )}

            {!!problem.examples && (
              <section>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Examples</h2>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {problem.examples}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

