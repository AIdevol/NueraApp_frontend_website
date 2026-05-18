"use client";

import { getNgrokHeaders, getPublicApiUrl } from "@/lib/publicUrl";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface NavSection {
  href: string;
  label: string;
  icon: string;
  order?: number;
}

const DASHBOARD_PREFIX = "/dashboard";
const LEARNING_PATH_HREF = `${DASHBOARD_PREFIX}/learning-path`;
const DSA_HREF = `${DASHBOARD_PREFIX}/dsa`;
const PRACTICE_PREFIX = `${DASHBOARD_PREFIX}/practice`;

const DEFAULT_NAV_ITEMS: NavSection[] = [
  { href: `${DASHBOARD_PREFIX}`, label: "Dashboard", icon: "grid_view", order: 0 },
  { href: `${DASHBOARD_PREFIX}/learning-path`, label: "Learning Path", icon: "route", order: 2 },
  { href: `${DASHBOARD_PREFIX}/courses`, label: "Courses", icon: "menu_book", order: 3 },
  { href: `${DASHBOARD_PREFIX}/dsa`, label: "DSA", icon: "data_array", order: 4 },
  { href: `${DASHBOARD_PREFIX}/models`, label: "Models", icon: "hub", order: 5 },
  { href: `${DASHBOARD_PREFIX}/projects`, label: "Projects", icon: "folder_open", order: 6 },
  { href: `${DASHBOARD_PREFIX}/leaderboard`, label: "Leaderboard", icon: "monitoring", order: 7 },
  { href: `${DASHBOARD_PREFIX}/resources`, label: "Resources", icon: "library_books", order: 8 },
  { href: `${DASHBOARD_PREFIX}/community`, label: "Community", icon: "groups", order: 9 },
  { href: `${DASHBOARD_PREFIX}/ai-chat`, label: "Learn & chat", icon: "forum", order: 10 },
  { href: `${DASHBOARD_PREFIX}/practice`, label: "Practice Problems", icon: "code", order: 11 },
  { href: `${DASHBOARD_PREFIX}/assignments`, label: "Assignments", icon: "assignment", order: 12 },
  { href: `${DASHBOARD_PREFIX}/quizzes`, label: "Quizzes", icon: "quiz", order: 13 },
  { href: `${DASHBOARD_PREFIX}/certificates`, label: "Certificates", icon: "workspace_premium", order: 14 },
  { href: `${DASHBOARD_PREFIX}/internships`, label: "Internships", icon: "work", order: 15 },
  { href: `${DASHBOARD_PREFIX}/jobs`, label: "Jobs", icon: "business_center", order: 16 },
  { href: `${DASHBOARD_PREFIX}/interview-prep`, label: "Interview Prep", icon: "record_voice_over", order: 17 },
  { href: `${DASHBOARD_PREFIX}/roadmaps`, label: "Career Roadmaps", icon: "map", order: 18 },
  { href: `${DASHBOARD_PREFIX}/hackathons`, label: "Hackathons", icon: "emoji_events", order: 19 },
  { href: `${DASHBOARD_PREFIX}/discussions`, label: "Discussions", icon: "forum", order: 20 },
  { href: `${DASHBOARD_PREFIX}/mentorship`, label: "Mentorship", icon: "school", order: 21 },
  { href: `${DASHBOARD_PREFIX}/bookmarks`, label: "Bookmarks", icon: "bookmark", order: 22 },
  { href: `${DASHBOARD_PREFIX}/notes`, label: "Notes", icon: "draw", order: 23 },
  { href: `${DASHBOARD_PREFIX}/notifications`, label: "Notifications", icon: "notifications", order: 24 },
  { href: `${DASHBOARD_PREFIX}/settings`, label: "Settings", icon: "settings", order: 25 },
];

interface DashboardNavProps {
  collapsed?: boolean;
}

export function DashboardNav({ collapsed = false }: DashboardNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navItems, setNavItems] = useState<NavSection[]>(DEFAULT_NAV_ITEMS);

  useEffect(() => {
    let cancelled = false;
    fetch(`${getPublicApiUrl()}/api/v1/navigation/sections`, { headers: getNgrokHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.sections?.length) return;
        const sorted = [...data.sections]
          .sort((a: NavSection, b: NavSection) => (a.order ?? 0) - (b.order ?? 0))
          .map((s: NavSection) => ({
            ...s,
            href: s.href === "/" ? DASHBOARD_PREFIX : `${DASHBOARD_PREFIX}${s.href}`,
          }));
        setNavItems(sorted);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map(({ href, label, icon }) => {
        let isActive =
          pathname === href ||
          (href !== DASHBOARD_PREFIX && pathname.startsWith(href + "/"));
        if (
          href === LEARNING_PATH_HREF &&
          pathname.startsWith(`${DASHBOARD_PREFIX}/content/`) &&
          Boolean(searchParams.get("topic")?.trim())
        ) {
          isActive = true;
        }
        if (href === DSA_HREF && pathname.startsWith(PRACTICE_PREFIX)) {
          isActive = true;
        }
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={`group relative flex items-center rounded-xl transition-all duration-200 ${
              collapsed ? "justify-center w-11 h-11 mx-auto" : "gap-2.5 px-3 py-2.5"
            } ${
              isActive
                ? `bg-linear-to-r from-orange-500/20 via-orange-500/10 to-transparent text-zinc-50 ${
                    collapsed ? "ring-1 ring-orange-500/40" : ""
                  }`
                : "text-zinc-500 hover:bg-zinc-900/90 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {isActive && (
              <span
                className="pointer-events-none absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-orange-500 shadow-[0_0_12px_rgba(255,122,26,0.7)]"
                aria-hidden
              />
            )}
            <span
              className={`material-symbols-outlined shrink-0 ${collapsed ? "text-[22px]" : "text-xl"} ${
                isActive ? "text-orange-400" : "text-zinc-500 group-hover:text-orange-300/90"
              }`}
              style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 500" } : undefined}
            >
              {icon}
            </span>
            {!collapsed && (
              <span
                className={`text-sm truncate ${isActive ? "font-semibold text-zinc-50" : "font-medium"}`}
              >
                {label}
              </span>
            )}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-2 rounded-md border border-zinc-700/70 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-100 whitespace-nowrap opacity-0 translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 z-30 shadow-lg">
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
