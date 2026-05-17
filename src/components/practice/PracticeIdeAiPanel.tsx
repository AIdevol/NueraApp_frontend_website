"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { sendAiChatMessage } from "@/lib/aiChatClient";
import { formatAssistantMessage } from "@/lib/chatText";
import { primary } from "@/lib/theme";

type PracticeProblem = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  statement: string;
  constraints?: string | null;
  examples?: string | null;
};

type LearnLinkItem = { label: string; href: string };

type ChatLine = { role: "user" | "assistant"; content: string; learnLinks?: LearnLinkItem[] };

const QUICK_PROMPTS = [
  "Give a small hint (no full solution).",
  "What pattern or data structure fits this problem?",
  "What edge cases should I consider?",
  "Rough time and space complexity for a good approach?",
] as const;

function buildIdeMessage(problem: PracticeProblem, language: string, code: string, studentQuestion: string): string {
  const stmt = problem.statement.slice(0, 1600);
  const snippet = code.slice(0, 1400);
  const cons = problem.constraints?.trim()
    ? `\nConstraints:\n${problem.constraints.trim().slice(0, 350)}`
    : "";
  const ex = problem.examples?.trim() ? `\nExamples:\n${problem.examples.trim().slice(0, 350)}` : "";
  const tail = studentQuestion.trim().slice(0, 900);
  return [
    "[You are inside a coding practice IDE. Reply briefly: at most 8 short bullets or small paragraphs. Do not print a complete working solution unless the student explicitly asks for full code. Prefer hints, approach, invariants, and pitfalls.]",
    "",
    `Problem: ${problem.title}`,
    `Topic: ${problem.topic} · ${problem.difficulty} · Language: ${language}`,
    "",
    "Statement:",
    stmt,
    cons,
    ex,
    "",
    "Student code (may be incomplete):",
    snippet + (code.length > 1400 ? "\n… (truncated)" : ""),
    "",
    "Student question:",
    tail,
  ].join("\n");
}

type Props = {
  variant: "sidebar" | "sheet";
  problem: PracticeProblem | null;
  language: string;
  code: string;
  onClose: () => void;
};

export default function PracticeIdeAiPanel({ variant, problem, language, code, onClose }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<ChatLine[]>([
    {
      role: "assistant",
      content:
        "Ask for a hint, approach, or edge cases. Replies stay short so you can keep coding.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLines([
      {
        role: "assistant",
        content:
          "Ask for a hint, approach, or edge cases. Replies stay short so you can keep coding.",
      },
    ]);
    setInput("");
    setError("");
  }, [problem?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, busy]);

  const sendRaw = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || busy) return;
      if (!problem) {
        setError("Problem is still loading.");
        return;
      }
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.replace("/login");
        return;
      }

      setError("");
      setLines((prev) => [...prev, { role: "user", content: q }]);
      setBusy(true);
      try {
        const msg = buildIdeMessage(problem, language, code, q).slice(0, 4096);
        const { data, error: chatError } = await sendAiChatMessage(msg, token);

        if (chatError?.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }

        if (chatError) {
          setError(chatError.message);
          setLines((prev) => [
            ...prev,
            { role: "assistant", content: "Something went wrong. Try again in a moment." },
          ]);
          return;
        }

        if (data) {
          setLines((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.reply.trim() || "No reply text.",
              learnLinks: data.learnLinks,
            },
          ]);
        }
      } catch {
        setError("Connection error.");
        setLines((prev) => [...prev, { role: "assistant", content: "Network issue — check your connection." }]);
      } finally {
        setBusy(false);
      }
    },
    [busy, code, language, problem, router]
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput("");
    void sendRaw(q);
  }

  const shell =
    variant === "sidebar"
      ? "flex h-full min-h-0 w-[272px] shrink-0 flex-col border-l border-zinc-800 bg-[#0f0f12]"
      : "flex max-h-[42vh] min-h-[220px] flex-col rounded-t-2xl border border-zinc-700 border-b-0 bg-[#0f0f12] shadow-[0_-8px_40px_rgba(0,0,0,0.55)]";

  const inner = (
    <div className={`${shell} overflow-hidden`} onClick={(e) => e.stopPropagation()}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined shrink-0 text-lg text-orange-400">smart_toy</span>
          <span className="truncate text-xs font-bold uppercase tracking-wide text-zinc-400">AI help</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Close AI panel"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2 [scrollbar-gutter:stable]"
      >
        {lines.map((line, i) => (
          <div
            key={`${i}-${line.role}-${line.content.slice(0, 20)}`}
            className={line.role === "user" ? "rounded-lg bg-zinc-800/80 px-2.5 py-2" : "rounded-lg border border-zinc-800/80 bg-black/30 px-2.5 py-2"}
          >
            {line.role === "user" ? (
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-300">{line.content}</p>
            ) : (
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-300">
                {formatAssistantMessage(line.content)}
              </p>
            )}
            {line.role === "assistant" && line.learnLinks && line.learnLinks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-zinc-800/80 pt-2">
                {line.learnLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-[10px] font-semibold underline-offset-2 hover:underline"
                    style={{ color: primary }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 px-1 py-1 text-[11px] text-zinc-500">
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            Thinking…
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-800 bg-[#121214] px-2 py-2">
        <div className="mb-2 flex flex-wrap gap-1">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={busy || !problem}
              onClick={() => void sendRaw(p)}
              className="max-w-full rounded-full border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-left text-[10px] font-semibold leading-snug text-zinc-300 hover:border-orange-500/40 hover:text-zinc-100 disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
        {error && <p className="mb-2 text-[10px] text-red-400">{error}</p>}
        <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            maxLength={800}
            disabled={busy || !problem}
            placeholder={problem ? "Ask the AI…" : "Loading problem…"}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-[#1a1a1f] px-2.5 py-2 text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/25 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              if (e.shiftKey) return;
              e.preventDefault();
              const q = input.trim();
              if (!q || busy || !problem) return;
              setInput("");
              void sendRaw(q);
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-zinc-600">↵ send · Shift+↵ newline</span>
            <button
              type="submit"
              disabled={busy || !input.trim() || !problem}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-45"
              style={{ backgroundColor: primary }}
            >
              <span className="material-symbols-outlined text-sm">send</span>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (variant === "sheet") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-[2px] lg:hidden"
        role="presentation"
        onClick={onClose}
      >
        {inner}
      </div>
    );
  }

  return inner;
}
