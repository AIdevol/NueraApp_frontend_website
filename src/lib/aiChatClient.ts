/**
 * AI chat client — talks to FastAPI `/api/v1/ai-chat`.
 * Backend uses Portkey (primary) with direct Groq fallback; never put API keys in the browser.
 */

import { getPublicApiUrl } from "@/lib/publicUrl";

export type LearnLinkItem = { label: string; href: string };

export type AiChatResult = {
  reply: string;
  provider?: "portkey" | "groq" | string;
  sources?: string[];
  learnLinks?: LearnLinkItem[];
};

export type AiChatError = {
  message: string;
  status?: number;
};

function parseLearnLinks(raw: unknown): LearnLinkItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const links = raw
    .map((x) => {
      const item = x as { label?: string; href?: string };
      return { label: String(item.label ?? ""), href: String(item.href ?? "") };
    })
    .filter((x) => x.label && x.href);
  return links.length > 0 ? links : undefined;
}

export async function sendAiChatMessage(
  message: string,
  token: string,
  signal?: AbortSignal
): Promise<{ data: AiChatResult | null; error: AiChatError | null }> {
  const base = getPublicApiUrl();
  if (!base) {
    return { data: null, error: { message: "API URL not configured (NEXT_PUBLIC_API_URL)." } };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { data: null, error: { message: "Message is empty." } };
  }

  try {
    const res = await fetch(`${base}/api/v1/ai-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: trimmed }),
      signal,
      cache: "no-store",
    });

    const json = (await res.json().catch(() => ({}))) as {
      detail?: string;
      reply?: string;
      provider?: string;
      sources?: string[];
      learn_links?: unknown;
    };

    if (!res.ok) {
      return {
        data: null,
        error: {
          message: typeof json.detail === "string" ? json.detail : "Could not get AI response.",
          status: res.status,
        },
      };
    }

    return {
      data: {
        reply: json.reply || "I am here to help. Ask another question.",
        provider: json.provider,
        sources: Array.isArray(json.sources) ? json.sources : undefined,
        learnLinks: parseLearnLinks(json.learn_links),
      },
      error: null,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { data: null, error: { message: "Request cancelled." } };
    }
    return { data: null, error: { message: "Connection error." } };
  }
}

export function providerLabel(provider?: string): string | null {
  if (provider === "portkey") return "via Portkey";
  if (provider === "groq") return "via Groq";
  return null;
}
