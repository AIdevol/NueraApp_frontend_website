"use client";

import { primary } from "@/lib/theme";
import { useUserProfile } from "@/hooks/useUserProfile";

export function DashboardWelcome() {
  const { firstName, fullName, loading } = useUserProfile();
  const display =
    firstName || fullName || (loading ? "…" : "there");

  return (
    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-1">
      Welcome back,{" "}
      <span style={{ color: primary }}>{display}</span>
    </h2>
  );
}
