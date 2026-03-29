"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

type Course = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  duration: string;
  level: string;
  track: "ai" | "software";
  content_url?: string | null;
};

function youtubePlaylistEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const list = u.searchParams.get("list");
    if (!list) return null;
    return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}`;
  } catch {
    return null;
  }
}

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const courseId = useMemo(() => decodeURIComponent(params.courseId ?? ""), [params.courseId]);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${getPublicApiUrl()}/api/v1/courses/${encodeURIComponent(courseId)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as any).detail || "Failed to load course");
          setCourse(null);
          return;
        }
        setCourse(data as Course);
      } catch {
        setError("Connection error.");
        setCourse(null);
      } finally {
        setLoading(false);
      }
    }
    if (courseId) void load();
  }, [courseId]);

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

        <Link
          href="/dashboard/courses"
          className="text-sm font-semibold hover:opacity-80"
          style={{ color: primary }}
        >
          All courses
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading course…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">{error}</p>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Please go back and try again.
          </p>
        </div>
      ) : !course ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 p-6">
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Course not found.</p>
        </div>
      ) : (
        <div className="glassmorphism rounded-2xl border border-slate-200 dark:border-slate-700 p-7 sm:p-10">
          <div className="text-xs font-bold tracking-wide uppercase mb-3" style={{ color: primary }}>
            {course.category}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 bg-white/70 dark:bg-slate-900/30">
              <span className="material-symbols-outlined text-base">schedule</span>
              {course.duration}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 bg-white/70 dark:bg-slate-900/30">
              <span className="material-symbols-outlined text-base">signal_cellular_alt</span>
              {course.level}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 bg-white/70 dark:bg-slate-900/30">
              <span className="material-symbols-outlined text-base">category</span>
              {course.track === "ai" ? "AI track" : "Software track"}
            </span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("course-content");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              <span className="material-symbols-outlined text-lg">play_circle</span>
              Start course
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/30 hover:border-primary/50"
            >
              <span className="material-symbols-outlined text-lg">bookmark</span>
              Save for later
            </button>
          </div>

          {!!course.description && (
            <div className="mt-8 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
              {course.description}
            </div>
          )}

          {course.content_url && (
            <section id="course-content" className="mt-10">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Course content</h2>
                <Link
                  href={course.content_url}
                  target="_blank"
                  className="text-sm font-semibold hover:opacity-80"
                  style={{ color: primary }}
                >
                  Open on YouTube
                </Link>
              </div>
              {youtubePlaylistEmbedSrc(course.content_url) ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                  <iframe
                    className="w-full aspect-video"
                    src={youtubePlaylistEmbedSrc(course.content_url) ?? undefined}
                    title={`${course.title} playlist`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    This course links out to YouTube content. Click <span className="font-semibold">Open on YouTube</span> to watch.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}



// Deep Learning & Transformers
// Prompt Engineering for LLMs
// Building RAG Systems
// LLM Engineering & Productionization
// Applied Computer Vision with CNNs
// End‑to‑End NLP Applications

// Web Development Fundamentals
// Frontend Development
// Backend Development
// Full Stack Development
// Database Management
// API Development
// Cloud Computing
// DevOps
// Security
// Testing
// Performance Optimization
// Agile Methodologies
// Backend APIs with FastAPI & REST
// Full‑Stack Apps with Next.js
// DevOps & CI/CD for ML and Web
// Clean Architecture for Backend Services
// Typescript frontends with react & next.js
// Testing & Observability for Modern Apps