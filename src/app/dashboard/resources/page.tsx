"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { useEffect, useState } from "react";

import { primary } from "@/lib/theme";

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  url: string;
  provider?: string | null;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${getPublicApiUrl()}/api/v1/resources`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load resources");
        return res.json();
      })
      .then((data: { resources?: ResourceItem[] }) => {
        if (!cancelled && data.resources) setResources(data.resources);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load resources");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const categories = Array.from(new Set(resources.map((r) => r.category))).sort();

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
          Resources
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
          Docs, guides, courses, and learning materials.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
        </div>
      )}

      {error && (
        <section className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </section>
      )}

      {!loading && !error && resources.length === 0 && (
        <section className="glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <span
            className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500 mb-4 block"
            style={{ color: primary }}
          >
            library_books
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No resources yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            Curated resources and guides will appear here.
          </p>
        </section>
      )}

      {!loading && !error && resources.length > 0 && (
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category}>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-xl" style={{ color: primary }}>
                  folder
                </span>
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources
                  .filter((r) => r.category === category)
                  .map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.level}
                        </span>
                        {item.provider && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                            {item.provider}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:underline">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                        {item.description}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 mt-3 text-sm font-medium"
                        style={{ color: primary }}
                      >
                        Open
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </span>
                    </a>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
