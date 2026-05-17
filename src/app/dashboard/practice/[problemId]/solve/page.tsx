"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PracticeIdeAiPanel from "@/components/practice/PracticeIdeAiPanel";
import PracticeMonacoEditor from "@/components/practice/PracticeMonacoEditor";
import { bearerAuthHeaders } from "@/lib/authHeaders";
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

type TestCaseField = { name: string; value: string };

type TestCase = {
  id: string;
  label: string;
  /** Named parameters (e.g. nums, target) shown as labeled inputs */
  fields: TestCaseField[];
  expected: string;
};

type BottomIdeTab = "testcase" | "result";

type SubmissionRow = { at: string; lang: Language; note: string };

type ServerSubmission = {
  id: string;
  problem_id: string;
  language: string;
  status: string;
  passed: number;
  total: number;
  execution_time_ms: number;
  memory_kb: number;
  attempt: number;
  created_at: string;
  hints?: string | null;
};

/** Fixes legacy or hand-edited boilerplate that breaks Python (e.g. stray comma before `->`). */
function sanitizeStoredCode(raw: string, lang: Language): string {
  if (lang !== "python") return raw;
  return raw.replace(/def\s+solve\s*\(\s*self\s*,\s*->/g, "def solve(self) ->");
}

function defaultTemplate(lang: Language, title: string) {
  if (lang === "python") {
    return `# ${title}\nfrom typing import Any\n\nclass Solution:\n    def solve(self, data: dict[str, Any]):\n        \"\"\"Return the output for the given testcase data.\"\"\"\n        return None\n`;
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

function defaultTestCases(): TestCase[] {
  return [
    {
      id: "1",
      label: "Case 1",
      fields: [{ name: "input", value: "" }],
      expected: "",
    },
  ];
}

function casesStorageKey(userPrefix: string, problemId: string) {
  return `practice:${userPrefix}:testcases:${problemId}`;
}

function migrateLegacyCase(raw: unknown): TestCase | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.label !== "string") return null;
  if (Array.isArray(o.fields) && o.fields.length) {
    const fields = (o.fields as TestCaseField[]).filter(
      (f) => f && typeof f.name === "string" && typeof f.value === "string"
    );
    if (!fields.length) return null;
    return {
      id: o.id,
      label: o.label,
      fields,
      expected: typeof o.expected === "string" ? o.expected : "",
    };
  }
  if (typeof o.input === "string") {
    return {
      id: o.id,
      label: o.label,
      fields: [{ name: "input", value: o.input }],
      expected: typeof o.expected === "string" ? o.expected : "",
    };
  }
  return null;
}

function tabButtonClass(active: boolean) {
  return [
    "px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors",
    active
      ? "border-orange-500 text-zinc-100"
      : "border-transparent text-zinc-500 hover:text-zinc-200",
  ].join(" ");
}

export default function PracticeSolvePage() {
  const router = useRouter();
  const params = useParams<{ problemId: string }>();
  const problemId = useMemo(() => decodeURIComponent(params.problemId ?? ""), [params.problemId]);

  function hashString(input: string): string {
    // Simple non-crypto hash to keep localStorage keys short.
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
  }

  const [userPrefix, setUserPrefix] = useState("anon");

  useEffect(() => {
    // Namespace localStorage so saved solutions/submissions are per authenticated user.
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token") || "";
    setUserPrefix(token ? `u:${hashString(token)}` : "anon");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storageKey = useMemo(() => `practice:${userPrefix}:solution:${problemId}`, [problemId, userPrefix]);
  const solvedKey = useMemo(() => `practice:${userPrefix}:solved:${problemId}`, [problemId, userPrefix]);
  const submissionsKey = useMemo(
    () => `practice:${userPrefix}:submissions:${problemId}`,
    [problemId, userPrefix]
  );

  const [lang, setLang] = useState<Language>("python");
  const [code, setCode] = useState("");
  const [leftTab, setLeftTab] = useState<LeftTab>("question");
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [ideBottomTab, setIdeBottomTab] = useState<BottomIdeTab>("testcase");
  const [testCasesState, setTestCasesState] = useState<TestCase[]>([]);
  const [leftWidthPct, setLeftWidthPct] = useState(40);
  const [editorFrac, setEditorFrac] = useState(0.58);
  const [showTestcaseSource, setShowTestcaseSource] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>([
    ">> Ready. Python runs on the server; JavaScript is parse-checked in the browser; C++ uses a syntax-only compile when a compiler is available.",
  ]);
  const [lastRunMeta, setLastRunMeta] = useState<{
    status?: string;
    execution_time?: string;
    memory_used?: string;
    hints?: string;
  } | null>(null);
  const [caseStatus, setCaseStatus] = useState<Record<string, "idle" | "pass" | "fail">>({});
  const [runBusy, setRunBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [solved, setSolved] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [serverSubmissions, setServerSubmissions] = useState<ServerSubmission[]>([]);
  const [serverSubmissionsLoading, setServerSubmissionsLoading] = useState(false);
  const [serverSubmissionsRefreshKey, setServerSubmissionsRefreshKey] = useState(0);
  const mainRowRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const hDragRef = useRef<{ startX: number; startPct: number; w: number } | null>(null);
  const vDragRef = useRef<{ startY: number; startFrac: number; h: number } | null>(null);
  const splitPersistRef = useRef({ left: 40, editor: 0.58 });
  const pendingActiveCaseIdx = useRef<number | null>(null);
  const [isWideLayout, setIsWideLayout] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const appendConsole = useCallback((lines: string[]) => {
    setConsoleLines((prev) => [...prev, ...lines]);
  }, []);

  useEffect(() => {
    async function loadProblem() {
      setLoading(true);
      setError("");
      try {
        const api = getPublicApiUrl();
        const headers = bearerAuthHeaders();
        const res = await fetch(`${api}/api/v1/practice-problems/${encodeURIComponent(problemId)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { detail?: string }).detail || "Failed to load problem");
          setProblem(null);
          return;
        }
        setProblem(data as PracticeProblem);
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
    async function loadServerSubmissions() {
      if (typeof window === "undefined" || !problemId) return;
      const api = getPublicApiUrl();
      const headers = bearerAuthHeaders();
      if (!headers.Authorization) return;

      setServerSubmissionsLoading(true);
      try {
        const res = await fetch(
          `${api}/api/v1/practice-problems/submissions?problem_id=${encodeURIComponent(problemId)}&limit=8`,
          { headers }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray((data as any).submissions)) {
          setServerSubmissions((data as any).submissions as ServerSubmission[]);
        } else {
          setServerSubmissions([]);
        }
      } catch {
        setServerSubmissions([]);
      } finally {
        setServerSubmissionsLoading(false);
      }
    }

    void loadServerSubmissions();
  }, [problemId, serverSubmissionsRefreshKey]);

  useEffect(() => {
    if (!problemId) return;
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { lang?: Language; code?: string };
        const nextLang = (parsed.lang ?? "python") as Language;
        if (parsed.lang) setLang(nextLang);
        if (parsed.code != null) {
          const fixed = sanitizeStoredCode(parsed.code, nextLang);
          setCode(fixed);
          if (fixed !== parsed.code) {
            localStorage.setItem(storageKey, JSON.stringify({ lang: nextLang, code: fixed }));
          }
        }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsWideLayout(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isFullScreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    // Prevent background scroll while the IDE covers the viewport.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullScreen]);

  useEffect(() => {
    if (typeof window === "undefined" || !problemId) return;
    try {
      const raw = localStorage.getItem(`practice:${userPrefix}:ideSplit:${problemId}`);
      if (raw) {
        const j = JSON.parse(raw) as { left?: number; editor?: number };
        if (typeof j.left === "number" && j.left >= 22 && j.left <= 58) setLeftWidthPct(j.left);
        if (typeof j.editor === "number" && j.editor >= 0.28 && j.editor <= 0.82) setEditorFrac(j.editor);
      }
    } catch {
      // ignore
    }
  }, [problemId, userPrefix]);

  useEffect(() => {
    splitPersistRef.current = { left: leftWidthPct, editor: editorFrac };
  }, [leftWidthPct, editorFrac]);

  useEffect(() => {
    if (!problem) return;
    if (typeof window === "undefined" || !problemId) return;
    try {
      const raw = localStorage.getItem(casesStorageKey(userPrefix, problemId));
      if (raw) {
        const arr = JSON.parse(raw) as unknown[];
        if (Array.isArray(arr) && arr.length) {
          const migrated = arr.map(migrateLegacyCase).filter((c): c is TestCase => c != null);
          if (migrated.length) {
            setTestCasesState(migrated);
            setActiveCaseIdx(0);
            return;
          }
        }
      }
    } catch {
      // ignore
    }
    setTestCasesState(defaultTestCases());
    setActiveCaseIdx(0);
  }, [problem, problemId, userPrefix]);

  useEffect(() => {
    if (typeof window === "undefined" || !problemId || testCasesState.length === 0) return;
    try {
      localStorage.setItem(casesStorageKey(userPrefix, problemId), JSON.stringify(testCasesState));
    } catch {
      // ignore
    }
  }, [problemId, userPrefix, testCasesState]);

  useEffect(() => {
    if (pendingActiveCaseIdx.current == null) return;
    const i = pendingActiveCaseIdx.current;
    pendingActiveCaseIdx.current = null;
    setActiveCaseIdx(i);
  }, [testCasesState]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (hDragRef.current && mainRowRef.current) {
        const { startX, startPct, w } = hDragRef.current;
        const dx = e.clientX - startX;
        const deltaPct = (dx / w) * 100;
        setLeftWidthPct(() => Math.min(58, Math.max(22, startPct + deltaPct)));
      }
      if (vDragRef.current && rightColRef.current) {
        const { startY, startFrac, h } = vDragRef.current;
        const dy = e.clientY - startY;
        const deltaFrac = h > 0 ? dy / h : 0;
        setEditorFrac(() => Math.min(0.82, Math.max(0.22, startFrac + deltaFrac)));
      }
    }
    function onUp() {
      if (hDragRef.current || vDragRef.current) {
        try {
          const { left, editor } = splitPersistRef.current;
          if (problemId) {
            localStorage.setItem(
              `practice:${userPrefix}:ideSplit:${problemId}`,
              JSON.stringify({ left, editor })
            );
          }
        } catch {
          // ignore
        }
      }
      hDragRef.current = null;
      vDragRef.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [problemId]);

  function beginHResize(e: React.PointerEvent<HTMLDivElement>) {
    const row = mainRowRef.current;
    if (!row) return;
    e.preventDefault();
    hDragRef.current = { startX: e.clientX, startPct: leftWidthPct, w: row.offsetWidth };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function beginVResize(e: React.PointerEvent<HTMLDivElement>) {
    const col = rightColRef.current;
    if (!col) return;
    e.preventDefault();
    vDragRef.current = { startY: e.clientY, startFrac: editorFrac, h: col.clientHeight };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function addTestCase() {
    setTestCasesState((prev) => {
      const n = prev.length + 1;
      const template = prev[prev.length - 1]?.fields?.length
        ? prev[prev.length - 1]!.fields.map((f) => ({ name: f.name, value: "" }))
        : [{ name: "input", value: "" }];
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `case-${Date.now()}`;
      const next: TestCase[] = [...prev, { id, label: `Case ${n}`, fields: template, expected: "" }];
      pendingActiveCaseIdx.current = next.length - 1;
      return next;
    });
  }

  function setCaseField(caseId: string, fieldIndex: number, value: string) {
    setTestCasesState((prev) =>
      prev.map((c) =>
        c.id !== caseId
          ? c
          : {
              ...c,
              fields: c.fields.map((f, j) => (j === fieldIndex ? { ...f, value } : f)),
            }
      )
    );
  }

  function setCaseExpected(caseId: string, expected: string) {
    setTestCasesState((prev) => prev.map((c) => (c.id === caseId ? { ...c, expected } : c)));
  }

  function removeTestCase(idx: number) {
    setTestCasesState((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
    setActiveCaseIdx((i) => {
      if (idx < i) return i - 1;
      if (idx === i) return Math.max(0, i - 1);
      return i;
    });
  }

  const activeCase = testCasesState[activeCaseIdx] ?? testCasesState[0];

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

  function resetTemplate() {
    const next = defaultTemplate(lang, problem?.title ?? "Solution");
    setCode(next);
    persist({ lang, code: next });
    appendConsole([">> Reset to template."]);
  }

  const runCode = useCallback(async () => {
    if (runBusy) return;
    setRunBusy(true);
    setIdeBottomTab("result");
    appendConsole([`>> Run (${lang})…`]);

    const idleCases: Record<string, "idle" | "pass" | "fail"> = {};
    for (const c of testCasesState) idleCases[c.id] = "idle";

    const failAll = () => {
      const f: Record<string, "idle" | "pass" | "fail"> = {};
      for (const c of testCasesState) f[c.id] = "fail";
      setCaseStatus(f);
    };

    try {
      if (lang === "javascript") {
        try {
          // eslint-disable-next-line no-new-func
          new Function(code);
          appendConsole([">> JavaScript: parse OK.", ">> Execution and custom testcases need a connected judge."]);
          setCaseStatus(idleCases);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          appendConsole([`>> JavaScript parse error: ${msg}`]);
          failAll();
        }
        return;
      }

      const api = getPublicApiUrl();

      if (lang === "python") {
        appendConsole([">> Python: judging against your testcases…"]);
        const headers = bearerAuthHeaders();

        const attemptKey = `practice:${userPrefix}:attempt:${problemId}`;
        let nextAttempt = 1;
        try {
          const raw = localStorage.getItem(attemptKey);
          const parsed = raw ? Number(raw) : 0;
          if (Number.isFinite(parsed)) nextAttempt = parsed + 1;
          localStorage.setItem(attemptKey, String(nextAttempt));
        } catch {
          // ignore
        }

        const payload = {
          language: "python",
          code,
          timeout_sec: 6,
          memory_kb: 256000,
          attempt: nextAttempt,
          async_execution: false,
          problem_id: problemId,
          testcases: testCasesState.map((tc, idx) => ({
            id: String(idx + 1),
            expected: tc.expected,
            fields: (tc.fields || []).map((f) => ({ name: f.name, value: f.value })),
          })),
        };

        const res = await fetch(`${api}/api/v1/practice-problems/run-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(payload),
        });

        const data = (await res.json().catch(() => ({}))) as {
          status?: string;
          passed_testcases?: number;
          total_testcases?: number;
          execution_time?: string;
          memory_used?: string;
          error?: string | null;
          output?: string;
          expected_output?: string;
          hints?: string;
        };

        if (!res.ok || !data.status) {
          appendConsole([`>> Judge error: ${data.error || res.statusText}`]);
          failAll();
          return;
        }

        appendConsole([
          `>> Result: ${data.status}`,
          `>> Passed: ${data.passed_testcases ?? 0}/${data.total_testcases ?? testCasesState.length}`,
          `>> Time: ${data.execution_time || "0 ms"} · Memory: ${data.memory_used || "0 KB"}`,
        ]);

        if (data.output) appendConsole([`>> Output: ${data.output}`]);
        if (data.expected_output && data.status !== "Accepted") {
          appendConsole([`>> Expected: ${data.expected_output}`]);
        }
        if (data.error) appendConsole([`>> Error: ${data.error}`]);
        if (data.hints) appendConsole([`>> Hint: ${data.hints}`]);

        setLastRunMeta({
          status: data.status,
          execution_time: data.execution_time,
          memory_used: data.memory_used,
          hints: data.hints,
        });

        const accepted = data.status === "Accepted";
        setSolved(accepted);
        if (typeof window !== "undefined") {
          localStorage.setItem(solvedKey, accepted ? "1" : "0");
        }
        setServerSubmissionsRefreshKey((k) => k + 1);

        if (data.status === "Accepted") {
          const passed = Object.fromEntries(
            testCasesState.map((c) => [c.id, "pass"] as const)
          ) as Record<string, "idle" | "pass" | "fail">;
          setCaseStatus(passed);
        } else {
          failAll();
        }
        return;
      }

      const res = await fetch(`${api}/api/v1/practice-problems/syntax-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; detail?: string };
      if (!res.ok) {
        appendConsole([
          `>> Syntax API error (${res.status}): ${(data as { detail?: string }).detail || res.statusText}`,
          ">> Is the backend running? You can still edit and Submit to save locally.",
        ]);
        setCaseStatus(idleCases);
        return;
      }
      if (data.ok) {
        appendConsole([`>> ${data.detail || "OK"}`, ">> C++ execution is not enabled here (syntax check only)."]);
        setCaseStatus(idleCases);
      } else {
        appendConsole([`>> ${data.detail || "Syntax check failed."}`]);
        failAll();
      }
    } catch {
      appendConsole([
        ">> Could not reach the API (network or CORS). JavaScript parse runs in the browser; Python run and C++ check need the backend.",
        ">> Start the API server or check NEXT_PUBLIC_API_URL.",
      ]);
      setCaseStatus(idleCases);
    } finally {
      setRunBusy(false);
    }
  }, [appendConsole, code, lang, runBusy, testCasesState]);

  async function submitCode() {
    if (submitBusy || runBusy) return;
    setSubmitBusy(true);
    setIdeBottomTab("result");
    appendConsole([">> Submit: enqueueing judge…"]);

    try {
      // Keep the old local submit behavior for JavaScript (no backend judge yet).
      if (lang === "javascript") {
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
        appendConsole([">> Submit: saved to this browser.", `>> Language: ${lang}`]);
        setServerSubmissionsRefreshKey((k) => k + 1);
        return;
      }

      const api = getPublicApiUrl();
      const headers = bearerAuthHeaders();

      if (!headers.Authorization) {
        appendConsole([">> Submit failed: login required."]);
        return;
      }

      const attemptKey = `practice:${userPrefix}:attempt:${problemId}`;
      let nextAttempt = 1;
      try {
        const raw = localStorage.getItem(attemptKey);
        const parsed = raw ? Number(raw) : 0;
        if (Number.isFinite(parsed) && parsed >= 1) nextAttempt = parsed + 1;
        localStorage.setItem(attemptKey, String(nextAttempt));
      } catch {
        // ignore
      }

      const payload = {
        language: lang === "cpp" ? "cpp" : "python",
        code,
        problem_id: problemId,
        timeout_sec: 2,
        memory_kb: 262144,
        attempt: nextAttempt,
        async_execution: true,
        testcases: testCasesState.map((tc, idx) => ({
          id: String(idx + 1),
          expected: tc.expected,
          fields: (tc.fields || []).map((f) => ({ name: f.name, value: f.value })),
        })),
      };

      const res = await fetch(`${api}/api/v1/practice-problems/run-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      });

      const job = (await res.json().catch(() => ({}))) as { job_id?: string; detail?: string; error?: string };
      if (!res.ok || !job.job_id) {
        appendConsole([`>> Submit error: ${job.error || job.detail || res.statusText}`]);
        return;
      }

      appendConsole([`>> Job ${job.job_id} created. Waiting for result…`]);

      const jobId = job.job_id;
      const pollStart = Date.now();
      const pollTimeoutMs = 45000;

      while (Date.now() - pollStart < pollTimeoutMs) {
        // eslint-disable-next-line no-await-in-loop
        const pr = await fetch(`${api}/api/v1/practice-problems/run-code/${encodeURIComponent(jobId)}`, {
          method: "GET",
          headers: { ...headers },
        });

        const pj = (await pr.json().catch(() => ({}))) as {
          state?: string;
          result?: {
            status?: string;
            execution_time?: string;
            memory_used?: string;
            hints?: string;
          };
          error?: string;
        };

        if (pr.ok && pj.state === "done" && pj.result?.status) {
          const result = pj.result;

          appendConsole([
            `>> Result: ${result.status}`,
            `>> Time: ${result.execution_time || "0 ms"} · Memory: ${result.memory_used || "0 KB"}`,
          ]);
          if (result.hints) appendConsole([`>> Hint: ${result.hints}`]);

          setLastRunMeta({
            status: result.status,
            execution_time: result.execution_time,
            memory_used: result.memory_used,
            hints: result.hints,
          });

          if (result.status === "Accepted") {
            const passed = Object.fromEntries(
              testCasesState.map((c) => [c.id, "pass"] as const)
            ) as Record<string, "idle" | "pass" | "fail">;
            setCaseStatus(passed);
            setSolved(true);
            localStorage.setItem(solvedKey, "1");
          } else {
            const failed = Object.fromEntries(
              testCasesState.map((c) => [c.id, "fail"] as const)
            ) as Record<string, "idle" | "pass" | "fail">;
            setCaseStatus(failed);
            setSolved(false);
          }

          setServerSubmissionsRefreshKey((k) => k + 1);
          return;
        }

        if (!pr.ok) {
          appendConsole([`>> Poll error: ${pj.error || pr.statusText}`]);
          return;
        }

        if (pj.state === "error") {
          appendConsole([`>> Job failed: ${pj.error || "Unknown error"}`]);
          return;
        }

        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1200));
      }

      appendConsole([">> Submit timeout."]);
    } finally {
      setSubmitBusy(false);
    }
  }

  const diff = problem ? difficultyStyle(problem.difficulty) : difficultyStyle("Easy");

  return (
    <div
      className={[
        "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-background-dark",
        isFullScreen ? "fixed inset-0 z-50 rounded-none border-0 p-2 md:p-4" : "rounded-lg border border-zinc-800 p-4",
      ].join(" ")}
    >
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
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullScreen((v) => !v)}
            className="inline-flex items-center gap-2 h-8 px-3 rounded-lg text-sm font-bold border border-zinc-700 bg-zinc-800/30 text-zinc-100 hover:bg-zinc-700 hover:border-zinc-600 transition-colors shrink-0"
            aria-pressed={isFullScreen}
          >
            <span className="material-symbols-outlined text-base">
              {isFullScreen ? "fullscreen_exit" : "fullscreen"}
            </span>
            {isFullScreen ? "Exit" : "Full"}
          </button>
        </div>
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
        <>
        <div
          ref={mainRowRef}
          className="flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-row"
        >
          {/* Left: question / problem workspace (width adjustable on desktop) */}
          <section
            className="flex min-h-0 flex-col overflow-hidden border-b border-zinc-800 bg-[#0c0c0f] lg:min-h-0 lg:border-b-0 lg:border-r"
            style={
              isWideLayout
                ? {
                    flexGrow: 0,
                    flexShrink: 0,
                    flexBasis: `${leftWidthPct}%`,
                    minWidth: 260,
                    maxWidth: "58%",
                    minHeight: 0,
                  }
                : {
                    width: "100%",
                    minHeight: "min(36dvh, 320px)",
                    maxHeight: "46dvh",
                    flexShrink: 0,
                  }
            }
          >
            <div className="flex shrink-0 border-b border-zinc-800 px-3 pt-1.5 gap-2 overflow-x-auto">
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

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-5 md:p-6 [scrollbar-gutter:stable]">
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
                  <h2 className="text-sm font-bold text-zinc-100">Recent submissions</h2>
                  {serverSubmissionsLoading ? (
                    <p className="text-sm text-zinc-500">Loading submissions…</p>
                  ) : serverSubmissions.length > 0 ? (
                    <ul className="space-y-2">
                      {serverSubmissions.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300"
                        >
                          <span className="text-zinc-500">
                            {s.created_at ? new Date(s.created_at).toLocaleString() : ""}
                          </span>
                          <span className="mx-2">·</span>
                          {s.language}
                          <span className="mx-2">·</span>
                          Attempt {s.attempt}
                          <span className="mx-2">·</span>
                          {s.status}
                        </li>
                      ))}
                    </ul>
                  ) : submissions.length === 0 ? (
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

          {isWideLayout && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Drag to resize question and editor panels"
              onPointerDown={beginHResize}
              className="group hidden w-2 shrink-0 cursor-col-resize flex-col items-center justify-center border-x border-zinc-800 bg-[#121214] hover:bg-orange-500/5 lg:flex"
            >
              <div className="pointer-events-none my-auto h-12 w-1 rounded-full bg-zinc-600 transition-colors group-hover:bg-orange-500/80 group-active:bg-orange-400" />
            </div>
          )}

          {/* Right: editor + testcase / results (vertical split adjustable) */}
          <section className="flex min-h-0 min-w-0 flex-1 flex-row bg-zinc-950">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 border-b border-zinc-800 bg-black">
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
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAiOpen((o) => !o)}
                  aria-expanded={aiOpen}
                  aria-controls="practice-ide-ai-panel"
                  className={[
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-bold transition-colors",
                    aiOpen
                      ? "border-orange-500/50 bg-orange-500/10 text-orange-200"
                      : "border-zinc-600 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-500",
                  ].join(" ")}
                >
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                  AI
                </button>
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-600 text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:border-zinc-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  Reset
                </button>
                <button
                  type="button"
                  onClick={runCode}
                  disabled={runBusy}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-zinc-600 text-xs font-bold text-zinc-100 transition-colors hover:bg-zinc-700 hover:border-zinc-500 disabled:pointer-events-none disabled:opacity-45"
                >
                  <span className={`material-symbols-outlined text-base ${runBusy ? "animate-pulse" : ""}`}>
                    play_arrow
                  </span>
                  {runBusy ? "Checking…" : "Run"}
                </button>
                <button
                  type="button"
                  onClick={submitCode}
                  disabled={runBusy || submitBusy}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-bold text-white shadow-[0_4px_16px_-2px_rgba(255,122,26,0.5)] hover:brightness-110 transition-all disabled:pointer-events-none disabled:opacity-45"
                  style={{ backgroundColor: primary }}
                >
                  <span className="material-symbols-outlined text-base">cloud_upload</span>
                  {submitBusy ? "Submitting…" : "Submit"}
                </button>
              </div>
              </div>

              <div ref={rightColRef} className="flex min-h-0 flex-1 flex-col">
              {(() => {
                const editorGrow = Math.max(22, Math.min(78, Math.round(editorFrac * 100)));
                const bottomGrow = 100 - editorGrow;
                return (
                  <>
                    <div
                      className="flex min-h-0 flex-col border-b border-zinc-800 bg-[#1e1e1e]"
                      style={{
                        flexGrow: editorGrow,
                        flexShrink: 1,
                        flexBasis: 0,
                        minHeight: 160,
                      }}
                    >
                      <PracticeMonacoEditor
                        value={code}
                        language={lang}
                        onChange={onChangeCode}
                        className="min-h-0 flex-1"
                      />
                    </div>

                    <div
                      role="separator"
                      aria-orientation="horizontal"
                      aria-label="Drag to resize editor and testcase panel"
                      onPointerDown={beginVResize}
                      className="group flex h-2 shrink-0 cursor-row-resize items-center justify-center border-y border-zinc-800 bg-[#121214] hover:bg-orange-500/5"
                    >
                      <div className="pointer-events-none h-1 w-12 rounded-full bg-zinc-600 transition-colors group-hover:bg-orange-500/80 group-active:bg-orange-400" />
                    </div>

                    <div
                      className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-t-lg border border-zinc-800 bg-[#161618]"
                      style={{
                        flexGrow: bottomGrow,
                        flexShrink: 1,
                        flexBasis: 0,
                        minHeight: 120,
                      }}
                    >
                      <div className="flex shrink-0 items-stretch gap-0 border-b border-zinc-800 px-1 pt-1.5 text-[13px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setIdeBottomTab("testcase")}
                          className={[
                            "inline-flex items-center gap-1.5 rounded-t-md px-3 py-2 transition-colors",
                            ideBottomTab === "testcase"
                              ? "bg-zinc-800/90 text-zinc-100"
                              : "text-zinc-500 hover:text-zinc-300",
                          ].join(" ")}
                        >
                          <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
                          Testcase
                        </button>
                        <span className="self-center text-zinc-600 select-none" aria-hidden>
                          |
                        </span>
                        <button
                          type="button"
                          onClick={() => setIdeBottomTab("result")}
                          className={[
                            "inline-flex items-center gap-1.5 rounded-t-md px-3 py-2 transition-colors",
                            ideBottomTab === "result"
                              ? "bg-zinc-800/90 text-zinc-100"
                              : "text-zinc-500 hover:text-zinc-300",
                          ].join(" ")}
                        >
                          <span className="material-symbols-outlined text-base text-zinc-400">terminal</span>
                          Test Result
                        </button>
                      </div>

                      {ideBottomTab === "testcase" && (
                        <>
                          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-zinc-800 px-2 py-2">
                            {testCasesState.map((c, idx) => {
                              const st = caseStatus[c.id];
                              return (
                                <div key={c.id} className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setActiveCaseIdx(idx)}
                                    className={[
                                      "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                                      activeCaseIdx === idx
                                        ? "bg-zinc-700 text-zinc-50"
                                        : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200",
                                    ].join(" ")}
                                  >
                                    {c.label}
                                    {st === "pass" && (
                                      <span className="material-symbols-outlined text-sm text-emerald-400">check</span>
                                    )}
                                    {st === "fail" && (
                                      <span className="material-symbols-outlined text-sm text-red-400">close</span>
                                    )}
                                  </button>
                                  {testCasesState.length > 1 && (
                                    <button
                                      type="button"
                                      aria-label={`Remove ${c.label}`}
                                      onClick={() => removeTestCase(idx)}
                                      className="rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                                    >
                                      <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              onClick={addTestCase}
                              className="ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-600 text-zinc-400 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-orange-300"
                              aria-label="Add test case"
                            >
                              <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                          </div>

                          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                            {activeCase ? (
                              showTestcaseSource ? (
                                <textarea
                                  value={JSON.stringify(activeCase, null, 2)}
                                  readOnly
                                  className="h-full min-h-[160px] w-full resize-y rounded-lg border border-zinc-700 bg-black/50 p-3 font-mono text-[12px] text-zinc-300"
                                />
                              ) : (
                                <div className="space-y-4">
                                  {activeCase.fields.map((field, fi) => (
                                    <div key={`${activeCase.id}-${field.name}-${fi}`}>
                                      <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-zinc-500">
                                        {field.name} =
                                      </label>
                                      <input
                                        type="text"
                                        value={field.value}
                                        onChange={(e) => setCaseField(activeCase.id, fi, e.target.value)}
                                        spellCheck={false}
                                        className="w-full rounded-lg border border-zinc-700 bg-[#1e1e22] px-3 py-2.5 font-mono text-[13px] text-zinc-100 outline-none ring-orange-500/0 transition-shadow focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/20"
                                      />
                                    </div>
                                  ))}
                                  <div>
                                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                                      Expected
                                    </label>
                                    <textarea
                                      value={activeCase.expected}
                                      onChange={(e) => setCaseExpected(activeCase.id, e.target.value)}
                                      spellCheck={false}
                                      rows={3}
                                      className="w-full resize-y rounded-lg border border-zinc-700 bg-[#1e1e22] px-3 py-2.5 font-mono text-[13px] text-zinc-100 outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/20"
                                    />
                                  </div>
                                </div>
                              )
                            ) : (
                              <p className="text-sm text-zinc-500">No test cases.</p>
                            )}
                          </div>
                        </>
                      )}

                      {ideBottomTab === "result" && (
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 font-mono text-[11px] leading-relaxed text-zinc-400">
                          {lastRunMeta && (
                            <div className="mb-3 flex flex-col gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {lastRunMeta.status && (
                                  <span
                                    className="inline-flex items-center rounded-full border border-zinc-700 bg-black/30 px-2.5 py-1 text-[11px] font-bold text-zinc-200"
                                  >
                                    <span className="material-symbols-outlined text-base" style={{ marginRight: 4 }}>
                                      verified
                                    </span>
                                    {lastRunMeta.status}
                                  </span>
                                )}
                                {lastRunMeta.execution_time && (
                                  <span className="rounded-full border border-zinc-700 bg-black/30 px-2.5 py-1 text-[11px] font-bold">
                                    Time: <span className="text-zinc-200">{lastRunMeta.execution_time}</span>
                                  </span>
                                )}
                                {lastRunMeta.memory_used && (
                                  <span className="rounded-full border border-zinc-700 bg-black/30 px-2.5 py-1 text-[11px] font-bold">
                                    Memory: <span className="text-zinc-200">{lastRunMeta.memory_used}</span>
                                  </span>
                                )}
                              </div>

                              {lastRunMeta.hints && (
                                <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-3 text-[11px] text-zinc-300">
                                  <div className="mb-1 flex items-center gap-2 text-orange-400 font-bold">
                                    <span className="material-symbols-outlined text-base">lightbulb</span>
                                    Hint
                                  </div>
                                  <div className="whitespace-pre-wrap">{lastRunMeta.hints}</div>
                                </div>
                              )}
                            </div>
                          )}

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
                      )}

                      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-800 bg-[#121214] px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setShowTestcaseSource((v) => !v)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-orange-400"
                        >
                          <span className="material-symbols-outlined text-base">code</span>
                          {showTestcaseSource ? "Form view" : "Source"}
                        </button>
                        <button
                          type="button"
                          title="Test cases are saved in this browser per problem. Connect a judge to run against your inputs."
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                          aria-label="Help"
                        >
                          <span className="material-symbols-outlined text-base">help</span>
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
              </div>
            </div>
            {isWideLayout && aiOpen && (
              <div id="practice-ide-ai-panel" className="hidden min-h-0 shrink-0 lg:flex">
                <PracticeIdeAiPanel
                  variant="sidebar"
                  problem={problem}
                  language={lang}
                  code={code}
                  onClose={() => setAiOpen(false)}
                />
              </div>
            )}
          </section>
        </div>
        {!isWideLayout && aiOpen && (
          <PracticeIdeAiPanel
            variant="sheet"
            problem={problem}
            language={lang}
            code={code}
            onClose={() => setAiOpen(false)}
          />
        )}
        </>
      )}
    </div>
  );
}
