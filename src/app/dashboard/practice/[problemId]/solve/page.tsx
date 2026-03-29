"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

type PracticeProblem = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  tags?: string[];
  statement: string;
  constraints?: string | null;
  examples?: string | null;
};

type Language = "python" | "javascript" | "cpp";

type LeftTab = "question" | "solution" | "submissions" | "discuss";

type TestCase = { id: string; label: string; input: string; expected: string };

type SubmissionRow = { at: string; lang: Language; note: string };

function defaultTemplate(lang: Language, title: string) {
  if (lang === "python") {
    return `# ${title}\nfrom typing import List, Optional\n\nclass Solution:\n    def solve(self) -> None:\n        """Implement your solution here."""\n        pass\n`;
  }
  if (lang === "javascript") {
    return `// ${title}\n/**\n * @param {number[]} nums\n * @returns {boolean}\n */\nfunction solve(nums) {\n  // ...\n}\n`;
  }
  return `// ${title}\n#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // ...\n    }\n};\n`;
}

function difficultyStyle(difficulty: string) {
  const d = String(difficulty).toLowerCase();
  if (d === "easy") {
    return {
      border: "rgba(16,185,129,0.4)",
      color: "rgb(16 185 129)",
      bg: "rgba(16,185,129,0.12)",
    };
  }
  if (d === "medium") {
    return {
      border: "rgba(245,158,11,0.4)",
      color: "rgb(245 158 11)",
      bg: "rgba(245,158,11,0.12)",
    };
  }
  return {
    border: "rgba(239,68,68,0.4)",
    color: "rgb(239 68 68)",
    bg: "rgba(239,68,68,0.12)",
  };
}

function mockCasesFor(problem: PracticeProblem): TestCase[] {
  const topic = problem.topic || "Problem";
  return [
    {
      id: "1",
      label: "Case 1",
      input: `${topic} — sample input A\n(Replace with real I/O when judge is connected.)`,
      expected: "Expected output A",
    },
    {
      id: "2",
      label: "Case 2",
      input: `${topic} — sample input B\n(Edge case placeholder.)`,
      expected: "Expected output B",
    },
  ];
}

function tabButtonClass(active: boolean) {
  return [
    "px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors",
    active
      ? "border-orange-500 text-zinc-100"
      : "border-transparent text-zinc-500 hover:text-zinc-200",
  ].join(" ");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightCode(code: string, lang: Language): string {
  const tokens: string[] = [];
  const save = (html: string) => `@@TOK${tokens.push(html) - 1}@@`;

  let out = escapeHtml(code);
  const commentRe = lang === "python" ? /(#.*)$/gm : /(\/\/.*)$/gm;
  out = out
    .replace(commentRe, (m) => save(`<span style="color:#6b7280;font-style:italic">${m}</span>`))
    .replace(
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
      (m) => save(`<span style="color:#c3e88d">${m}</span>`)
    )
    .replace(
      /\b(class|def|return|if|else|elif|for|while|in|import|from|try|except|finally|pass|break|continue|function|const|let|var|new|switch|case|default|public|private|protected|void|int|long|float|double|char|bool|true|false|null|nullptr|using|namespace|include)\b/g,
      '<span style="color:#c792ea">$1</span>'
    )
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#f78c6c">$1</span>');

  return out.replace(/@@TOK(\d+)@@/g, (_, i) => tokens[Number(i)] ?? "");
}

export default function PracticeSolvePage() {
  const router = useRouter();
  const params = useParams<{ problemId: string }>();
  const problemId = useMemo(() => decodeURIComponent(params.problemId ?? ""), [params.problemId]);

  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storageKey = useMemo(() => `practice:solution:${problemId}`, [problemId]);
  const solvedKey = useMemo(() => `practice:solved:${problemId}`, [problemId]);
  const submissionsKey = useMemo(() => `practice:submissions:${problemId}`, [problemId]);

  const [lang, setLang] = useState<Language>("python");
  const [code, setCode] = useState("");
  const [leftTab, setLeftTab] = useState<LeftTab>("question");
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [consoleLines, setConsoleLines] = useState<string[]>([">> Ready. Run executes a local dry-run; Submit saves your code."]);
  const [caseStatus, setCaseStatus] = useState<Record<string, "idle" | "pass" | "fail">>({});
  const [solved, setSolved] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const codeHighlightRef = useRef<HTMLPreElement>(null);

  const appendConsole = useCallback((lines: string[]) => {
    setConsoleLines((prev) => [...prev, ...lines]);
  }, []);

  useEffect(() => {
    async function loadProblem() {
      setLoading(true);
      setError("");
      try {
        const api = getPublicApiUrl();
        const res1 = await fetch(`${api}/api/v1/practice-problems/${encodeURIComponent(problemId)}`);
        if (res1.ok) {
          const data1 = await res1.json().catch(() => ({}));
          setProblem(data1 as PracticeProblem);
          return;
        }
        const res2 = await fetch(`${api}/api/v1/problem-library/dsa/${encodeURIComponent(problemId)}`);
        const data2 = await res2.json().catch(() => ({}));
        if (!res2.ok) {
          setError((data2 as { detail?: string }).detail || "Failed to load problem");
          setProblem(null);
          return;
        }
        setProblem(data2 as PracticeProblem);
      } catch {
        setError("Connection error.");
        setProblem(null);
      } finally {
        setLoading(false);
      }
    }
    if (problemId) void loadProblem();
  }, [problemId]);

  useEffect(() => {
    if (typeof window === "undefined" || !problemId) return;
    setSolved(localStorage.getItem(solvedKey) === "1");
    try {
      const raw = localStorage.getItem(submissionsKey);
      if (raw) setSubmissions(JSON.parse(raw) as SubmissionRow[]);
    } catch {
      setSubmissions([]);
    }
  }, [problemId, solvedKey, submissionsKey]);

  useEffect(() => {
    if (!problemId) return;
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { lang?: Language; code?: string };
        if (parsed.lang) setLang(parsed.lang);
        if (parsed.code != null) setCode(parsed.code);
        return;
      } catch {
        // ignore
      }
    }
  }, [problemId, storageKey]);

  useEffect(() => {
    if (!problem) return;
    if (code.trim().length > 0) return;
    setCode(defaultTemplate(lang, problem.title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, lang]);

  const testCases = useMemo(() => (problem ? mockCasesFor(problem) : []), [problem]);

  function persist(next: { lang: Language; code: string }) {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function onChangeLang(next: Language) {
    setLang(next);
    const nextCode = code.trim().length ? code : defaultTemplate(next, problem?.title ?? "Solution");
    persist({ lang: next, code: nextCode });
    appendConsole([`>> Switched language → ${next}`]);
  }

  function onChangeCode(nextCode: string) {
    setCode(nextCode);
    persist({ lang, code: nextCode });
  }

  function onCodeScroll() {
    const el = codeTextareaRef.current;
    if (!el || !codeHighlightRef.current) return;
    codeHighlightRef.current.scrollTop = el.scrollTop;
    codeHighlightRef.current.scrollLeft = el.scrollLeft;
  }

  function resetTemplate() {
    const next = defaultTemplate(lang, problem?.title ?? "Solution");
    setCode(next);
    persist({ lang, code: next });
    appendConsole([">> Reset to template."]);
  }

  function runCode() {
    appendConsole([">> Running dry-run…", ">> No remote judge is configured yet. Test tabs are placeholders."]);
    const next: Record<string, "idle" | "pass" | "fail"> = {};
    for (const c of testCases) next[c.id] = "fail";
    setCaseStatus(next);
    appendConsole([
      "Error",
      "TypeError: execution backend not connected (0 judges available).",
      "Tip: wire your API to a sandbox runner to enable real tests.",
    ]);
  }

  function submitCode() {
    const row: SubmissionRow = {
      at: new Date().toISOString(),
      lang,
      note: "Saved locally",
    };
    const nextSubs = [row, ...submissions].slice(0, 20);
    setSubmissions(nextSubs);
    if (typeof window !== "undefined") {
      localStorage.setItem(submissionsKey, JSON.stringify(nextSubs));
      localStorage.setItem(solvedKey, "1");
    }
    setSolved(true);
    appendConsole([">> Submit: saved to this browser.", `>> Language: ${lang}`, ">> Full grading requires a connected judge."]);
  }

  const diff = problem ? difficultyStyle(problem.difficulty) : difficultyStyle("Easy");

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full bg-background-dark border border-zinc-800 rounded-lg overflow-hidden">
      {/* Top chrome */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-zinc-800 bg-[#0c0c0f]">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-bold text-zinc-100 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>
        <Link
          href="/dashboard/practice"
          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-sm font-bold border border-orange-500/25 hover:bg-orange-500/10 transition-colors shrink-0"
          style={{ color: primary }}
        >
          Problem list
        </Link>
        {problem && (
          <p className="text-sm font-medium text-zinc-400 truncate min-w-0">
            {problem.title}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-zinc-800 animate-spin" style={{ borderTopColor: primary }} />
          <p className="text-zinc-500">Opening workspace…</p>
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
            <p className="text-red-400 font-semibold">{error}</p>
          </div>
        </div>
      ) : !problem ? (
        <div className="p-6">
          <p className="text-zinc-300 font-semibold">Problem not found.</p>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          {/* Left: problem workspace */}
          <section className="flex flex-col min-h-[42vh] lg:min-h-0 lg:w-[46%] lg:max-w-[560px] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-[#0c0c0f]">
            <div className="flex border-b border-zinc-800 px-3 pt-1.5 gap-2 overflow-x-auto">
              {(["question", "solution", "submissions", "discuss"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={tabButtonClass(leftTab === tab)}
                  onClick={() => setLeftTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-6">
              {leftTab === "question" && (
                <>
                  <h1 className="text-lg font-bold tracking-tight text-zinc-50 leading-snug">
                    {problem.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {solved && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Solved
                      </span>
                    )}
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
                      style={{ borderColor: diff.border, color: diff.color, backgroundColor: diff.bg }}
                    >
                      {problem.difficulty}
                    </span>
                    <span className="text-xs font-medium text-zinc-200 bg-zinc-800 px-2.5 py-0.5 rounded-full">
                      {problem.topic}
                    </span>
                    <Link
                      href={`/dashboard/practice/${encodeURIComponent(problemId)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border border-zinc-700 hover:border-orange-500/40 transition-colors"
                      style={{ color: primary }}
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Detail
                    </Link>
                  </div>

                  {!!problem.tags?.length && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {problem.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-800/60 text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 border-t border-zinc-800 pt-5 space-y-5">
                    <div>
                      <h2 className="text-sm font-bold text-zinc-100 mb-2">Description</h2>
                      <div className="text-[13px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
                        {problem.statement}
                      </div>
                    </div>
                    {!!problem.constraints && (
                      <div>
                        <h2 className="text-sm font-bold text-zinc-100 mb-2">Constraints</h2>
                        <pre className="text-xs font-mono leading-relaxed text-zinc-300 whitespace-pre-wrap rounded-lg bg-black/60 border border-zinc-800 p-3">
                          {problem.constraints}
                        </pre>
                      </div>
                    )}
                    {!!problem.examples && (
                      <div>
                        <h2 className="text-sm font-bold text-zinc-100 mb-2">Examples</h2>
                        <pre className="text-xs font-mono leading-relaxed text-zinc-300 whitespace-pre-wrap rounded-lg bg-black/60 border border-zinc-800 p-3">
                          {problem.examples}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              )}

              {leftTab === "solution" && (
                <div className="space-y-3 rounded-xl border border-zinc-800 bg-black p-4">
                  <h2 className="text-sm font-bold text-zinc-100">Editorial</h2>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Hints and official solutions can be plugged in from your curriculum API. For now, try restating the problem,
                    pick a pattern (e.g. hashing, two pointers), then sketch complexity before coding.
                  </p>
                  <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-300">
                    <span className="material-symbols-outlined text-lg align-middle mr-1" style={{ color: primary }}>
                      lightbulb
                    </span>
                    Break the statement into inputs, output, and invariants. If you see “frequency” or “duplicate”, consider a set
                    or map.
                  </div>
                </div>
              )}

              {leftTab === "submissions" && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-zinc-100">Your submissions</h2>
                  {submissions.length === 0 ? (
                    <p className="text-sm text-zinc-500">No submissions yet. Submit from the editor to record an attempt.</p>
                  ) : (
                    <ul className="space-y-2">
                      {submissions.map((s, i) => (
                        <li
                          key={`${s.at}-${i}`}
                          className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300"
                        >
                          <span className="text-zinc-500">{new Date(s.at).toLocaleString()}</span>
                          <span className="mx-2">·</span>
                          {s.lang}
                          <span className="mx-2">·</span>
                          {s.note}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {leftTab === "discuss" && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-zinc-100">Discuss</h2>
                  <p className="text-sm text-zinc-400">
                    Threaded discussion per problem can live here or link to your forums.
                  </p>
                  <Link
                    href="/dashboard/discussions"
                    className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-90"
                    style={{ color: primary }}
                  >
                    Open discussions
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Right: editor + console */}
          <section className="flex flex-1 min-h-0 min-w-0 flex-col bg-zinc-950">
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-zinc-800 bg-black">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-orange-400 text-lg shrink-0">code</span>
                <span className="text-sm font-semibold text-zinc-200 truncate px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700">
                  Solution 1
                </span>
                <select
                  value={lang}
                  onChange={(e) => onChangeLang(e.target.value as Language)}
                  className="text-xs font-semibold rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-600 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:border-zinc-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  Reset
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-rows-[minmax(220px,1fr)_minmax(140px,38%)]">
              <div className="min-h-0 border-b border-zinc-800">
                <div className="relative w-full h-full min-h-0">
                  <pre
                    ref={codeHighlightRef}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full min-h-0 overflow-auto font-mono text-[13px] leading-relaxed bg-zinc-950 text-zinc-100 p-4 pointer-events-none whitespace-pre"
                    dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }}
                  />
                  <textarea
                    ref={codeTextareaRef}
                    value={code}
                    onChange={(e) => onChangeCode(e.target.value)}
                    onScroll={onCodeScroll}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full min-h-0 resize-none font-mono text-[13px] leading-relaxed bg-transparent text-transparent caret-orange-300 p-4 outline-none selection:bg-primary/30"
                    aria-label="Code editor"
                  />
                </div>
              </div>

              <div className="flex flex-col min-h-0 bg-black">
                <div className="shrink-0 flex items-center justify-between gap-2 px-2 border-b border-zinc-800">
                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    {testCases.map((c, idx) => {
                      const st = caseStatus[c.id];
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setActiveCaseIdx(idx)}
                          className={[
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap",
                            activeCaseIdx === idx ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200",
                          ].join(" ")}
                        >
                          {c.label}
                          {st === "pass" && <span className="text-emerald-400 material-symbols-outlined text-sm">check</span>}
                          {st === "fail" && <span className="text-red-400 material-symbols-outlined text-sm">close</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 pr-2 py-1">
                    <button
                      type="button"
                      onClick={runCode}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-zinc-600 text-sm font-bold text-zinc-100 hover:bg-zinc-700 hover:border-zinc-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">play_arrow</span>
                      Run
                    </button>
                    <button
                      type="button"
                      onClick={submitCode}
                      className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg text-sm font-bold text-white shadow-[0_4px_16px_-2px_rgba(255,122,26,0.5)] hover:brightness-110 transition-all"
                      style={{ backgroundColor: primary }}
                    >
                      <span className="material-symbols-outlined text-base">cloud_upload</span>
                      Submit
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800">
                  <div className="bg-black p-3 min-h-0 overflow-y-auto">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Input</p>
                    <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">{testCases[activeCaseIdx]?.input}</pre>
                  </div>
                  <div className="bg-black p-3 min-h-0 overflow-y-auto">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Expected</p>
                    <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">{testCases[activeCaseIdx]?.expected}</pre>
                  </div>
                </div>

                <div className="shrink-0 max-h-[min(200px,28vh)] overflow-y-auto border-t border-zinc-800 p-3 font-mono text-[11px] leading-relaxed">
                  {consoleLines.map((line, i) => {
                    const isErr = line.startsWith("Error") || line.startsWith("TypeError");
                    return (
                      <div
                        key={`${i}-${line.slice(0, 24)}`}
                        className={isErr ? "text-red-400" : "text-zinc-500"}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
