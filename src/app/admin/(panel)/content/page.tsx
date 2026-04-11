"use client";

import { adminFetch } from "@/lib/adminApi";
import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type NoteRow = {
  id: number;
  owner_id: number;
  owner_email: string;
  title: string;
  updated_at: string | null;
};

type ProjectRow = {
  id: string;
  owner_id: number;
  owner_email: string;
  name: string;
  status: string;
  updated_at: string | null;
};

export default function AdminContentPage() {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    const [n, p] = await Promise.all([
      adminFetch<NoteRow[]>("/admin/student-notes?limit=100"),
      adminFetch<ProjectRow[]>("/admin/projects-list?limit=100"),
    ]);
    setLoading(false);
    if (!n.ok) {
      setError(n.detail);
      return;
    }
    if (!p.ok) {
      setError(p.detail);
      return;
    }
    setNotes(n.data);
    setProjects(p.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const siteBase =
    typeof window !== "undefined" ? window.location.origin : "";
  const apiBase = getPublicApiUrl();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Content</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Read-only directory of learner notes and ML playground projects. Editing happens in the main app as the
          owning user.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/problems"
          className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-300 hover:bg-zinc-900"
        >
          Practice library →
        </Link>
        <Link
          href="/admin/users"
          className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-300 hover:bg-zinc-900"
        >
          Users →
        </Link>
        <a
          href={siteBase ? `${siteBase}/dashboard` : "/dashboard"}
          className="rounded-xl border border-orange-500/30 px-4 py-2 text-orange-200/90 hover:bg-orange-500/10"
          style={{ borderColor: `${primary}55` }}
        >
          Open learner app
        </a>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Student notes</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-zinc-600">
                    No notes yet
                  </td>
                </tr>
              ) : (
                notes.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 font-medium text-zinc-200">{row.title}</td>
                    <td className="px-4 py-3 text-zinc-400">{row.owner_email}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-500">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">ML projects</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                    No projects yet
                  </td>
                </tr>
              ) : (
                projects.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 font-medium text-zinc-200">{row.name}</td>
                    <td className="px-4 py-3 text-sky-400/90">{row.status}</td>
                    <td className="px-4 py-3 text-zinc-400">{row.owner_email}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-500">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {apiBase ? (
        <p className="text-xs text-zinc-600">
          API: <span className="font-mono text-zinc-500">{apiBase}</span>
        </p>
      ) : null}
    </div>
  );
}
