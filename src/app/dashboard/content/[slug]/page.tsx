"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { recordLessonActivityForHeatmap } from "@/lib/recordLearningActivity";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { primary } from "@/lib/theme";


function slugToName(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

function extractBodyOnly(fullHtml: string): string {
  // Hide only the decorative middle content of backend header (badge + intro paragraph + tags).
  // We inject CSS into the backend HTML head (string replace) so we don't re-serialize/modify
  // the DOM structure (which can break rendering for some pages).
  const style = `
    <style>
      header .badge { display: none !important; }
      header > p { display: none !important; }
      header .header-tags { display: none !important; }
      header { padding-top: 28px !important; padding-bottom: 22px !important; }
      header h1 { margin-bottom: 0 !important; }
    </style>
  `;

  if (typeof fullHtml !== "string") return fullHtml;
  if (fullHtml.includes("</head>")) {
    return fullHtml.replace("</head>", `${style}\n</head>`);
  }
  return fullHtml;
}

export default function ContentReadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const topicKey = searchParams.get("topic") ?? "";
  const backHref = topicKey ? `/dashboard/learning-path/${encodeURIComponent(topicKey)}` : "/dashboard/learning-path";
  const backLabel = topicKey ? `Back to ${topicKey.replace(/_/g, " ")}` : "Learning path";
  const name = slug ? slugToName(slug) : "";
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchContent = useCallback(async () => {
    if (!name) {
      setLoading(false);
      setError("Invalid content");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/content?name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Content not found");
        setHtml(null);
        return;
      }
      const data = await res.json();
      const raw = data.html ?? "";
      setHtml(extractBodyOnly(raw));
      void recordLessonActivityForHeatmap(slug || name);
    } catch {
      setError("Failed to load document");
      setHtml(null);
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin" style={{ borderTopColor: primary }} />
        <p className="text-slate-500 dark:text-slate-400">Loading document…</p>
      </div>
    );
  }

  if (error || html === null) {
    return (
      <div className="flex flex-col gap-4">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: primary }}>
          <span className="material-symbols-outlined text-lg">arrow_back</span>{backLabel}
        </Link>
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button type="button" onClick={() => fetchContent()} className="px-4 py-2 rounded-xl font-medium text-white" style={{ backgroundColor: primary }}>Retry</button>
        </div>
      </div>
    );
  }

  const displayTitle = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {/* {backLabel} */}
          </Link>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{displayTitle}</h2>
        </div>
      </div>
      <article className="w-full rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900/50 shadow-sm">
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        className="w-full border-0 block"
        style={{ minHeight: "60vh" }}
        onLoad={(e) => {
          const iframe = e.currentTarget;
          const contentHeight = iframe.contentDocument?.documentElement?.scrollHeight;
          if (contentHeight) iframe.style.height = `${contentHeight}px`;
        }}
        title={displayTitle}
      />
    </article>
    </div>
  );
}
