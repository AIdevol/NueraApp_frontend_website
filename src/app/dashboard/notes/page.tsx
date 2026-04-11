"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { createNote, deleteNote, fetchNotesList, type NoteSummary } from "@/lib/studentNotesApi";
import { formatDate } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

export default function NotesListPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await fetchNotesList();
    if (!r.ok) {
      if (r.status === 401) {
        router.replace("/login");
        return;
      }
      setError(r.detail);
      setNotes([]);
    } else {
      setNotes(r.data);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate() {
    setCreating(true);
    setError("");
    const r = await createNote({ title: "Untitled" });
    setCreating(false);
    if (!r.ok) {
      if (r.status === 401) {
        router.replace("/login");
        return;
      }
      setError(r.detail);
      return;
    }
    router.push(`/dashboard/notes/${r.data.id}`);
  }

  async function onDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    const r = await deleteNote(id);
    if (!r.ok) {
      if (r.status === 401) {
        router.replace("/login");
        return;
      }
      setError(r.detail);
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Notes
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
            Sketch notes on a grid canvas — pens, highlighter colors, undo, and auto-save to your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onCreate()}
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-opacity disabled:opacity-60"
          style={{
            background: `linear-gradient(145deg, ${primary} 0%, #ea580c 100%)`,
            boxShadow: "0 8px 24px -8px rgba(255, 122, 26, 0.45)",
          }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {creating ? "Creating…" : "New note"}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading notes…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-400 mb-3 block">draw</span>
          <p className="text-slate-600 dark:text-slate-400 mb-4">No notes yet. Create one to start sketching.</p>
          <button
            type="button"
            onClick={() => void onCreate()}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200 hover:bg-orange-500/20 disabled:opacity-60"
          >
            Create first note
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <div
              key={n.id}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 transition-colors hover:border-orange-500/30"
            >
              <Link href={`/dashboard/notes/${n.id}`} className="block">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:underline pr-8">
                  {n.title}
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  Updated {formatDate(n.updated_at)}
                </p>
                <span
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: primary }}
                >
                  Open
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={(e) => void onDelete(n.id, e)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-red-500/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
                aria-label="Delete note"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
