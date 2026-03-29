"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { bearerAuthHeaders } from "@/lib/authHeaders";
import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  useEffect(() => {
    const headers = bearerAuthHeaders();
    if (!headers.Authorization) { router.replace("/login"); return; }
    fetch(`${getPublicApiUrl()}/api/v1/profile/me`, { headers })
      .then((r) => { if (r.status === 401) { router.replace("/login"); return null; } return r.ok ? r.json() : null; })
      .then((d) => {
        if (!d) return;
        setFullName(d.full_name ?? "");
        setEmail(d.email ?? "");
        setEmailNotifs(d.notifications?.email_enabled ?? true);
        setPushNotifs(d.notifications?.push_enabled ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setMsg("");
    const headers = { ...bearerAuthHeaders(), "Content-Type": "application/json" };
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/profile/basic`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ full_name: fullName }),
      });
      if (res.ok) setMsg("Settings saved.");
      else setMsg("Could not save settings.");
    } catch {
      setMsg("Connection error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><span className="text-zinc-500 text-sm">Loading settings…</span></div>;
  }

  return (
    <>
      <div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-1">Settings</h2>
        <p className="text-zinc-400 text-sm md:text-base">Manage your account, notifications, and preferences.</p>
      </div>

      <section className="glassmorphism rounded-xl border border-orange-500/15 p-5 md:p-6">
        <h3 className="text-lg font-bold text-zinc-50 mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Display name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-zinc-700 text-zinc-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-zinc-600 mt-1">Email cannot be changed.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-4 py-2 rounded-xl font-medium text-white text-sm hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primary }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {msg && <span className={`text-sm ${msg.includes("saved") ? "text-emerald-400" : "text-red-400"}`}>{msg}</span>}
          </div>
        </div>
      </section>

      <section className="glassmorphism rounded-xl border border-orange-500/15 p-5 md:p-6">
        <h3 className="text-lg font-bold text-zinc-50 mb-4">Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-zinc-100">Email notifications</p>
              <p className="text-xs text-zinc-500 mt-0.5">Course updates and reminders</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifs}
              onClick={() => setEmailNotifs((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${emailNotifs ? "" : "bg-zinc-700"}`}
              style={emailNotifs ? { backgroundColor: primary, borderColor: primary } : undefined}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${emailNotifs ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-zinc-100">Push notifications</p>
              <p className="text-xs text-zinc-500 mt-0.5">Browser or app alerts</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushNotifs}
              onClick={() => setPushNotifs((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${pushNotifs ? "" : "bg-zinc-700"}`}
              style={pushNotifs ? { backgroundColor: primary, borderColor: primary } : undefined}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${pushNotifs ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="glassmorphism rounded-xl border border-orange-500/15 p-5 md:p-6">
        <h3 className="text-lg font-bold text-zinc-50 mb-2">Danger zone</h3>
        <p className="text-sm text-zinc-500 mb-4">Permanently delete your account and data.</p>
        <button type="button" className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-800 hover:bg-red-950/40 transition-colors">
          Delete account
        </button>
      </section>
    </>
  );
}
