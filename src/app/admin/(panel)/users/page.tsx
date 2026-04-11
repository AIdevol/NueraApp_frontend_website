"use client";

import { adminFetch } from "@/lib/adminApi";
import { primary } from "@/lib/theme";
import { useEffect, useState } from "react";

type UserRow = {
  id: number;
  email: string;
  full_name: string;
  roles: string | null;
  is_active: boolean;
  created_at: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<number, string>>({});

  async function load() {
    setError("");
    const r = await adminFetch<UserRow[]>("/admin/users");
    if (!r.ok) {
      setError(r.detail);
      return;
    }
    setUsers(r.data);
    setRoleDraft(
      Object.fromEntries(r.data.map((u) => [u.id, u.roles ?? ""])),
    );
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveRoles(u: UserRow) {
    const roles = (roleDraft[u.id] ?? "").trim();
    setBusy(u.id);
    const r = await adminFetch<UserRow>(`/admin/users/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ roles: roles || null }),
    });
    setBusy(null);
    if (!r.ok) {
      setError(r.detail);
      return;
    }
    await load();
  }

  async function toggleActive(u: UserRow) {
    setBusy(u.id);
    const r = await adminFetch<UserRow>(`/admin/users/${u.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    setBusy(null);
    if (!r.ok) {
      setError(r.detail);
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Activate or deactivate accounts. Roles are free text (e.g. <span className="font-mono text-zinc-400">student</span>
          ).
        </p>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3 tabular-nums text-zinc-500">{u.id}</td>
                <td className="px-4 py-3 text-zinc-200">{u.email}</td>
                <td className="px-4 py-3 text-zinc-300">{u.full_name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={roleDraft[u.id] ?? ""}
                      onChange={(e) => setRoleDraft((d) => ({ ...d, [u.id]: e.target.value }))}
                      placeholder="student"
                      className="min-w-[120px] max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
                    />
                    <button
                      type="button"
                      disabled={busy === u.id}
                      onClick={() => void saveRoles(u)}
                      className="text-xs font-medium text-zinc-400 hover:text-orange-300 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={u.is_active ? "text-emerald-400" : "text-red-400"}>{u.is_active ? "Active" : "Inactive"}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={busy === u.id}
                    onClick={() => void toggleActive(u)}
                    className="text-xs font-medium hover:underline disabled:opacity-50"
                    style={{ color: primary }}
                  >
                    {u.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
