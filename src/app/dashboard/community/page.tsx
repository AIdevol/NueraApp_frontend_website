"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { useEffect, useState } from "react";

import { primary } from "@/lib/theme";

interface CommunityChannel {
  id: string;
  name: string;
  description: string;
  platform: string;
  url: string;
  members?: number | null;
  is_recommended: boolean;
}

function getPlatformIcon(platform: string): string {
  const p = platform.toLowerCase();
  if (p === "discord") return "forum";
  if (p === "slack") return "chat";
  if (p === "forum") return "forum";
  if (p === "meetup") return "groups";
  return "groups";
}

export default function CommunityPage() {
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${getPublicApiUrl()}/api/v1/community`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.detail || "Failed to load community channels");
          return;
        }
        const data = await res.json();
        setChannels(data.channels ?? []);
      } catch {
        setError("Connection error.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const recommended = channels.filter((c) => c.is_recommended);
  const others = channels.filter((c) => !c.is_recommended);

  return (
    <div className="min-h-full flex flex-col -m-6 md:-m-8">
      {/* Screen header – no navbar, only page content */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Community
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl">
          Connect with other learners in forums, chat, and meetups.
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] gap-4 px-6 md:px-8">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading community spaces…</p>
        </div>
      ) : error ? (
        <div className="mx-6 md:mx-8 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 space-y-8">
          {recommended.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-base" style={{ color: primary }}>
                  star
                </span>
                Recommended
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className="flex items-center justify-center w-10 h-10 rounded-xl text-white"
                        style={{ backgroundColor: primary }}
                      >
                        <span className="material-symbols-outlined text-xl">{getPlatformIcon(c.platform)}</span>
                      </span>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {c.platform}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-3">
                      {c.description}
                    </p>
                    {typeof c.members === "number" && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {c.members.toLocaleString()} members
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-medium mt-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Join
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-base" style={{ color: primary }}>
                  public
                </span>
                More spaces
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-xl">{getPlatformIcon(c.platform)}</span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {c.platform}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-3">
                      {c.description}
                    </p>
                    {typeof c.members === "number" && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {c.members.toLocaleString()} members
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-medium mt-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Join
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {channels.length === 0 && !loading && (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">groups</span>
              <p className="mt-2 text-slate-500 dark:text-slate-400">No community spaces yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
 