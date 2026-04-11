"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Records client-side navigations for /api/v1/analytics/track (optional Bearer if logged in).
 */
export function RouteAnalytics() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (last.current === pathname) return;
    last.current = pathname;
    const base = getPublicApiUrl();
    if (!base) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    void fetch(`${base}/api/v1/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
