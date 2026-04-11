"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { setAdminToken } from "@/lib/adminApi";
import { primary } from "@/lib/theme";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/problems", label: "Practice" },
  { href: "/admin/analytics", label: "Analytics" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    setAdminToken(null);
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-zinc-800 md:w-52 md:border-b-0 md:border-r md:border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Admin</p>
          <p className="text-sm font-bold" style={{ color: primary }}>
            NeuraApp
          </p>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-orange-500/15 text-orange-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-zinc-800 p-3 md:block">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-900"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      <div className="border-t border-zinc-800 p-3 md:hidden">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
