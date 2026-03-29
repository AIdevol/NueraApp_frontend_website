"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LOGIN_PATH = "/login";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace(LOGIN_PATH);
      setAllowed(false);
    } else {
      setAllowed(true);
    }
  }, [router, pathname]);

  if (allowed === null || allowed === false) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-primary" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Checking session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
