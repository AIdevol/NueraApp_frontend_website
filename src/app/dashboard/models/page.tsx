"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { useEffect, useRef, useState } from "react";

import { primary } from "@/lib/theme";

type HubType = "open" | "cloud" | "generative" | "community";

interface ModelHub {
  id: string;
  name: string;
  org: string;
  description: string;
  url: string;
  type: HubType;
  icon: string;
  logo_url?: string;
}

// Sites known to block iframes — open directly in new tab
const BLOCKED_EMBED_DOMAINS = [
  "huggingface.co",
  "console.cloud.google.com",
  "cloud.google.com",
  "aws.amazon.com",
  "console.aws.amazon.com",
  "azure.microsoft.com",
  "portal.azure.com",
  "replicate.com",
  "civitai.com",
  "openai.com",
  "anthropic.com",
  "together.ai",
  "groq.com",
  "fireworks.ai",
  "cohere.com",
  "mistral.ai",
  "github.com",
];

function isEmbedBlocked(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return BLOCKED_EMBED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

// ── Detail view ────────────────────────────────────────────────────────────────
function HubDetail({
  hub,
  onBack,
}: {
  hub: ModelHub;
  onBack: () => void;
}) {
  const [iframeBlocked, setIframeBlocked] = useState(isEmbedBlocked(hub.url));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect iframe block via load-timeout heuristic (CSP/X-Frame-Options
  // causes the iframe to stay blank — it never fires "load" properly, or
  // fires immediately with an empty document).
  useEffect(() => {
    if (iframeBlocked) return;

    const iframe = iframeRef.current;
    if (!(iframe instanceof HTMLIFrameElement)) return;

    const iframeEl: HTMLIFrameElement = iframe;

    // Give it 8 seconds; if the content is still about:blank the embed was refused.
    loadTimerRef.current = setTimeout(() => {
      try {
        const doc = iframeEl.contentDocument;
        if (!doc || doc.URL === "about:blank") {
          setIframeBlocked(true);
        }
      } catch {
        // Cross-origin but loaded — fine.
      }
    }, 8000);

    function handleLoad() {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      try {
        const doc = iframeEl.contentDocument;
        if (doc && doc.URL === "about:blank") {
          setIframeBlocked(true);
        }
      } catch {
        // Loaded cross-origin — fine.
      }
    }

    iframeEl.addEventListener("load", handleLoad);
    return () => {
      iframeEl.removeEventListener("load", handleLoad);
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [hub.url, iframeBlocked]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full -m-4 md:-m-6">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 bg-[#0c0c0f]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-bold text-zinc-100 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span
            className="material-symbols-outlined text-lg shrink-0"
            style={{ color: primary }}
          >
            {hub.icon}
          </span>
          <span className="text-sm font-semibold text-zinc-100 truncate">
            {hub.name}
          </span>
          <span className="text-xs text-zinc-500 shrink-0">{hub.org}</span>
        </div>

        <a
          href={hub.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-bold border border-orange-500/25 hover:bg-orange-500/10 transition-colors shrink-0"
          style={{ color: primary }}
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          Open in new tab
        </a>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 relative">
        {iframeBlocked ? (
          /* ── Fallback card ─────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-zinc-800/60 border border-zinc-700">
              {hub.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hub.logo_url}
                  alt={hub.org}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <span
                  className="material-symbols-outlined text-4xl"
                  style={{ color: primary }}
                >
                  {hub.icon}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 max-w-md">
              <h3 className="text-xl font-bold text-zinc-100">{hub.name}</h3>
              <p className="text-sm text-zinc-400">{hub.description}</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-700 rounded-lg px-4 py-2">
                <span className="material-symbols-outlined text-sm text-amber-400">
                  info
                </span>
                This site does not allow embedding — open it directly below.
              </div>

              <a
                href={hub.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-bold text-zinc-900 transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                <span className="material-symbols-outlined text-base">
                  open_in_new
                </span>
                Visit {hub.name}
              </a>
            </div>
          </div>
        ) : (
          /* ── Iframe ────────────────────────────────────────────── */
          <iframe
            ref={iframeRef}
            src={hub.url}
            title={hub.name}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ModelsPage() {
  const [hubs, setHubs] = useState<ModelHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ModelHub | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${getPublicApiUrl()}/api/v1/model-hubs`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.detail || "Failed to load model hubs");
          return;
        }
        const data = await res.json();
        setHubs(data.hubs ?? []);
      } catch {
        setError("Connection error.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (selected) {
    return <HubDetail hub={selected} onBack={() => setSelected(null)} />;
  }

  const q = search.trim().toLowerCase();
  const filter = (list: ModelHub[]) =>
    q
      ? list.filter(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            h.org.toLowerCase().includes(q) ||
            h.description.toLowerCase().includes(q)
        )
      : list;

  const open      = filter(hubs.filter((h) => h.type === "open"));
  const cloud     = filter(hubs.filter((h) => h.type === "cloud"));
  const gen       = filter(hubs.filter((h) => h.type === "generative"));
  const community = filter(hubs.filter((h) => h.type === "community"));

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-1">
            Model Hub
          </h2>
          <p className="text-zinc-400 text-sm md:text-base">
            Major AI model hubs and registries. Click any card to explore inside.
          </p>
        </div>

        {/* Search — now functional */}
        <input
          type="text"
          placeholder="Search hubs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-700 text-sm text-zinc-300 placeholder-zinc-500 w-48 sm:w-64 focus:outline-none focus:border-orange-500/50"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-zinc-800 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-zinc-500">Loading model hubs…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
        </div>
      ) : (
        <section className="flex flex-col gap-6">
          <HubSection title="Open-source hubs"         hubs={open}      onSelect={setSelected} />
          <HubSection title="Cloud provider hubs"      hubs={cloud}     onSelect={setSelected} />
          <HubSection title="Generative AI hubs"       hubs={gen}       onSelect={setSelected} />
          <HubSection title="Community & research hubs" hubs={community} onSelect={setSelected} />

          {!open.length && !cloud.length && !gen.length && !community.length && (
            <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-zinc-500">
              <span className="material-symbols-outlined text-4xl">search_off</span>
              <p>No hubs match &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

// ── Hub card grid ──────────────────────────────────────────────────────────────
function HubSection({
  title,
  hubs,
  onSelect,
}: {
  title: string;
  hubs: ModelHub[];
  onSelect: (h: ModelHub) => void;
}) {
  if (!hubs.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xl font-bold text-zinc-50">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hubs.map((h) => {
          const blocked = isEmbedBlocked(h.url);
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelect(h)}
              className="group glassmorphism rounded-xl border border-zinc-800 p-5 hover:border-orange-500/50 transition-colors text-left relative"
            >
              {/* Badge if embed is known-blocked */}
              {blocked && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                  <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                  Opens new tab
                </span>
              )}

              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/20 mb-3 overflow-hidden">
                {h.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.logo_url}
                    alt={h.org}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ color: primary }}
                  >
                    {h.icon}
                  </span>
                )}
              </div>

              <div
                className="text-xs font-bold tracking-wide uppercase mb-1"
                style={{ color: primary }}
              >
                {h.org}
              </div>
              <h4 className="font-bold text-zinc-100 mb-1">{h.name}</h4>
              <p className="text-sm text-zinc-400 line-clamp-3">{h.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}