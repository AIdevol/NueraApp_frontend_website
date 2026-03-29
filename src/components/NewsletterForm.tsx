"use client";

import { primary } from "@/lib/theme";

export function NewsletterForm() {
  return (
    <form
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="you@example.com"
        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <button
        type="submit"
        className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
        style={{ backgroundColor: primary }}
      >
        Subscribe
      </button>
    </form>
  );
}
