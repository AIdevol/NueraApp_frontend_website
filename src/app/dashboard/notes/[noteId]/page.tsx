"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { StudentNotesCanvas } from "@/components/StudentNotesCanvas";
import { fetchNote, patchNote, type NoteDetail } from "@/lib/studentNotesApi";
import { primary } from "@/lib/theme";

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.noteId;
  const noteId = typeof rawId === "string" ? Number.parseInt(rawId, 10) : NaN;

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(noteId)) {
      setError("Invalid note.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const r = await fetchNote(noteId);
    if (!r.ok) {
      if (r.status === 401) {
        router.replace("/login");
        return;
      }
      if (r.status === 404) {
        setError("Note not found.");
      } else {
        setError(r.detail);
      }
      setNote(null);
      setLoading(false);
      return;
    }
    setNote(r.data);
    setTitle(r.data.title);
    setLoading(false);
  }, [noteId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  function onTitleChange(next: string) {
    setTitle(next);
    if (!Number.isFinite(noteId) || !note) return;
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(async () => {
      const trimmed = next.trim();
      if (!trimmed || trimmed === note.title) return;
      setSaveState("saving");
      const r = await patchNote(noteId, { title: trimmed });
      if (r.ok) {
        setNote(r.data);
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1500);
      } else if (r.status === 401) {
        router.replace("/login");
      } else {
        setSaveState("idle");
      }
    }, 600);
  }

  useEffect(() => {
    return () => {
      if (titleTimer.current) clearTimeout(titleTimer.current);
    };
  }, []);

  if (!Number.isFinite(noteId)) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-6 text-red-300">
        Invalid note link.{" "}
        <Link href="/dashboard/notes" className="underline" style={{ color: primary }}>
          Back to notes
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700"
          style={{ borderTopColor: primary }}
        />
        <p className="text-sm text-zinc-400">Loading note…</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-6 text-red-300">
        {error || "Could not load note."}{" "}
        <Link href="/dashboard/notes" className="underline" style={{ color: primary }}>
          Back to notes
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-orange-500/15 pb-3">
        <Link
          href="/dashboard/notes"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          All notes
        </Link>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-orange-500/20 bg-zinc-900/80 px-3 py-2 text-base font-semibold text-zinc-100 outline-none focus:border-orange-500/40 sm:max-w-md"
          placeholder="Note title"
          aria-label="Note title"
        />
        <span className="text-xs text-zinc-500" aria-live="polite">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "Saved"}
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <StudentNotesCanvas
          noteId={noteId}
          noteTitle={title}
          sceneJson={note.scene_json}
          onSceneSaved={() => {
            setSaveState("saved");
            window.setTimeout(() => setSaveState("idle"), 1500);
          }}
        />
      </div>
    </div>
  );
}
