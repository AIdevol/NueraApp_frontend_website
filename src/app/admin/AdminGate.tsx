"use client";

import { getAdminToken } from "@/lib/adminApi";
import { primary } from "@/lib/theme";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getAdminToken();
    if (!t) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-transparent" style={{ borderTopColor: primary }} />
          <p className="text-sm text-zinc-500">Checking admin session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
