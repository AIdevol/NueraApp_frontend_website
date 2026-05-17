"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[160px] items-center justify-center text-xs text-zinc-500">
      Loading editor…
    </div>
  ),
});

export type PracticeEditorLanguage = "python" | "javascript" | "cpp";

function monacoLanguage(lang: PracticeEditorLanguage): string {
  if (lang === "python") return "python";
  if (lang === "javascript") return "javascript";
  return "cpp";
}

type Props = {
  value: string;
  language: PracticeEditorLanguage;
  onChange: (value: string) => void;
  className?: string;
};

export default function PracticeMonacoEditor({ value, language, onChange, className }: Props) {
  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      wordWrap: "on",
      tabSize: 4,
      insertSpaces: true,
      automaticLayout: true,
      padding: { top: 12, bottom: 12 },
      renderLineHighlight: "line",
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      bracketPairColorization: { enabled: true },
      folding: true,
      smoothScrolling: true,
      cursorBlinking: "smooth",
      formatOnPaste: false,
      formatOnType: false,
      detectIndentation: false,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "on",
    }),
    []
  );

  return (
    <div className={["flex h-full min-h-0 flex-1 flex-col", className].filter(Boolean).join(" ")}>
      <MonacoEditor
        height="100%"
        theme="vs-dark"
        language={monacoLanguage(language)}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={options}
      />
    </div>
  );
}
