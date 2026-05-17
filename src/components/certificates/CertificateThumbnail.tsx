"use client";

import { primary } from "@/lib/theme";

interface CertificateThumbnailProps {
  recipientName: string;
  courseTitle: string;
  issuedLabel?: string;
  compact?: boolean;
}

export function CertificateThumbnail({
  recipientName,
  courseTitle,
  issuedLabel,
  compact = false,
}: CertificateThumbnailProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border border-orange-500/25 bg-[#0a0a0c] shadow-[inset_0_0_0_1px_rgba(255,122,26,0.08)] ${
        compact ? "w-[88px] h-[62px]" : "w-[120px] h-[84px]"
      }`}
      aria-hidden
    >
      <div className="absolute inset-1 rounded border border-orange-500/15 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,122,26,0.12),transparent_70%)]" />
      <div className="relative flex h-full flex-col items-center justify-center px-1.5 py-1 text-center">
        <p
          className={`font-bold uppercase tracking-[0.12em] text-orange-400/90 ${
            compact ? "text-[5px]" : "text-[6px]"
          }`}
        >
          Certificate
        </p>
        <p className={`mt-0.5 font-semibold text-zinc-100 leading-tight ${compact ? "text-[6px]" : "text-[7px]"}`}>
          of Completion
        </p>
        <p
          className={`mt-1 font-medium text-zinc-300 truncate max-w-full ${
            compact ? "text-[5px]" : "text-[6px]"
          }`}
        >
          {recipientName}
        </p>
        <p className={`text-orange-300/80 truncate max-w-full ${compact ? "text-[4px]" : "text-[5px]"}`}>
          {courseTitle}
        </p>
        {issuedLabel && (
          <p className={`mt-0.5 text-zinc-500 ${compact ? "text-[4px]" : "text-[5px]"}`}>{issuedLabel}</p>
        )}
      </div>
      <div
        className="absolute bottom-1 right-1 h-3 w-3 rounded-full border border-orange-500/40"
        style={{ background: `linear-gradient(135deg, ${primary}55, transparent)` }}
      />
    </div>
  );
}
