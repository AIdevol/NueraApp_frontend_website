"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuthFlowBackground } from "@/components/auth/AuthFlowBackground";
import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";

const LOGO_SRC = "/logo.png";
const ACTIVE_AVATARS = [
  "https://i.pravatar.cc/80?img=12",
  "https://i.pravatar.cc/80?img=32",
  "https://i.pravatar.cc/80?img=47",
] as const;
const bgDark = "#030303";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement | null, opts: { type?: string; theme?: string; size?: string; width?: number }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || "");
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleClientId = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID : undefined;

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${getPublicApiUrl()}/api/v1/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.detail || data.message || "Google sign-in failed.");
          return;
        }
        if (data.access_token && typeof window !== "undefined") {
          localStorage.setItem("token", data.access_token);
          window.location.href = "/dashboard";
        }
      } catch {
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (urlError) setError(urlError);
  }, [urlError]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (r) => handleGoogleCredential(r.credential),
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: 280,
        });
        setGoogleReady(true);
      }
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [handleGoogleCredential]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!accessKey.trim()) {
      setError("Please enter your access key.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), access_key: accessKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Login failed.");
        return;
      }
      if (data.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.access_token);
          if (rememberMe) localStorage.setItem("remember_login", "1");
          window.location.href = "/dashboard";
        } else router.push("/dashboard");
        return;
      }
      setError("Invalid response from server.");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex overflow-x-hidden overflow-y-auto relative text-slate-900 dark:text-slate-100"
      style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
    >
      <AuthFlowBackground />

      {/* Left column — dark scrim so copy stays readable over shared background */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, ${bgDark} 0%, ${bgDark}e8 35%, ${bgDark}99 55%, transparent 100%)`,
          }}
        />
        {/* Layered gradient orbs */}
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 20% 20%, ${primary}35 0%, transparent 50%),
              radial-gradient(ellipse 80% 100% at 80% 80%, rgba(251, 146, 60, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 50% 50%, ${primary}12 0%, transparent 70%)
            `,
          }}
        />
        <div
          className="absolute inset-0 bg-linear-to-r opacity-95"
          style={{
            backgroundImage: `linear-gradient(to right, ${bgDark}, ${bgDark}ee, transparent)`,
          }}
        />
        <div
          className="absolute inset-0 bg-linear-to-t opacity-80"
          style={{
            backgroundImage: `linear-gradient(to top, ${bgDark}, transparent 40%, transparent 60%, ${bgDark})`,
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(${primary} 1px, transparent 1px),
              linear-gradient(90deg, ${primary} 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Branding top-left */}
        <div className="absolute top-10 left-10 flex items-center gap-3 z-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border backdrop-blur-md overflow-hidden bg-white/10"
            style={{ borderColor: `${primary}40` }}
          >
            <Image src={LOGO_SRC} alt="NeuraApp" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            NeuraApp
          </span>
        </div>
        {/* Copy bottom-left */}
        <div className="absolute bottom-20 left-10 right-20 z-10">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Unlock the Power of <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(to right, ${primary}, #fbbf24)`,
              }}
            >
              Artificial Intelligence
            </span>
          </h2>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed">
            Join our cutting-edge platform to master Machine Learning, Neural
            Networks, and shape the future of technology.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              {ACTIVE_AVATARS.map((src, idx) => (
                <div
                  key={src}
                  className="w-10 h-10 rounded-full border-2 overflow-hidden bg-slate-700"
                  style={{ borderColor: bgDark }}
                  title={`Learner ${idx + 1}`}
                >
                  <img src={src} alt={`Learner ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
              <div
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white bg-slate-700"
                style={{ borderColor: bgDark }}
              >
                +2k
              </div>
            </div>
            <span className="text-sm font-medium text-slate-400">
              Active learners
            </span>
          </div>
        </div>
      </div>

      {/* Right column — form over shared animated background */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-dvh">
        <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-black/60 via-transparent to-black/50" />
        <div className="w-full max-w-[440px] relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/30 bg-primary/10 overflow-hidden">
              <Image src={LOGO_SRC} alt="NeuraApp" width={32} height={32} className="object-contain" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              NeuraApp
            </span>
          </div>

          {/* Card - match reference exactly */}
          <div className="bg-zinc-950/85 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-8 sm:p-10 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,122,26,0.08)]">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-zinc-50 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base">
                Log in to continue your learning journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {registered && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm">
                  Registration successful. Check your email for your access key.
                </div>
              )}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="block w-full pl-11 pr-4 py-3 border border-orange-500/15 rounded-xl bg-black/40 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-primary/35 focus:border-primary/50 sm:text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Access Key
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    type={showAccessKey ? "text" : "password"}
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="block w-full pl-11 pr-11 py-3 border border-orange-500/15 rounded-xl bg-black/40 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-primary/35 focus:border-primary/50 sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessKey((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-orange-400"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showAccessKey ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-orange-500/30 bg-zinc-900"
                    style={{ accentColor: primary }}
                  />
                  <span className="ml-2.5 block text-sm text-zinc-400">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/forgot-key"
                  className="text-sm font-medium hover:opacity-80"
                  style={{ color: primary }}
                >
                  Forgot key?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-primary/35 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-[0_8px_24px_-4px_rgba(255,122,26,0.5)] hover:brightness-110"
                style={{ backgroundColor: primary }}
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-xl">
                    progress_activity
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-orange-500/15" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-950/85 text-zinc-500">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                {/* Linear stack: one Google row, one GitHub row — same style */}
                <div className="flex flex-col gap-3">
                  {/* Google — ref always in DOM for script; fallback overlaid when !googleReady */}
                  <div className="relative min-h-[48px] w-full rounded-xl border border-orange-500/15 bg-black/30 overflow-hidden">
                    <div ref={googleButtonRef} className="flex justify-center min-h-[48px] w-full [&>div]:w-full [&>iframe]:max-w-full" />
                    {!googleReady && (
                      <button
                        type="button"
                        disabled={!googleClientId || loading}
                        onClick={() => googleClientId && window.google?.accounts?.id?.prompt?.()}
                        className="absolute inset-0 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-0 bg-zinc-900/90 text-zinc-200 text-sm font-medium hover:bg-orange-500/10 transition-colors disabled:opacity-60 min-h-[48px]"
                      >
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {googleClientId ? "Continue with Google" : "Google (not configured)"}
                      </button>
                    )}
                  </div>
                  {/* GitHub — same visual style */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      const apiBase = getPublicApiUrl();
                      const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/login/callback` : "";
                      const url = `${apiBase}/api/v1/auth/github/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`;
                      window.open(url, "_self");
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-orange-500/15 bg-black/30 text-zinc-200 text-sm font-medium hover:bg-orange-500/10 transition-colors disabled:opacity-60 min-h-[48px]"
                  >
                    <svg className="h-5 w-5 shrink-0 fill-current text-slate-800 dark:text-slate-100" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    Continue with GitHub
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold hover:opacity-80" style={{ color: primary }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
