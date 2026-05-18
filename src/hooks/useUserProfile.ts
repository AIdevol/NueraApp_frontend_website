"use client";

import { useEffect, useState, useCallback } from "react";

import { getNgrokHeaders, getPublicApiUrl } from "@/lib/publicUrl";

export interface UserProfileMe {
  full_name: string;
  email: string;
  learning_level?: string | null;
  avatar_url?: string | null;
  learning_profile?: {
    primary_focus?: string | null;
    experience_level?: string | null;
  } | null;
}

let cache: UserProfileMe | null = null;
let inflight: Promise<UserProfileMe | null> | null = null;

/** Call after logout so the next login fetches fresh data. */
export function clearUserProfileCache() {
  cache = null;
  inflight = null;
}

async function fetchProfileMe(): Promise<UserProfileMe | null> {
  if (cache) return cache;
  if (inflight) return inflight;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const base = getPublicApiUrl();
  if (!token || !base) {
    return null;
  }

  inflight = (async () => {
    try {
      const res = await fetch(`${base}/api/v1/profile/me`, {
        headers: {
          ...getNgrokHeaders(),
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!res.ok) {
        return null;
      }
      const data = (await res.json()) as UserProfileMe;
      cache = data;
      return data;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileMe | null>(cache);
  const [loading, setLoading] = useState(!cache);

  const refresh = useCallback(() => {
    clearUserProfileCache();
    setLoading(true);
    void fetchProfileMe().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchProfileMe().then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fullName = profile?.full_name?.trim() || null;
  /** First name for “Welcome back, Jane” */
  const firstName = fullName
    ? fullName.split(/\s+/)[0] || fullName
    : null;

  const subtitle =
    profile?.learning_profile?.primary_focus?.trim() ||
    profile?.learning_level?.trim() ||
    profile?.learning_profile?.experience_level?.trim() ||
    null;

  return {
    profile,
    fullName,
    firstName,
    subtitle,
    avatarUrl: profile?.avatar_url?.trim() || null,
    loading,
    refresh,
  };
}
