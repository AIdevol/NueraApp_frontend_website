import Link from "next/link";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";
import { DashboardAuthGuard } from "@/components/DashboardAuthGuard";
import { DashboardContent } from "@/components/DashboardContent";
import { ProfileDropdown } from "@/components/ProfileDropdown";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
    <div className="flex h-screen w-full flex-row overflow-hidden bg-zinc-950 font-[family-name:var(--font-lexend),Lexend,sans-serif] text-zinc-100">
      <CollapsibleSidebar />
      <main className="relative flex-1 flex flex-col min-w-0 min-h-0 h-screen bg-zinc-950 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 120% 70% at 50% -30%, rgba(255, 122, 26, 0.12) 0%, transparent 55%), radial-gradient(ellipse 80% 50% at 100% 50%, rgba(251, 146, 60, 0.05) 0%, transparent 45%)",
          }}
        />
        <header className="relative shrink-0 z-10 border-b border-orange-500/15 bg-black/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-[0_1px_0_rgba(255,122,26,0.06)]">
          <div className="flex-1 max-w-md">
            <label className="relative flex items-center w-full">
              <span className="material-symbols-outlined absolute left-3 text-orange-400/50 text-lg">search</span>
              <input
                type="text"
                placeholder="Search courses, models, or topics..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-zinc-900/80 border border-orange-500/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 text-zinc-100 placeholder-zinc-500"
              />
            </label>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/billing"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-orange-500/20 text-zinc-300 hover:bg-orange-500/10 hover:border-orange-500/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-orange-400/90">workspace_premium</span>
              Subscription
            </Link>
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-full text-zinc-400 hover:bg-orange-500/10 hover:text-orange-300 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,122,26,0.9)] border-2 border-zinc-950" />
            </Link>
            <ProfileDropdown />
          </div>
        </header>
        <DashboardContent>
          {children}
        </DashboardContent>
      </main>
    </div>
    </DashboardAuthGuard>
  );
}
