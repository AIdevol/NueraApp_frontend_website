"use client";

import { usePathname } from "next/navigation";

const FULL_BLEED_PATTERNS = ["/solve", "/playground"];

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = FULL_BLEED_PATTERNS.some((p) => pathname.includes(p));

  return (
    <div
      className={`relative flex flex-col w-full min-h-0 grow ${
        isFullBleed
          ? "p-2 overflow-hidden"
          : "px-4 py-5 md:px-6 md:py-6 gap-6 overflow-y-auto"
      }`}
    >
      {children}
    </div>
  );
}
