import { Suspense } from "react";

import LoginPage from "@/auth/login/page";

function LoginFallback() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
      Loading…
    </div>
  );
}

export default function LoginRoute() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPage />
    </Suspense>
  );
}
