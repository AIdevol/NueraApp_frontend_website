 "use client";

import { bearerAuthHeaders } from "@/lib/authHeaders";
import { getPublicApiUrl } from "@/lib/publicUrl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { primary } from "@/lib/theme";

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  icon: string;
  updated: string;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${getPublicApiUrl()}/api/v1/projects/${encodeURIComponent(projectId)}`,
          { headers: { ...bearerAuthHeaders() } }
        );
        if (res.status === 401) {
          if (typeof window !== "undefined") localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.detail || "Project not found");
          return;
        }
        const data = await res.json();
        setProject({
          ...data,
          updated: new Date(data.updated).toLocaleString(),
        });
      } catch {
        setError("Connection error.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [projectId, router]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
          style={{ borderTopColor: primary }}
        />
        <p className="text-slate-500 dark:text-slate-400">Loading project…</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
          style={{ color: primary }}
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to projects
        </Link>
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">{error || "Project not found"}</p>
        </div>
      </div>
    );
  }

  const p = project;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
          style={{ color: primary }}
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Projects
        </Link>
      </div>
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-primary/20"
          style={{ color: primary }}
        >
          <span className="material-symbols-outlined text-3xl">{p.icon}</span>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">{p.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{p.type}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Last updated {p.updated}</p>
        </div>
        <span
          className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${
            p.status === "Completed"
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-primary/20"
          }`}
          style={p.status !== "Completed" ? { color: primary } : undefined}
        >
          {p.status}
        </span>
      </div>

      <section className="glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Project workspace</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Open an interactive ML playground to prototype and test your models for this project.
        </p>
        <div className="flex gap-3 mt-1">
          <Link
            href={`/dashboard/projects/${encodeURIComponent(p.id)}/playground`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            <span className="material-symbols-outlined text-base">terminal</span>
            Open ML code playground
          </Link>
        </div>
      </section>
    </div>
  );
}

