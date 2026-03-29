"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

import { useUserProfile, clearUserProfileCache } from "@/hooks/useUserProfile";
import { initialsFromFullName } from "@/lib/userDisplay";
import { primary } from "@/lib/theme";

export function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { fullName, subtitle, avatarUrl, loading } = useUserProfile();
  const displayName = fullName || (loading ? "…" : "Account");
  const subline = subtitle || "Learning";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    clearUserProfileCache();
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    router.replace("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 pl-4 border-l border-orange-500/20 rounded-r-lg py-1 -my-1 hover:bg-orange-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/45 focus:ring-offset-2 focus:ring-offset-zinc-950"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Open profile menu"
      >
        <div className="text-right hidden sm:block min-w-0 max-w-[200px]">
          <p className="text-sm font-bold text-zinc-100 truncate">
            {displayName}
          </p>
          <p className="text-xs text-zinc-500 truncate">{subline}</p>
        </div>
        <div
          className="w-10 h-10 rounded-full border-2 border-primary/30 shrink-0 flex items-center justify-center text-xs font-bold text-white bg-cover bg-center"
          style={
            avatarUrl
              ? {
                  backgroundImage: `url(${avatarUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { backgroundColor: primary }
          }
          aria-hidden
        >
          {!avatarUrl && (
            <span className="select-none">{initialsFromFullName(fullName)}</span>
          )}
        </div>
        <span
          className="material-symbols-outlined text-zinc-500 text-xl shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-orange-500/20 bg-zinc-950/95 backdrop-blur-xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,122,26,0.08)] py-1 z-50"
          role="menu"
        >
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-200 hover:bg-orange-500/10 transition-colors"
            role="menuitem"
          >
            <span className="material-symbols-outlined text-xl text-orange-400/80">
              person
            </span>
            Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            role="menuitem"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
