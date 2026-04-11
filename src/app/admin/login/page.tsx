"use client";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { setAdminToken } from "@/lib/adminApi";
import { primary } from "@/lib/theme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_ADMIN_EMAIL = "neuraapp@gmail.com";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const base = getPublicApiUrl();
    if (!base) {
      setError("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/v1/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          access_key: accessKey.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail.map((d: { msg?: string }) => d.msg).join(" ")
              : "Login failed";
        setError(
          res.status === 401 && process.env.NODE_ENV === "development"
            ? `${detail} (API: ${base})`
            : detail,
        );
        return;
      }
      if (data.access_token) {
        setAdminToken(data.access_token);
        router.replace("/admin");
        router.refresh();
      }
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <h1 className="text-center text-xl font-bold text-zinc-100">Admin dashboard</h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Sign in with the admin email and access key configured on the API
          <span className="block text-xs mt-1 text-zinc-600">ADMIN_EMAIL / ADMIN_ACCESS_KEY in backend .env</span>
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500/50"
              placeholder={DEFAULT_ADMIN_EMAIL}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Access key</label>
            <input
              type="password"
              autoComplete="off"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500/50"
              placeholder="Admin access key from .env"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{
              background: `linear-gradient(145deg, ${primary} 0%, #ea580c 100%)`,
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link href="/" className="hover:text-zinc-400">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
