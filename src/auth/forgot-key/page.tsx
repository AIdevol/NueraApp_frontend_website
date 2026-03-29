"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

const LOGO_SRC = "/logo.png";

type Step = "email" | "otp" | "success";

export default function ForgotKeyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newAccessKey, setNewAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/auth/forgot-key/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Request failed.");
        return;
      }
      setMessage(data.message || "Verification code sent. Check your email.");
      setStep("otp");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/auth/forgot-key/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Invalid or expired code.");
        return;
      }
      setNewAccessKey(data.access_key ?? "");
      setStep("success");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyKey() {
    if (newAccessKey && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(newAccessKey);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {/* Left panel - same style as login */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-[240px] lg:min-h-screen overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 20% 20%, ${primary}30 0%, transparent 50%),
              radial-gradient(ellipse 80% 100% at 80% 80%, rgba(139, 92, 246, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 50% 50%, ${primary}15 0%, transparent 70%)
            `,
          }}
        />
        <div className="absolute inset-0 bg-[#101022]/95" />
        <div className="absolute top-10 left-10 flex items-center gap-3 z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-primary/40 bg-white/10 overflow-hidden">
            <Image src={LOGO_SRC} alt="NeuraApp" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">NeuraApp</span>
        </div>
        <div className="absolute bottom-20 left-10 right-20 z-10">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Forgot your access key?
          </h2>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed">
            Enter your email to receive a verification code. After verifying, you&apos;ll get a new access key to sign in.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto min-h-screen bg-background-light dark:bg-background-dark">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-50"
          style={{ backgroundColor: primary }}
        />
        <div className="w-full max-w-[440px] relative z-10">
          {/* Mobile header */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/30 bg-primary/10 overflow-hidden">
              <Image src={LOGO_SRC} alt="NeuraApp" width={32} height={32} className="object-contain" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              NeuraApp
            </span>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl">
            {step === "email" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">
                    Get a new access key
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Enter the email address linked to your account. We&apos;ll send a verification code.
                  </p>
                </div>
                <form onSubmit={handleRequestOtp} className="space-y-5">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
                    style={{ backgroundColor: primary }}
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    ) : (
                      "Send verification code"
                    )}
                  </button>
                </form>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">
                    Enter verification code
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    We sent a 6-digit code to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>. Enter it below.
                  </p>
                  {message && (
                    <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
                  )}
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Verification code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-center text-2xl tracking-[0.4em] placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
                    style={{ backgroundColor: primary }}
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    ) : (
                      "Verify and get new key"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(""); setError(""); setMessage(""); }}
                    className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Use a different email
                  </button>
                </form>
              </>
            )}

            {step === "success" && (
              <>
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4">
                    <span className="material-symbols-outlined text-3xl">check_circle</span>
                  </div>
                  <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">
                    Your new access key
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Use this key with your email to sign in. We&apos;ve also sent it to your email.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 mb-6">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Access key
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-lg font-bold text-slate-900 dark:text-white break-all select-all">
                      {newAccessKey}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="shrink-0 p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Copy"
                    >
                      <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-xl">
                        content_copy
                      </span>
                    </button>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all active:scale-[0.98]"
                  style={{ backgroundColor: primary }}
                >
                  Continue to sign in
                </Link>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Remember your key?{" "}
            <Link href="/login" className="font-semibold hover:opacity-80" style={{ color: primary }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
