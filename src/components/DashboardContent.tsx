"use client";

import { usePathname } from "next/navigation";

const FULL_BLEED_PATTERNS = ["/solve", "/playground", "/ai-chat", "/roadmaps"];

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNoteEditor = /^\/dashboard\/notes\/\d+/.test(pathname);
  const isFullBleed =
    isNoteEditor || FULL_BLEED_PATTERNS.some((p) => pathname.includes(p));

  if (isFullBleed) {
    return (
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden p-2">
        {children}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 pb-4">
        {children}
      </div>
    </div>
  );
}
