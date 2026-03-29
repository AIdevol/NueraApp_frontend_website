"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

type CreatePayload = {
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  statement: string;
  constraints?: string | null;
  examples?: string | null;
};

const TOPICS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Queue",
  "Linked List",
  "Binary Search",
  "Trees",
  "Heaps",
  "Graphs",
  "Dynamic Programming",
  "Greedy",
  "Backtracking",
] as const;

export default function CreatePracticeProblemPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Arrays");
  const [difficulty, setDifficulty] = useState<CreatePayload["difficulty"]>("Easy");
  const [tagsText, setTagsText] = useState("");
  const [statement, setStatement] = useState("");
  const [constraints, setConstraints] = useState("");
  const [examples, setExamples] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tags = useMemo(() => {
    return tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);
  }, [tagsText]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Please enter a title.");
    if (!statement.trim()) return setError("Please enter the problem statement.");

    setLoading(true);
    try {
      const payload: CreatePayload = {
        title: title.trim(),
        topic,
        difficulty,
        tags,
        statement: statement.trim(),
        constraints: constraints.trim() ? constraints.trim() : null,
        examples: examples.trim() ? examples.trim() : null,
      };

      const res = await fetch(`${getPublicApiUrl()}/api/v1/practice-problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as any).detail || "Failed to create problem.");
        return;
      }
      const id = (data as any).id as string | undefined;
      if (id) router.push(`/dashboard/practice/${encodeURIComponent(id)}`);
      else router.push("/dashboard/practice");
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }

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
          href="/dashboard/practice"
          className="text-sm font-semibold hover:opacity-80"
          style={{ color: primary }}
        >
          Practice list
        </Link>
      </div>

      <div className="glassmorphism rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create practice problem
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add a new problem to your DSA practice set.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Two Sum"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as CreatePayload["difficulty"])}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 px-3 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="e.g. hashmap, two pointers, frequency"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              />
              {!!tags.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Problem statement
            </label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={8}
              placeholder="Describe the task, input/output, and edge cases."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Constraints (optional)
              </label>
              <textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                rows={4}
                placeholder="e.g. 1 ≤ n ≤ 2e5"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Examples (optional)
              </label>
              <textarea
                value={examples}
                onChange={(e) => setExamples(e.target.value)}
                rows={4}
                placeholder={"Example:\nInput: ...\nOutput: ...\nExplanation: ..."}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-70"
              style={{ backgroundColor: primary }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Creating…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">add</span>
                  Create problem
                </>
              )}
            </button>
            <Link
              href="/dashboard/practice"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 hover:border-primary/50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

