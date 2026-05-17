"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

const PATTERNS = [
  { title: "Two Pointers", desc: "Pairs, partitions, palindromes", icon: "swap_horiz" },
  { title: "Sliding Window", desc: "Subarrays, frequency, max/min", icon: "tune" },
  { title: "Binary Search", desc: "Monotonic predicates, bounds", icon: "search" },
  { title: "Prefix Sum", desc: "Range sums, subarray counts", icon: "functions" },
  { title: "Stack Monotonic", desc: "Next greater/smaller, spans", icon: "stacks" },
  { title: "Graph BFS/DFS", desc: "Traversal, components, shortest paths", icon: "hub" },
  { title: "DP Basics", desc: "1D/2D DP patterns & transitions", icon: "grid_on" },
  { title: "Greedy", desc: "Local optimal → global optimal", icon: "psychology" },
] as const;

const ROADMAP = [
  { level: "Beginner", icon: "school", items: ["Big-O & Complexity", "Arrays & Strings", "Hashing (Maps/Sets)", "Two Pointers", "Sliding Window", "Basic Recursion"] },
  { level: "Intermediate", icon: "trending_up", items: ["Linked Lists", "Stacks & Queues", "Binary Search (advanced)", "Trees (DFS/BFS)", "Heaps / Priority Queue", "Intervals", "Backtracking"] },
  { level: "Advanced", icon: "workspace_premium", items: ["Dynamic Programming", "Graphs (Shortest paths, MST)", "Tries", "Union Find (DSU)", "Bit Manipulation", "Topological Sort", "Advanced Greedy"] },
] as const;

const TRACKS = [
  { title: "Core DSA", subtitle: "Big-O, arrays, strings, hashing, two pointers", items: ["Complexity", "Arrays", "Strings", "Hashing", "Two Pointers"] },
  { title: "Data Structures", subtitle: "Stack/Queue, Linked List, Trees, Heaps, Tries", items: ["Stack & Queue", "Linked List", "Trees", "Heaps", "Trie"] },
  { title: "Algorithms", subtitle: "Binary search, sorting, recursion, DP, graphs", items: ["Binary Search", "Sorting", "Recursion", "Dynamic Programming", "Graphs"] },
] as const;

export default function DSAPage() {
  const [totalProblems, setTotalProblems] = useState(0);
  const [difficulties, setDifficulties] = useState({ Easy: 0, Medium: 0, Hard: 0 });

  useEffect(() => {
    fetch(`${getPublicApiUrl()}/api/v1/practice-problems`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.problems) return;
        const problems: { difficulty?: string }[] = data.problems;
        setTotalProblems(problems.length);
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        for (const p of problems) {
          const d = p.difficulty as keyof typeof counts;
          if (d in counts) counts[d]++;
        }
        setDifficulties(counts);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-1">DSA</h2>
          <p className="text-zinc-400 text-sm md:text-base">Learn Data Structures & Algorithms with a structured roadmap and practice sets.</p>
        </div>
        <Link href="/dashboard/practice" className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white hover:opacity-90" style={{ backgroundColor: primary }}>
          <span className="material-symbols-outlined text-lg">code</span>Start practicing
        </Link>
      </div>

      {/* Problem stats from API */}
      {totalProblems > 0 && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Problems", value: totalProblems, icon: "data_array" },
            { label: "Easy", value: difficulties.Easy, icon: "sentiment_satisfied" },
            { label: "Medium", value: difficulties.Medium, icon: "psychology" },
            { label: "Hard", value: difficulties.Hard, icon: "local_fire_department" },
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
      )}

      {/* Top actions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glassmorphism rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-70" style={{ background: `${primary}22` }} />
          <div className="relative z-10">
            <div className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: primary }}>Start here</div>
            <h3 className="text-2xl font-bold text-zinc-50 mb-2">7-day DSA sprint</h3>
            <p className="text-sm text-zinc-400 max-w-2xl">A focused plan to build momentum: arrays → hashing → two pointers → sliding window → stack → tree basics → recap.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/dashboard/practice" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white hover:opacity-90" style={{ backgroundColor: primary }}>
                <span className="material-symbols-outlined text-lg">play_circle</span>Start sprint
              </Link>
              <Link href="/dashboard/interview-prep" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-orange-500/20 bg-zinc-900/50 hover:bg-orange-500/10 hover:border-primary/40 transition-colors">
                <span className="material-symbols-outlined text-lg" style={{ color: primary }}>record_voice_over</span>Mock interviews
              </Link>
            </div>
          </div>
        </div>
        <div className="glassmorphism rounded-2xl p-6">
          <div className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: primary }}>Targets</div>
          <div className="flex flex-col gap-4">
            {[
              { icon: "task_alt", title: "Solve 5 problems/day", sub: "Consistency beats intensity" },
              { icon: "timer", title: "Timebox solutions", sub: "20-30 min, then learn" },
              { icon: "note_stack", title: "Write patterns", sub: "Store templates you reuse" },
            ].map((t) => (
              <div key={t.icon} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-xl" style={{ color: primary }}>{t.icon}</span>
                <div>
                  <p className="font-semibold text-zinc-50">{t.title}</p>
                  <p className="text-xs text-zinc-400">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {TRACKS.map((t) => (
          <div key={t.title} className="glassmorphism rounded-2xl p-6">
            <div className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: primary }}>Learning track</div>
            <h3 className="text-xl font-bold text-zinc-50 mb-1">{t.title}</h3>
            <p className="text-sm text-zinc-400 mb-5">{t.subtitle}</p>
            <div className="flex flex-wrap gap-2">
              {t.items.map((x) => (
                <span key={x} className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-orange-500/15 bg-black/35 text-zinc-200">{x}</span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Roadmap */}
      <section className="glassmorphism rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-50">Roadmap</h3>
            <p className="text-sm text-zinc-400 mt-1">Follow a level-based path and practice as you go.</p>
          </div>
          <Link href="/dashboard/practice" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-orange-500/20 bg-zinc-900/50 hover:bg-orange-500/10 hover:border-primary/40 transition-colors">
            <span className="material-symbols-outlined text-lg" style={{ color: primary }}>checklist</span>Open practice list
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ROADMAP.map((r) => (
            <div key={r.level} className="rounded-2xl glassmorphism p-5 bg-zinc-900/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-xl" style={{ color: primary }}>{r.icon}</span>
                <h4 className="font-bold text-zinc-50">{r.level}</h4>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {r.items.map((x) => (
                  <li key={x} className="flex items-start gap-2 text-zinc-300">
                    <span className="material-symbols-outlined text-base mt-0.5" style={{ color: primary }}>arrow_right</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Popular patterns */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-50">Popular patterns</h3>
            <p className="text-sm text-zinc-400 mt-1">Learn patterns to recognize problems faster.</p>
          </div>
          <Link href="/dashboard/practice" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-orange-500/20 bg-zinc-900/50 hover:bg-orange-500/10 hover:border-primary/40 transition-colors">
            <span className="material-symbols-outlined text-lg" style={{ color: primary }}>menu_book</span>View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PATTERNS.map((p) => (
            <div key={p.title} className="glassmorphism rounded-2xl p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/15 shrink-0" style={{ color: primary }}>
                  <span className="material-symbols-outlined text-xl">{p.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-50 leading-tight">{p.title}</p>
                  <p className="text-xs text-zinc-400 mt-1">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glassmorphism rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-50">Recommended next steps</h3>
            <p className="text-sm text-zinc-400 mt-1">Start with arrays + hashing, then move into trees and DP.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/practice" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-orange-500/20 bg-zinc-900/50 hover:bg-orange-500/10 hover:border-primary/40 transition-colors">
              <span className="material-symbols-outlined text-lg" style={{ color: primary }}>task_alt</span>Practice sets
            </Link>
            <Link href="/dashboard/interview-prep" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-orange-500/20 bg-zinc-900/50 hover:bg-orange-500/10 hover:border-primary/40 transition-colors">
              <span className="material-symbols-outlined text-lg" style={{ color: primary }}>record_voice_over</span>Interview prep
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
