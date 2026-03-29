"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchHubJson } from "@/lib/studentHubApi";
import { primary, theme } from "@/lib/theme";

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

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<CareerRoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [doneStepIds, setDoneStepIds] = useState<Record<string, true>>({});
  const [collapsedPhaseIds, setCollapsedPhaseIds] = useState<Record<string, true>>({});

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

  // Default selection + load progress for selected roadmap
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
    // Reset tree/collapse UI when the user switches roles.
    setCollapsedPhaseIds({});
  }, [selectedRoadmapId]);

  useEffect(() => {
    if (!selectedRoadmapId) return;
    try {
      const ids = Object.keys(doneStepIds);
      localStorage.setItem(progressKey(selectedRoadmapId), JSON.stringify(ids));
    } catch {
      // ignore storage quota / privacy mode
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
    const phaseSize = 3; // roadmap.sh style: sections with a few steps each
    const list = [];
    for (let i = 0; i < sortedSteps.length; i += phaseSize) {
      const idx = Math.floor(i / phaseSize);
      const phaseSteps = sortedSteps.slice(i, i + phaseSize);
      list.push({
        id: `phase-${selectedRoadmap.id}-${idx}`,
        title: `Phase ${idx + 1}`,
        steps: phaseSteps,
      });
    }
    return list;
  }, [selectedRoadmap, sortedSteps]);

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Career Roadmaps
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-3xl">
          Pick a role, then follow a checklist-style roadmap like roadmap.sh. Mark steps done to
          track your progress (saved in your browser).
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading roadmaps…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ color: primary }}>
                    map
                  </span>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Choose a roadmap</h2>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {roadmaps.length} roles
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {roadmaps.map((r) => {
                  const stepsTotal = r.steps.length;

                  const open = selectedRoadmapId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoadmapId(r.id)}
                      className={`text-left rounded-xl border p-4 transition-colors ${
                        open
                          ? `border-primary/40 bg-primary/5`
                          : `border-slate-200 dark:border-slate-700/60 hover:border-primary/30 dark:hover:border-primary/30 bg-white/60 dark:bg-slate-800/10`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="material-symbols-outlined text-2xl shrink-0"
                          style={{ color: primary }}
                        >
                          {r.icon || "map"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {r.title}
                            </h3>
                            {open && (
                              <span className="text-xs font-medium" style={{ color: primary }}>
                                {progress.pct}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                            {r.role_key}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-2">
                            {r.summary}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            <span>
                              {open ? `${progress.done}/${progress.total} done` : `${stepsTotal} steps`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-8 flex flex-col gap-4">
            {!selectedRoadmap ? null : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="material-symbols-outlined text-3xl shrink-0"
                      style={{ color: primary }}
                    >
                      {selectedRoadmap.icon || "map"}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                        {selectedRoadmap.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-1">
                        {selectedRoadmap.role_key}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                        {selectedRoadmap.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Progress</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {progress.done}/{progress.total} <span className="text-sm font-semibold" style={{ color: primary }}>({progress.pct}%)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetRoadmapProgress}
                      className="px-3 py-2 rounded-xl border text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-primary/5 border-slate-200 dark:border-slate-700/60 hover:border-primary/35 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress.pct}%`, backgroundColor: primary }}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-8">
                  {phases.map((phase, phaseIdx) => {
                    const collapsed = Boolean(collapsedPhaseIds[phase.id]);
                    const stepsBefore = phases
                      .slice(0, phaseIdx)
                      .reduce((n, p) => n + p.steps.length, 0);

                    return (
                      <div
                        key={phase.id}
                        className="rounded-2xl border overflow-hidden shadow-sm"
                        style={{
                          borderColor: `${primary}33`,
                          background: `linear-gradient(135deg, ${primary}0f 0%, transparent 48%, ${theme.primaryDark}08 100%)`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setCollapsedPhaseIds((prev) => {
                              const next = { ...prev };
                              if (next[phase.id]) delete next[phase.id];
                              else next[phase.id] = true;
                              return next;
                            });
                          }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left border-b transition-colors hover:bg-primary/5"
                          style={{ borderColor: `${primary}22` }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md"
                              style={{
                                background: `linear-gradient(145deg, ${primary}, ${theme.primaryDark})`,
                                boxShadow: `0 8px 24px -6px ${primary}99`,
                              }}
                            >
                              {phaseIdx + 1}
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {phase.title}
                              </h3>
                              <p className="text-xs font-medium mt-0.5" style={{ color: primary }}>
                                {phase.steps.length} step{phase.steps.length === 1 ? "" : "s"} · tap rows to mark done
                              </p>
                            </div>
                          </div>
                          <span
                            className="material-symbols-outlined shrink-0 text-2xl"
                            style={{ color: primary }}
                          >
                            {collapsed ? "expand_more" : "expand_less"}
                          </span>
                        </button>

                        {!collapsed && (
                          <div className="px-4 py-5 md:px-6 md:py-6">
                            <div className="relative">
                              {/* Vertical rail — brand orange (GitHub-style spine) */}
                              <div
                                className="absolute left-[19px] top-5 bottom-5 w-0.5 rounded-full hidden sm:block pointer-events-none"
                                style={{
                                  background: `linear-gradient(180deg, ${primary}aa 0%, ${primary}44 50%, ${primary}22 100%)`,
                                }}
                                aria-hidden
                              />

                              <ol className="space-y-0 list-none p-0 m-0">
                              {phase.steps.map((s, stepInPhase) => {
                                const done = Boolean(doneStepIds[s.id]);
                                const next = progress.nextStep?.id === s.id;
                                const stepNumber = stepsBefore + stepInPhase + 1;
                                const isLast = stepInPhase === phase.steps.length - 1;

                                return (
                                  <li
                                    key={s.id}
                                    className={`relative flex gap-4 sm:gap-5 ${isLast ? "" : "pb-8"}`}
                                  >
                                    {/* Step number / status circle */}
                                    <div className="relative z-10 flex flex-col items-center shrink-0 w-10">
                                      <button
                                        type="button"
                                        onClick={() => toggleDone(s.id)}
                                        title={done ? "Mark as not done" : "Mark as done"}
                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200 ${
                                          done
                                            ? "text-white shadow-lg scale-100"
                                            : next
                                              ? "ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-primary/40"
                                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-400"
                                        }`}
                                        style={
                                          done
                                            ? {
                                                background: `linear-gradient(145deg, ${primary}, ${theme.primaryDark})`,
                                                borderColor: primary,
                                                boxShadow: `0 6px 20px -4px ${primary}aa`,
                                              }
                                            : next
                                              ? {
                                                  borderColor: primary,
                                                  color: primary,
                                                  backgroundColor: `${primary}18`,
                                                }
                                              : undefined
                                        }
                                      >
                                        {done ? (
                                          <span className="material-symbols-outlined text-[22px]">check</span>
                                        ) : (
                                          stepNumber
                                        )}
                                      </button>
                                    </div>

                                    {/* Step card */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                      <button
                                        type="button"
                                        onClick={() => toggleDone(s.id)}
                                        className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                                          done
                                            ? "border-primary/40 bg-primary/8 dark:bg-primary/10"
                                            : next
                                              ? "border-primary/50 bg-primary/6 dark:bg-primary/12 shadow-[0_0_0_1px_rgba(255,122,26,0.15)]"
                                              : "border-slate-200/80 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/30 hover:border-primary/25"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <p
                                              className={`font-bold text-base ${
                                                done
                                                  ? "text-slate-900 dark:text-slate-50"
                                                  : next
                                                    ? ""
                                                    : "text-slate-900 dark:text-slate-100"
                                              }`}
                                              style={next && !done ? { color: primary } : undefined}
                                            >
                                              {s.title}
                                            </p>
                                            {s.description ? (
                                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                                                {s.description}
                                              </p>
                                            ) : null}
                                          </div>
                                          <span
                                            className="shrink-0 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
                                            style={
                                              done
                                                ? {
                                                    backgroundColor: `${primary}22`,
                                                    color: theme.primaryDark,
                                                  }
                                                : next
                                                  ? {
                                                      backgroundColor: `${primary}28`,
                                                      color: primary,
                                                    }
                                                  : {
                                                      backgroundColor: "rgba(148,163,184,0.2)",
                                                      color: "#64748b",
                                                    }
                                            }
                                          >
                                            {done ? "Done" : next ? "Next" : "To do"}
                                          </span>
                                        </div>
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                              </ol>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
