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

/** Ensures in-document #anchors scroll inside the iframe (sidebar / TOC links). */
const ANCHOR_SCROLL_SCRIPT = `
<script>
(function () {
  function scrollToId(id) {
    if (!id) return;
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function setActiveSidebar(href) {
    var links = document.querySelectorAll(".sidebar a[href^='#'], aside.sidebar a[href^='#']");
    links.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === href);
    });
  }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = (a.getAttribute("href") || "").trim();
    if (!href) return;
    if (href === "/" || href.indexOf("//") === 0 || href.indexOf("http:") === 0 || href.indexOf("https:") === 0) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (href.charAt(0) !== "#") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (href.length < 2) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var id = href.slice(1);
    if (!id || id.indexOf("/") >= 0) return;
    e.preventDefault();
    e.stopPropagation();
    scrollToId(decodeURIComponent(id));
    setActiveSidebar(href);
    try { history.replaceState(null, "", href); } catch (err) {}
  }, true);
  window.addEventListener("hashchange", function () {
    var id = (location.hash || "").replace(/^#/, "");
    if (id) {
      scrollToId(decodeURIComponent(id));
      setActiveSidebar("#" + id);
    }
  });
  if (location.hash && location.hash.length > 1) {
    setTimeout(function () {
      scrollToId(decodeURIComponent(location.hash.slice(1)));
      setActiveSidebar(location.hash);
    }, 0);
  }
})();
</script>
`;

function extractBodyOnly(fullHtml: string): string {
  // Hide only the decorative middle content of backend header (badge + intro paragraph + tags).
  // Strip standalone-lesson chrome (e.g. MathReference .top-nav) so NeuraApp is the only app shell.
  const style = `
    <style>
      header .badge { display: none !important; }
      header > p { display: none !important; }
      header .header-tags { display: none !important; }
      header { padding-top: 28px !important; padding-bottom: 22px !important; }
      header h1 { margin-bottom: 0 !important; }

      /* Embedded in NeuraApp: hide duplicate full-site nav (MathReference, etc.) */
      nav.top-nav { display: none !important; }
      :root {
        --header-height: 0px !important;
      }
      .sidebar {
        top: 0 !important;
        height: 100vh !important;
        max-height: 100vh !important;
        border-right-color: rgba(255, 124, 42, 0.2) !important;
      }
      .right-toc {
        top: 16px !important;
      }
      .page-wrapper {
        max-width: none !important;
        margin: 0 !important;
      }
      body {
        overflow-x: hidden !important;
      }
    </style>
  `;

  if (typeof fullHtml !== "string") return fullHtml;
  let out = fullHtml;
  if (out.includes("</head>")) {
    out = out.replace("</head>", `${style}\n</head>`);
  }
  if (out.includes("</body>")) {
    out = out.replace("</body>", `${ANCHOR_SCROLL_SCRIPT}\n</body>`);
  } else if (out.includes("</html>")) {
    out = out.replace("</html>", `${ANCHOR_SCROLL_SCRIPT}\n</html>`);
  } else {
    out += ANCHOR_SCROLL_SCRIPT;
  }
  return out;
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
      {/*
        Fixed viewport height so the iframe has an internal scroll container. Setting height to
        full document scrollHeight breaks in-document #anchor navigation (sidebar / TOC).
      */}
      <iframe
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin"
        className="w-full border-0 block bg-zinc-950"
        style={{ height: "min(88vh, 1100px)", minHeight: "65vh" }}
        title={displayTitle}
      />
    </article>
    </div>
  );
}
