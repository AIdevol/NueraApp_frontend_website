"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AiChatPage() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I am Neura AI Assistant. Ask me any learning question, coding doubt, or interview prep query.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Could not get AI response.");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I could not answer right now. Please try again." },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "I am here to help. Ask another question." },
      ]);
    } catch {
      setError("Connection error.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network issue. Please check your connection and retry." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="flex flex-col gap-5 h-[calc(100dvh-7.5rem)]">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-1">Advanced AI Chat</h2>
        <p className="text-zinc-400 text-sm md:text-base">
          Resolve doubts instantly with Neura AI. Ask concept, coding, roadmap, or interview questions.
        </p>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-orange-500/15 bg-background-dark overflow-hidden flex flex-col">
        <div className="shrink-0 px-4 py-3 border-b border-orange-500/15 bg-[#0c0c0f] flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <span className="material-symbols-outlined" style={{ color: primary }}>
              smart_toy
            </span>
            Neura AI Assistant
          </div>
          <div className="text-xs text-zinc-500">Press Ctrl/Cmd + Enter to send</div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={`${idx}-${m.role}`}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto text-white"
                  : "text-zinc-200 border border-zinc-800 bg-[#0c0c0f]"
              }`}
              style={m.role === "user" ? { backgroundColor: primary } : undefined}
            >
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="shrink-0 border-t border-orange-500/15 bg-[#0c0c0f] p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="Ask anything... e.g. Explain backpropagation simply"
              className="flex-1 resize-none rounded-xl border border-zinc-700 bg-black/60 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm outline-none focus:border-orange-500/60"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={sending || !input.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: primary }}
            >
              <span className="material-symbols-outlined text-base">
                {sending ? "hourglass_top" : "send"}
              </span>
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

