"use client";

import { adminFetch } from "@/lib/adminApi";
import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";
import { useCallback, useEffect, useState } from "react";

type Problem = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  tags: string[];
  statement: string;
};

type ListRes = { problems: Problem[] };

export default function AdminProblemsPage() {
  const [list, setList] = useState<Problem[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("General");
  const [difficulty, setDifficulty] = useState("Easy");
  const [statement, setStatement] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const base = getPublicApiUrl();
    if (!base) return;
    const res = await fetch(`${base}/api/v1/practice-problems`, { cache: "no-store" });
    const data = (await res.json()) as ListRes;
    setList(data.problems ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProblem(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const r = await adminFetch<Problem>("/practice-problems", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        topic: topic.trim(),
        difficulty,
        tags: [],
        statement: statement.trim(),
        constraints: null,
        examples: null,
      }),
    });
    setSaving(false);
    if (!r.ok) {
      setError(r.detail);
      return;
    }
    setTitle("");
    setStatement("");
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this problem?")) return;
    const r = await adminFetch(`/practice-problems/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) {
      setError((r as { detail: string }).detail || "Delete failed");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Practice problems</h1>
        <p className="mt-1 text-sm text-zinc-500">Create and delete problems (requires admin token).</p>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <form onSubmit={createProblem} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-sm font-semibold text-zinc-300">New problem</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-zinc-500">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500">Statement</label>
          <textarea
            required
            rows={5}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: primary }}
        >
          {saving ? "Saving…" : "Create problem"}
        </button>
      </form>

      <div className="rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3 w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-zinc-200">{p.title}</td>
                <td className="px-4 py-3 text-zinc-500">{p.topic}</td>
                <td className="px-4 py-3 text-zinc-500">{p.difficulty}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => void remove(p.id)} className="text-xs text-red-400 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
