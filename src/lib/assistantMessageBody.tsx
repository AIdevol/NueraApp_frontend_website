import React from "react";

import { formatAssistantMessage } from "./chatText";

/**
 * Whole-word matches for code-like tokens. Excludes common English (if, for, in, …)
 * to avoid noisy highlights in prose. Substrings like "import" inside "important" are skipped via \b.
 */
const CODE_KEYWORD_RE =
  /\b(?:import|from|export|default|const|let|var|function|return|async|await|def|class|extends|implements|interface|type|enum|namespace|module|package|require|include|using|public|private|protected|static|readonly|new|this|super|try|catch|finally|throw|switch|case|break|continue|pass|yield|lambda|null|undefined|true|false|void|print|except|raise|use|struct|impl|trait|mut|pub|fn|where|match|defer|chan|select|sizeof|typeof|instanceof|delete|debugger|declare|abstract|volatile|synchronized|native|throws|boolean|byte|char|short|long|float|double|int|string|object|array|map|set|list|tuple|dict|str|bool|self|cls|None|True|False|nil|NaN)\b/gi;

function highlightCodeKeywords(plain: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  const re = new RegExp(CODE_KEYWORD_RE.source, CODE_KEYWORD_RE.flags);
  while ((m = re.exec(plain)) !== null) {
    if (m.index > last) {
      parts.push(plain.slice(last, m.index));
    }
    parts.push(
      <span
        key={`kw-${key++}`}
        className="rounded px-0.5 font-mono text-[0.95em] font-semibold text-orange-300"
      >
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < plain.length) {
    parts.push(plain.slice(last));
  }
  return parts.length > 0 ? parts : plain;
}

/** Assistant text: strip HTML/markdown, then highlight code-like keywords. */
export function AssistantMessageBody({ text }: { text: string }) {
  const plain = formatAssistantMessage(text);
  return (
    <span className="whitespace-pre-wrap wrap-break-word text-[15px] leading-[1.65] text-zinc-100">
      {highlightCodeKeywords(plain)}
    </span>
  );
}
