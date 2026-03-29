 "use client";

import { bearerAuthHeaders } from "@/lib/authHeaders";
import { getPublicApiUrl } from "@/lib/publicUrl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { primary } from "@/lib/theme";

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  icon: string;
  updated: string;
}


export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${getPublicApiUrl()}/api/v1/projects`, {
          headers: { ...bearerAuthHeaders() },
        });
        if (res.status === 401) {
          if (typeof window !== "undefined") localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.detail || "Failed to load projects");
          return;
        }
        const data = await res.json();
        // backend returns updated as ISO datetime; format to relative-ish string
        const formatted = (data.projects ?? []).map((p: any) => ({
          ...p,
          updated: new Date(p.updated).toLocaleString(),
        }));
        setProjects(formatted);
      } catch {
        setError("Connection error.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim() || !type.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...bearerAuthHeaders(),
        },
        body: JSON.stringify({ name: name.trim(), type: type.trim() }),
      });
      if (res.status === 401) {
        if (typeof window !== "undefined") localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Failed to create project");
        return;
      }
      const created = await res.json();
      setProjects((prev) => [
        {
          ...created,
          updated: new Date(created.updated).toLocaleString(),
        },
        ...prev,
      ]);
      setName("");
      setType("");
      setShowDialog(false);
      // After creating, jump straight into the ML playground for this project.
      router.push(`/dashboard/projects/${encodeURIComponent(created.id)}/playground`);
    } catch {
      setError("Connection error.");
    } finally {
      setCreating(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">Projects</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">Your AI experiments and applications.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            setShowDialog(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white hover:opacity-90"
          style={{ backgroundColor: primary }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New project
        </button>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{ color: primary }}>
                    bolt
                  </span>
                  Create ML Playground project
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tell us what you want to build. We&apos;ll create a project and open an interactive ML code playground.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <form className="flex flex-col gap-3" onSubmit={handleCreate}>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Project name
                </label>
                <input
                  type="text"
                  placeholder="e.g. RAG Pipeline for Docs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  System / stack
                </label>
                <input
                  type="text"
                  placeholder="e.g. PyTorch • GPU, Transformers, RAG"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-sm"
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: primary }}
                >
                  {creating ? "Creating…" : "Create & open playground"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-4 mt-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your projects</h3>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
            <div
              className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
              style={{ borderTopColor: primary }}
            />
            <p className="text-slate-500 dark:text-slate-400">Loading projects…</p>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No projects yet. Create your first project above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="glassmorphism rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/20" style={{ color: primary }}>
                    <span className="material-symbols-outlined text-2xl">{p.icon}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      p.status === "Completed"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-primary/20"
                    }`}
                    style={p.status !== "Completed" ? { color: primary } : undefined}
                  >
                    {p.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mt-2">{p.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{p.type}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Updated {p.updated}</p>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/dashboard/projects/${encodeURIComponent(p.id)}`}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
