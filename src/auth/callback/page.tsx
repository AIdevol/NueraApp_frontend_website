"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    if (token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        window.location.href = "/dashboard";
        return;
      }
      router.replace("/dashboard");
    } else if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <p className="text-slate-600 dark:text-slate-400">Completing sign-in...</p>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">Completing sign-in...</p>
        </div>
      }
    >
      <LoginCallbackInner />
    </Suspense>
  );
}
