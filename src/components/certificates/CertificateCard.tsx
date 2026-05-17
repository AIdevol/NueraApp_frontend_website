"use client";

import { useState } from "react";

import { CertificateThumbnail } from "@/components/certificates/CertificateThumbnail";
import type { CertificateItem } from "@/lib/certificatesApi";
import { formatDate } from "@/lib/studentHubApi";
import { primary } from "@/lib/theme";

interface CertificateCardProps {
  cert: CertificateItem;
  displayName?: string;
}

export function CertificateCard({ cert, displayName }: CertificateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const recipient = displayName?.trim() || cert.recipient_name;
  const courseTitle = cert.course_title || cert.title;
  const issued = cert.issued_at || cert.earned_at;
  const isCompleted = cert.status === "completed";
  const downloadHref = cert.download_url || cert.credential_url;

  return (
    <article className="rounded-2xl border border-orange-500/15 bg-[#0c0c0f]/90 p-4 md:p-5 shadow-[0_1px_0_rgba(255,122,26,0.06)] hover:border-orange-500/25 transition-colors">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <CertificateThumbnail
          recipientName={recipient}
          courseTitle={courseTitle}
          issuedLabel={issued ? formatDate(issued) : undefined}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                isCompleted
                  ? "bg-orange-500/15 text-orange-300 border border-orange-500/25"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {isCompleted ? "Completed" : "In Progress"}
            </span>
            {!isCompleted && cert.progress_percent != null && (
              <span className="text-xs text-zinc-500">{cert.progress_percent}% complete</span>
            )}
          </div>

          <h2 className="text-lg font-bold text-zinc-50 tracking-tight">{cert.title}</h2>

          {issued && isCompleted && (
            <p className="mt-0.5 text-sm text-zinc-500">Issued on {formatDate(issued)}</p>
          )}

          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{cert.description}</p>

          {!isCompleted && cert.progress_percent != null && (
            <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${cert.progress_percent}%`, backgroundColor: primary }}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-start gap-2 sm:flex-col sm:items-end">
          {isCompleted && downloadHref && (
            <a
              href={downloadHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,122,26,0.2)] transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Download
            </a>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 rounded-lg text-zinc-500 hover:bg-orange-500/10 hover:text-orange-300 transition-colors"
              aria-label="More options"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-orange-500/20 bg-zinc-950 py-1 shadow-xl">
                  {cert.credential_url && (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-2 text-sm text-zinc-300 hover:bg-orange-500/10 hover:text-orange-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      View credential
                    </a>
                  )}
                  {cert.verification_code && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-orange-500/10 hover:text-orange-200"
                      onClick={() => {
                        void navigator.clipboard?.writeText(cert.verification_code!);
                        setMenuOpen(false);
                      }}
                    >
                      Copy verification code
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
