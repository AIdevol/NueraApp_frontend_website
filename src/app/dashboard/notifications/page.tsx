"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { bearerAuthHeaders } from "@/lib/authHeaders";
import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

type FilterTab = "all" | "unread" | "mentions" | "archived";

const FILTERS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mentions", label: "Mentions" },
  { id: "archived", label: "Archived" },
];

const ICON_STYLES: Record<string, { border: string; bg: string; color: string }> = {
  community: { border: "border-l-orange-500/60", bg: "bg-primary/10 border-primary/20", color: "text-primary" },
  success: { border: "border-l-emerald-500/60", bg: "bg-emerald-500/10 border-emerald-500/20", color: "text-emerald-500" },
  news: { border: "border-l-amber-500/60", bg: "bg-amber-500/10 border-amber-500/20", color: "text-amber-500" },
  invite: { border: "border-l-purple-500/60", bg: "bg-purple-500/10 border-purple-500/20", color: "text-purple-500" },
  mention: { border: "", bg: "bg-zinc-800 border-zinc-700", color: "text-zinc-400" },
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: string;
  time: string;
  read: boolean;
  action_url?: string | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const headers = bearerAuthHeaders();
    if (!headers.Authorization) { router.replace("/login"); return; }

    setLoading(true);
    fetch(`${getPublicApiUrl()}/api/v1/notifications?filter=${activeFilter}`, { headers })
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        return r.ok ? r.json() : Promise.reject(r.statusText);
      })
      .then((data) => {
        if (cancelled || !data) return;
        setNotifications(data.notifications ?? []);
        setTotal(data.total ?? 0);
        setUnread(data.unread ?? 0);
      })
      .catch(() => { if (!cancelled) setError("Could not load notifications."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeFilter, router]);

  async function markRead(id: string) {
    const headers = { ...bearerAuthHeaders(), "Content-Type": "application/json" };
    await fetch(`${getPublicApiUrl()}/api/v1/notifications/${id}/read`, { method: "PATCH", headers }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="max-w-[1000px] w-full flex flex-col">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50">Notifications</h1>
          <p className="text-zinc-400 mt-1 text-sm md:text-base">Stay updated with your learning journey</p>
        </div>
        {unread > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: primary, color: "#fff" }}>
            {unread} unread
          </span>
        )}
      </div>

      <div className="flex gap-3 mb-6 md:mb-8 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`flex h-10 shrink-0 items-center justify-center rounded-xl px-6 text-sm font-bold transition-all ${
              activeFilter === f.id
                ? "text-white shadow-[0_0_15px_rgba(255,122,26,0.3)]"
                : "border border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
            }`}
            style={activeFilter === f.id ? { backgroundColor: primary } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="text-zinc-500 text-sm">Loading notifications…</span></div>
      ) : error ? (
        <div className="flex justify-center py-16"><span className="text-red-400 text-sm">{error}</span></div>
      ) : notifications.length === 0 ? (
        <div className="flex justify-center py-16"><span className="text-zinc-500 text-sm">No notifications.</span></div>
      ) : (
        <div className="flex flex-col gap-4">
          {notifications.map((n) => {
            const style = ICON_STYLES[n.type] ?? ICON_STYLES.mention;
            return (
              <div
                key={n.id}
                className={`rounded-2xl border border-zinc-800 bg-[#0c0c0f] p-5 flex flex-col md:flex-row gap-4 items-start border-l-4 ${style.border} ${n.read ? "opacity-70" : ""}`}
              >
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-full border ${style.bg} ${style.color}`}>
                  <span className={`material-symbols-outlined text-3xl ${style.color}`}>{n.icon}</span>
                </div>
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-zinc-100 text-lg font-semibold leading-tight">{n.title}</h3>
                    <span className="text-zinc-500 text-xs font-medium whitespace-nowrap mt-0.5">{n.time}</span>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{n.body}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {n.action_url && (
                      <button
                        type="button"
                        onClick={() => router.push(n.action_url!)}
                        className="h-9 px-4 rounded-lg text-xs font-bold text-white hover:opacity-90"
                        style={{ backgroundColor: primary }}
                      >
                        View
                      </button>
                    )}
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => void markRead(n.id)}
                        className="h-9 px-4 rounded-lg text-xs font-bold border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 md:mt-12 text-center py-8 border-t border-zinc-800">
        <p className="text-zinc-500 text-sm">Showing {notifications.length} of {total} notifications</p>
      </div>
    </div>
  );
}
