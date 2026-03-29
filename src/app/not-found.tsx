import Link from "next/link";

import { primary } from "@/lib/theme";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-20"
          style={{ backgroundColor: primary }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-[80px] opacity-10"
          style={{ backgroundColor: primary }}
        />
        <div
          className="absolute top-1/3 right-0 w-64 h-64 rounded-full blur-[60px] opacity-10"
          style={{ backgroundColor: "#8b5cf6" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 w-full border-b border-slate-200 dark:border-slate-800/50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ color: primary }}
              >
                psychology
              </span>
              <span className="text-xl font-bold tracking-tight">
                NeuraApp
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:opacity-80 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: primary,
                  boxShadow: "0 10px 15px -3px rgba(13, 13, 242, 0.2)",
                }}
              >
                Join for Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-xl mx-auto">
          {/* 404 number */}
          <div className="relative mb-8">
            <span
              className="text-[clamp(8rem,25vw,14rem)] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-500 select-none"
              style={{ WebkitTextStroke: "2px rgba(13, 13, 242, 0.15)" }}
            >
              404
            </span>
          </div>

          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8 animate-bounce"
            style={{ backgroundColor: `${primary}18`, border: `2px solid ${primary}33` }}
          >
            <span
              className="material-symbols-outlined text-5xl"
              style={{ color: primary }}
            >
              search_off
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Page not found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 max-w-md mx-auto">
            Looks like this path didn’t converge. The page you’re looking for
            might have been moved or doesn’t exist.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 text-base font-bold text-white rounded-xl shadow-xl transition-all hover:opacity-90"
              style={{
                backgroundColor: primary,
                boxShadow: "0 20px 25px -5px rgba(13, 13, 242, 0.25)",
              }}
            >
              <span className="material-symbols-outlined">home</span>
              Back to home
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <span className="material-symbols-outlined">explore</span>
              Explore features
            </Link>
          </div>

          <p className="mt-12 text-sm text-slate-500 dark:text-slate-400">
            Lost in the neural network? We’ve got you.
          </p>
        </div>
      </main>
    </div>
  );
}
