"use client";

import { useCallback, useEffect, useState } from "react";

import { CertificateCard } from "@/components/certificates/CertificateCard";
import {
  fetchCertificates,
  verifyCertificate,
  type CertificateFilter,
  type CertificateItem,
  type CertificateSort,
} from "@/lib/certificatesApi";
import { useUserProfile } from "@/hooks/useUserProfile";
import { primary } from "@/lib/theme";

const TABS: { key: CertificateFilter; label: string }[] = [
  { key: "all", label: "All Certificates" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In Progress" },
];

const SORT_OPTIONS: { value: CertificateSort; label: string }[] = [
  { value: "newest_first", label: "Newest First" },
  { value: "oldest_first", label: "Oldest First" },
  { value: "title_asc", label: "Title A–Z" },
];

export default function CertificatesPage() {
  const { fullName } = useUserProfile();
  const [tab, setTab] = useState<CertificateFilter>("all");
  const [sort, setSort] = useState<CertificateSort>("newest_first");
  const [items, setItems] = useState<CertificateItem[]>([]);
  const [counts, setCounts] = useState({ completed: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await fetchCertificates({ status: tab, sort });
    if (err) {
      setError(err);
      setItems([]);
    } else {
      setItems(data?.certifications ?? []);
      setCounts({
        completed: data?.completed_count ?? 0,
        inProgress: data?.in_progress_count ?? 0,
      });
    }
    setLoading(false);
  }, [tab, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyLoading(true);
    setVerifyResult(null);
    const { data, error: err } = await verifyCertificate(verifyCode);
    setVerifyLoading(false);
    if (err) {
      setVerifyResult(err);
      return;
    }
    if (data?.valid) {
      setVerifyResult(
        `✓ Authentic certificate for ${data.recipient_name} — ${data.course_title || data.title} (${data.issuer}).`
      );
    } else {
      setVerifyResult(data?.message || "Certificate not found.");
    }
  }

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-50">Certificates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your earned credentials and courses in progress
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-orange-500/15 pb-0 mb-6">
        <nav className="flex gap-6 -mb-px overflow-x-auto" aria-label="Certificate filters">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
              {t.key === "completed" && counts.completed > 0 && (
                <span className="ml-1.5 text-xs text-zinc-600">({counts.completed})</span>
              )}
              {t.key === "in_progress" && counts.inProgress > 0 && (
                <span className="ml-1.5 text-xs text-zinc-600">({counts.inProgress})</span>
              )}
            </button>
          ))}
        </nav>

        <label className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
          <span className="material-symbols-outlined text-base">sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CertificateSort)}
            className="rounded-lg border border-orange-500/20 bg-zinc-900/80 px-3 py-1.5 text-zinc-200 text-sm font-medium focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-zinc-800 animate-spin"
            style={{ borderTopColor: primary }}
          />
          <p className="text-zinc-500">Loading certificates…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-center text-red-400">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-orange-500/15 bg-[#0c0c0f] p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-orange-500/50">workspace_premium</span>
          <p className="mt-3 text-zinc-400">No certificates in this view yet.</p>
          <p className="mt-1 text-sm text-zinc-600">Complete a course to earn your first certificate.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          {items.map((cert) => (
            <li key={cert.id}>
              <CertificateCard cert={cert} displayName={fullName ?? undefined} />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400"
              aria-hidden
            >
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-50">Verify Your Certificate</h2>
              <p className="mt-1 text-sm text-zinc-400 max-w-lg">
                Employers and institutions can verify the authenticity of your certificate using your
                verification code.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setVerifyOpen((v) => !v);
              setVerifyResult(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-zinc-950/80 px-5 py-2.5 text-sm font-semibold text-orange-300 hover:bg-orange-500/10 transition-colors shrink-0"
          >
            Verify Certificate
            <span className="material-symbols-outlined text-lg">open_in_new</span>
          </button>
        </div>

        {verifyOpen && (
          <form onSubmit={handleVerify} className="mt-5 pt-5 border-t border-orange-500/15 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="Enter verification code (e.g. NEURA-PYDS-2024-A7K9)"
              className="flex-1 rounded-xl border border-orange-500/20 bg-black/40 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
            <button
              type="submit"
              disabled={verifyLoading}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              {verifyLoading ? "Checking…" : "Check"}
            </button>
          </form>
        )}
        {verifyResult && (
          <p
            className={`mt-3 text-sm ${verifyResult.startsWith("✓") ? "text-orange-300" : "text-zinc-400"}`}
            role="status"
          >
            {verifyResult}
          </p>
        )}
      </section>
    </div>
  );
}
