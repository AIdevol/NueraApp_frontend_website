"use client";

import { useEffect, useState } from "react";

import { fetchHubJson, formatDate } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  level: string;
  credential_url?: string | null;
  earned_at?: string | null;
  expires_at?: string | null;
  description: string;
}

export default function CertificatesPage() {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const { data, error: err } = await fetchHubJson<{ certifications: CertificationItem[] }>(
        "/certifications"
      );
      if (err) setError(err);
      else setItems(data?.certifications ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Certificates</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
          Earned and recommended credentials —{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">GET /api/v1/certifications</code>
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-500 dark:text-slate-400">Loading certifications…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 p-5 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-3xl shrink-0" style={{ color: primary }}>
                  workspace_premium
                </span>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">{c.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{c.issuer}</p>
                  <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {c.level}
                  </span>
                </div>
              </div>
              {c.description && <p className="text-sm text-slate-600 dark:text-slate-300">{c.description}</p>}
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-4">
                {c.earned_at && <span>Earned {formatDate(c.earned_at)}</span>}
                {c.expires_at && <span>Expires {formatDate(c.expires_at)}</span>}
              </div>
              {c.credential_url && (
                <a
                  href={c.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline"
                  style={{ color: primary }}
                >
                  View credential →
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
