"use client";

import { usePathname } from "next/navigation";

const FULL_BLEED_PATTERNS = ["/solve", "/playground", "/ai-chat", "/roadmaps"];

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNoteEditor = /^\/dashboard\/notes\/\d+/.test(pathname);
  const isFullBleed =
    isNoteEditor || FULL_BLEED_PATTERNS.some((p) => pathname.includes(p));

  return (
    <div
      className={`relative flex w-full min-h-0 flex-1 flex-col ${
        isFullBleed
          ? "overflow-hidden p-2"
          : "grow gap-6 overflow-y-auto px-4 py-5 md:px-6 md:py-6"
      }`}
    >
      {children}
    </div>
  );
}
