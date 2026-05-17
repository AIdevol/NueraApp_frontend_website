"use client";

import { AssistantMessageBody } from "@/lib/assistantMessageBody";
import {
  providerLabel,
  sendAiChatMessage,
  type LearnLinkItem,
} from "@/lib/aiChatClient";
import { primary } from "@/lib/theme";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  learnLinks?: LearnLinkItem[];
  provider?: string;
};

export default function AiChatPage() {
  const router = useRouter();
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    // Scroll only the messages pane — never scrollIntoView on an inner node (that scrolls
    // the whole page and makes the chat + composer jump upward).
    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
    };
    requestAnimationFrame(scrollToBottom);
    const t = window.setTimeout(scrollToBottom, 0);
    return () => window.clearTimeout(t);
  }, [messages, sending]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const { data, error: chatError } = await sendAiChatMessage(text, token, controller.signal);

    if (chatError?.status === 401) {
      localStorage.removeItem("token");
      router.replace("/login");
      setSending(false);
      return;
    }

    if (chatError) {
      if (chatError.message !== "Request cancelled.") {
        setError(chatError.message);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I could not answer right now. Please try again." },
        ]);
      }
      setSending(false);
      return;
    }

    if (data) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          sources: data.sources,
          learnLinks: data.learnLinks,
          provider: data.provider,
        },
      ]);
    }
    setSending(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    // Enter sends; Shift+Enter inserts a new line
    if (e.shiftKey) return;
    e.preventDefault();
    void sendMessage();
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-orange-500/20 bg-linear-to-b from-zinc-900/90 via-[#0a0a0d] to-zinc-950/95 backdrop-blur-sm">
        <div
          ref={messagesRef}
          className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 chat-scroll"
        >
          {messages.map((m, idx) => (
            <div
              key={`${idx}-${m.role}`}
              className={`flex gap-3 w-full min-w-0 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-sm border ${
                  m.role === "user"
                    ? "border-orange-400/40 bg-orange-500/20 text-orange-100"
                    : "border-zinc-600/60 bg-zinc-800/80 text-zinc-300"
                }`}
                aria-hidden
              >
                {m.role === "user" ? (
                  <span className="material-symbols-outlined text-lg">person</span>
                ) : (
                  <span className="material-symbols-outlined text-lg" style={{ color: primary }}>
                    auto_awesome
                  </span>
                )}
              </div>

              <div
                className={`min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                  m.role === "user"
                    ? "max-w-[min(100%,28rem)] sm:max-w-[min(100%,32rem)] rounded-tr-md text-white shrink-0"
                    : "flex-1 w-full max-w-full rounded-tl-md border border-zinc-700/50 bg-zinc-900/70 text-zinc-100"
                }`}
                style={
                  m.role === "user"
                    ? {
                        background: `linear-gradient(145deg, ${primary} 0%, #ea580c 100%)`,
                        boxShadow: "0 12px 32px -12px rgba(255, 122, 26, 0.45)",
                      }
                    : { boxShadow: "0 8px 32px -16px rgba(0,0,0,0.5)" }
                }
              >
                <div className="w-full min-w-0">
                  {m.role === "assistant" ? (
                    <AssistantMessageBody text={m.content} />
                  ) : (
                    <span className="whitespace-pre-wrap wrap-break-word text-[15px] leading-[1.65]">{m.content}</span>
                  )}
                </div>
                {m.role === "assistant" && m.learnLinks && m.learnLinks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.learnLinks.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Opens in a new tab"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/35 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-100 hover:bg-orange-500/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden>
                          open_in_new
                        </span>
                        {l.label}
                        <span className="sr-only"> (opens in new tab)</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
                {m.role === "assistant" && (providerLabel(m.provider) || (m.sources && m.sources.length > 0)) ? (
                  <p className="mt-3 text-[11px] text-zinc-500 border-t border-zinc-700/50 pt-3 leading-snug">
                    {providerLabel(m.provider) ? (
                      <span className="text-orange-400/80">{providerLabel(m.provider)}</span>
                    ) : null}
                    {providerLabel(m.provider) && m.sources && m.sources.length > 0 ? " · " : null}
                    {m.sources && m.sources.length > 0 ? m.sources.join(" · ") : null}
                  </p>
                ) : null}
              </div>
            </div>
          ))}

          {sending ? (
            <div className="flex gap-3 flex-row w-full min-w-0">
              <div
                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-600/60 bg-zinc-800/80 text-zinc-300"
                aria-hidden
              >
                <span className="material-symbols-outlined text-lg" style={{ color: primary }}>
                  auto_awesome
                </span>
              </div>
              <div className="flex-1 min-w-0 rounded-2xl rounded-tl-md border border-zinc-700/50 bg-zinc-900/70 px-4 py-3 shadow-lg">
                <div className="chat-typing flex gap-1.5 py-1" aria-label="Typing">
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-dot" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-orange-500/15 p-3 sm:p-4 bg-[#060607]/90">
          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="Message"
              className="flex-1 resize-none rounded-2xl border border-zinc-700/80 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 px-4 py-3 text-sm outline-none min-h-12 focus:border-orange-500/45 focus:ring-2 focus:ring-orange-500/15 transition-shadow"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={sending || !input.trim()}
              className="inline-flex h-12 min-w-12 sm:min-w-0 sm:px-4 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(145deg, ${primary} 0%, #ea580c 100%)`,
                boxShadow: "0 12px 28px -8px rgba(255, 122, 26, 0.55)",
              }}
            >
              <span className="material-symbols-outlined text-xl">
                {sending ? "hourglass_top" : "send"}
              </span>
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-zinc-600 hidden sm:block">
            Press Enter to send · Shift+Enter for a new line
          </p>
          {error ? <p className="mt-2 text-xs text-red-400/95">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
