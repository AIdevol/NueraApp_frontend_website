"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

type SearchKind = "course" | "model" | "topic" | "lesson" | "practice";

type SearchHit = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string | null;
  href: string;
};

const KIND_LABEL: Record<SearchKind, string> = {
  course: "Course",
  model: "Model hub",
  topic: "Learning path",
  lesson: "Lesson",
  practice: "Practice",
};

const KIND_ICON: Record<SearchKind, string> = {
  course: "school",
  model: "hub",
  topic: "route",
  lesson: "menu_book",
  practice: "code",
};

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function DashboardGlobalSearch() {
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 280);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const api = getPublicApiUrl();
      const res = await fetch(
        `${api}/api/v1/search?q=${encodeURIComponent(trimmed)}&limit=24`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { detail?: string }).detail || "Search failed");
        setResults([]);
        return;
      }
      setResults((data as { results?: SearchHit[] }).results ?? []);
    } catch {
      setError("Connection error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    void runSearch(debounced);
  }, [debounced, runSearch]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showPanel = Boolean(
    open && (query.trim().length > 0 || loading || error)
  );

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <label className="relative flex items-center w-full">
        <span className="material-symbols-outlined absolute left-3 text-orange-400/50 text-lg pointer-events-none">
          search
        </span>
        <input
          type="search"
          autoComplete="off"
          placeholder="Search courses, models, or topics..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-zinc-900/80 border border-orange-500/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 text-zinc-100 placeholder-zinc-500"
          aria-expanded={showPanel}
          aria-controls="dashboard-global-search-results"
          aria-autocomplete="list"
        />
      </label>

      {showPanel && (
        <div
          id="dashboard-global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-orange-500/20 bg-[#0c0c0f] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.85)]"
        >
          {loading && (
            <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
              <span
                className="inline-block w-4 h-4 rounded-full border-2 border-zinc-700 animate-spin"
                style={{ borderTopColor: primary }}
              />
              Searching…
            </div>
          )}
          {!loading && error && (
            <div className="px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="px-4 py-6 text-sm text-zinc-500 text-center">No matches</div>
          )}
          {!loading && !error && results.length > 0 && (
            <ul className="py-1">
              {results.map((hit) => (
                <li key={hit.id} role="option">
                  <Link
                    href={hit.href}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-orange-500/10 transition-colors"
                  >
                    <span
                      className="material-symbols-outlined text-lg shrink-0 mt-0.5 text-orange-400/80"
                      aria-hidden
                    >
                      {KIND_ICON[hit.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-100 truncate">
                        {hit.title}
                      </span>
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        {KIND_LABEL[hit.kind]}
                        {hit.subtitle ? (
                          <>
                            {" "}
                            · <span className="normal-case font-normal text-zinc-400">{hit.subtitle}</span>
                          </>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
