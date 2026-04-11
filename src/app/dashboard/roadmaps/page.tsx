"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchHubJson } from "@/lib/studentHubApi";
import { theme } from "@/lib/theme";

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface CareerRoadmapItem {
  id: string;
  role_key: string;
  title: string;
  summary: string;
  icon: string;
  estimated_months?: number | null;
  steps: RoadmapStep[];
}

/** roadmap.sh–style accent per phase lane */
const PHASE_ACCENTS = [
  { stroke: "#a78bfa", fill: "rgba(167, 139, 250, 0.12)", ring: "rgba(167, 139, 250, 0.35)" },
  { stroke: "#60a5fa", fill: "rgba(96, 165, 250, 0.12)", ring: "rgba(96, 165, 250, 0.35)" },
  { stroke: "#34d399", fill: "rgba(52, 211, 153, 0.12)", ring: "rgba(52, 211, 153, 0.35)" },
  { stroke: "#fbbf24", fill: "rgba(251, 191, 36, 0.12)", ring: "rgba(251, 191, 36, 0.35)" },
  { stroke: "#f472b6", fill: "rgba(244, 114, 182, 0.12)", ring: "rgba(244, 114, 182, 0.35)" },
  { stroke: "#22d3ee", fill: "rgba(34, 211, 238, 0.12)", ring: "rgba(34, 211, 238, 0.35)" },
] as const;

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<CareerRoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [doneStepIds, setDoneStepIds] = useState<Record<string, true>>({});

  function progressKey(roadmapId: string) {
    return `career-roadmap-progress:${roadmapId}`;
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ roadmaps: CareerRoadmapItem[] }>(
        "/career-roadmaps"
      );
      if (err) setError(err);
      else setRoadmaps(data?.roadmaps ?? []);
      setLoading(false);
    })();
  }, []);

  const selectedRoadmap = useMemo(() => {
    if (!selectedRoadmapId) return null;
    return roadmaps.find((r) => r.id === selectedRoadmapId) ?? null;
  }, [roadmaps, selectedRoadmapId]);

  const sortedSteps = useMemo(() => {
    if (!selectedRoadmap) return [];
    return selectedRoadmap.steps.slice().sort((a, b) => a.order - b.order);
  }, [selectedRoadmap]);

  const progress = useMemo(() => {
    const total = sortedSteps.length;
    const done = sortedSteps.reduce((acc, s) => (doneStepIds[s.id] ? acc + 1 : acc), 0);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const nextStep = sortedSteps.find((s) => !doneStepIds[s.id]) ?? null;
    return { total, done, pct, nextStep };
  }, [sortedSteps, doneStepIds]);

  useEffect(() => {
    if (!roadmaps.length) return;
    if (!selectedRoadmapId) {
      setSelectedRoadmapId(roadmaps[0].id);
      return;
    }
    const exists = roadmaps.some((r) => r.id === selectedRoadmapId);
    if (!exists) setSelectedRoadmapId(roadmaps[0].id);
  }, [roadmaps, selectedRoadmapId]);

  useEffect(() => {
    if (!selectedRoadmapId) return;
    try {
      const raw = localStorage.getItem(progressKey(selectedRoadmapId));
      if (!raw) {
        setDoneStepIds({});
        return;
      }
      const ids = JSON.parse(raw) as unknown;
      if (!Array.isArray(ids)) {
        setDoneStepIds({});
        return;
      }
      const map: Record<string, true> = {};
      ids.filter((x) => typeof x === "string").forEach((id) => (map[id] = true));
      setDoneStepIds(map);
    } catch {
      setDoneStepIds({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoadmapId]);

  useEffect(() => {
    if (!selectedRoadmapId) return;
    try {
      const ids = Object.keys(doneStepIds);
      localStorage.setItem(progressKey(selectedRoadmapId), JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, [doneStepIds, selectedRoadmapId]);

  function toggleDone(stepId: string) {
    setDoneStepIds((prev) => {
      const next = { ...prev };
      if (next[stepId]) delete next[stepId];
      else next[stepId] = true;
      return next;
    });
  }

  function resetRoadmapProgress() {
    if (!selectedRoadmapId) return;
    setDoneStepIds({});
    try {
      localStorage.removeItem(progressKey(selectedRoadmapId));
    } catch {
      // ignore
    }
  }

  const phases = useMemo(() => {
    if (!selectedRoadmap) return [];
    const phaseSize = 3;
    const list: { id: string; title: string; steps: RoadmapStep[]; accent: (typeof PHASE_ACCENTS)[number] }[] =
      [];
    for (let i = 0; i < sortedSteps.length; i += phaseSize) {
      const idx = Math.floor(i / phaseSize);
      const phaseSteps = sortedSteps.slice(i, i + phaseSize);
      list.push({
        id: `phase-${selectedRoadmap.id}-${idx}`,
        title: `Topic ${idx + 1}`,
        steps: phaseSteps,
        accent: PHASE_ACCENTS[idx % PHASE_ACCENTS.length],
      });
    }
    return list;
  }, [selectedRoadmap, sortedSteps]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#1a1d24] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* roadmap.sh–like dot grid */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.65]"
        aria-hidden
        style={{
          backgroundColor: "#1e2128",
          backgroundImage: `radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Toolbar */}
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/[0.08] bg-[#23262f]/95 px-4 py-3 backdrop-blur-md md:gap-4 md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-zinc-400">account_tree</span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Career roadmap
              </p>
              <p className="truncate text-sm font-bold text-zinc-100">Interactive path</p>
            </div>
          </div>

          <div className="mx-auto flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 md:justify-start md:pl-2">
            <label className="sr-only" htmlFor="roadmap-select">
              Choose roadmap
            </label>
            <div className="relative min-w-[min(100%,220px)] max-w-md flex-1">
              <select
                id="roadmap-select"
                className="w-full cursor-pointer appearance-none rounded-md border border-white/[0.12] bg-[#2f3542] py-2.5 pl-3 pr-10 text-sm font-medium text-zinc-100 shadow-inner outline-none transition hover:border-white/20 focus:border-[color:var(--focus)] focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                style={
                  {
                    "--focus": theme.primary,
                    "--focus-ring": `${theme.primary}55`,
                  } as React.CSSProperties
                }
                value={selectedRoadmapId ?? ""}
                onChange={(e) => setSelectedRoadmapId(e.target.value)}
                disabled={!roadmaps.length}
              >
                {roadmaps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 material-symbols-outlined text-xl">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="hidden sm:inline">Progress</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10 md:w-32">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${progress.pct}%`, backgroundColor: theme.primary }}
                />
              </div>
              <span className="font-mono tabular-nums text-zinc-300">
                {progress.done}/{progress.total}
              </span>
            </div>
            <button
              type="button"
              onClick={resetRoadmapProgress}
              className="rounded-md border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Reset
            </button>
          </div>
        </header>

        {loading ? (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-3 py-24">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[color:var(--c)]"
              style={{ "--c": theme.primary } as React.CSSProperties}
            />
            <p className="text-sm text-zinc-500">Loading roadmaps…</p>
          </div>
        ) : error ? (
          <div className="relative m-4 rounded-lg border border-red-500/30 bg-red-950/40 p-6 text-center text-sm text-red-300">
            {error}
          </div>
        ) : !selectedRoadmap ? (
          <p className="relative p-8 text-center text-zinc-500">No roadmaps available.</p>
        ) : (
          <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
              {/* Role header — roadmap.sh “topic” strip */}
              <div className="mb-8 flex flex-col gap-4 border-b border-white/[0.08] pb-8 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-[#2f3542] text-zinc-200 shadow-lg"
                    style={{ boxShadow: `0 0 0 1px ${theme.primary}22, 0 12px 40px -12px ${theme.primary}55` }}
                  >
                    <span className="material-symbols-outlined text-3xl text-[color:var(--p)]" style={{ "--p": theme.primary } as React.CSSProperties}>
                      {selectedRoadmap.icon || "map"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                      {selectedRoadmap.title}
                    </h1>
                    <p className="mt-1 font-mono text-[11px] text-zinc-500">{selectedRoadmap.role_key}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                      {selectedRoadmap.summary}
                    </p>
                  </div>
                </div>
                {selectedRoadmap.estimated_months != null ? (
                  <div className="shrink-0 rounded-md border border-white/[0.08] bg-[#2a2f3a] px-4 py-3 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Est. timeline
                    </p>
                    <p className="text-lg font-bold tabular-nums text-zinc-100">
                      ~{selectedRoadmap.estimated_months} mo
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Phases as horizontal “lanes” of nodes (roadmap.sh graph look) */}
              <div className="space-y-10 md:space-y-14">
                {phases.map((phase, phaseIdx) => {
                  let stepOffset = 0;
                  for (let i = 0; i < phaseIdx; i++) stepOffset += phases[i].steps.length;

                  return (
                    <section key={phase.id} className="relative">
                      <div className="mb-4 flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: phase.accent.stroke, boxShadow: `0 0 12px ${phase.accent.ring}` }}
                        />
                        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                          {phase.title}
                        </h2>
                      </div>

                      {/* Mobile: vertical stack */}
                      <div className="flex flex-col gap-3 md:hidden">
                        {phase.steps.map((s, i) => {
                          const globalIdx = stepOffset + i + 1;
                          const done = Boolean(doneStepIds[s.id]);
                          const isNext = progress.nextStep?.id === s.id;
                          return (
                            <div key={s.id}>
                              <RshNode
                                stepNumber={globalIdx}
                                title={s.title}
                                description={s.description}
                                done={done}
                                isNext={isNext}
                                accent={phase.accent}
                                onToggle={() => toggleDone(s.id)}
                              />
                              {i < phase.steps.length - 1 ? (
                                <div className="flex justify-center py-1">
                                  <span className="text-zinc-600 material-symbols-outlined text-lg">
                                    south
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* md+: horizontal nodes + chevrons */}
                      <div className="hidden flex-wrap items-stretch gap-0 md:flex">
                        {phase.steps.map((s, i) => {
                          const globalIdx = stepOffset + i + 1;
                          const done = Boolean(doneStepIds[s.id]);
                          const isNext = progress.nextStep?.id === s.id;
                          return (
                            <div key={s.id} className="flex min-w-0 flex-1 items-center">
                              <div className="min-w-0 flex-1">
                                <RshNode
                                  stepNumber={globalIdx}
                                  title={s.title}
                                  description={s.description}
                                  done={done}
                                  isNext={isNext}
                                  accent={phase.accent}
                                  onToggle={() => toggleDone(s.id)}
                                />
                              </div>
                              {i < phase.steps.length - 1 ? (
                                <div
                                  className="flex shrink-0 items-center px-1 text-zinc-600"
                                  aria-hidden
                                >
                                  <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {phaseIdx < phases.length - 1 ? (
                        <div className="mt-8 flex justify-center md:mt-10" aria-hidden>
                          <div className="flex flex-col items-center gap-1 text-zinc-600">
                            <div className="h-6 w-px bg-gradient-to-b from-white/25 to-white/5" />
                            <span className="material-symbols-outlined text-xl">south</span>
                            <div className="h-6 w-px bg-gradient-to-b from-white/5 to-white/20" />
                          </div>
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>

              <p className="mt-12 border-t border-white/[0.06] pt-6 text-center text-[11px] text-zinc-600">
                Visual style inspired by{" "}
                <a
                  href="https://roadmap.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-zinc-300"
                >
                  roadmap.sh
                </a>
                . Progress is stored in your browser.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RshNode({
  stepNumber,
  title,
  description,
  done,
  isNext,
  accent,
  onToggle,
}: {
  stepNumber: number;
  title: string;
  description: string;
  done: boolean;
  isNext: boolean;
  accent: (typeof PHASE_ACCENTS)[number];
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={done ? "Mark as not done" : "Mark as done"}
      className={`group relative w-full rounded-md border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2128] ${
        done ? "opacity-95" : "hover:brightness-110"
      }`}
      style={{
        borderColor: done ? `${accent.stroke}99` : `${accent.stroke}55`,
        backgroundColor: done ? `${accent.fill}` : "rgba(47, 53, 66, 0.85)",
        boxShadow: isNext && !done ? `0 0 0 1px ${accent.stroke}66, 0 8px 32px -8px ${accent.ring}` : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md"
        style={{ backgroundColor: accent.stroke }}
      />
      <div className="pl-4 pr-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded px-1 font-mono text-[11px] font-bold tabular-nums ${
              done ? "bg-white/10 text-white" : "bg-white/[0.06] text-zinc-400"
            }`}
          >
            {done ? (
              <span className="material-symbols-outlined text-[16px] text-emerald-400">check</span>
            ) : (
              stepNumber
            )}
          </span>
          {isNext && !done ? (
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: accent.stroke, backgroundColor: accent.fill }}
            >
              Next
            </span>
          ) : null}
        </div>
        <p
          className={`mt-2 text-sm font-semibold leading-snug ${
            done ? "text-zinc-300 line-through decoration-zinc-500" : "text-zinc-100"
          }`}
        >
          {title}
        </p>
        {description ? (
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 group-hover:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
    </button>
  );
}
