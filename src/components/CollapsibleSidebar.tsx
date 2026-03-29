"use client";

import Image from "next/image";
import { useState } from "react";
import { DashboardNav } from "@/components/DashboardNav";

const LOGO_SRC = "/logo.png";

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => setCollapsed((c) => !c);

  return (
    <aside
      className={`shrink-0 border-r border-orange-500/15 bg-zinc-950 h-screen overflow-hidden hidden md:flex flex-col z-20 transition-[width] duration-200 ease-in-out shadow-[4px_0_24px_-8px_rgba(0,0,0,0.6)] ${
        collapsed ? "w-[74px]" : "w-52"
      }`}
    >
      <div className={`flex flex-col h-full overflow-hidden bg-linear-to-b from-zinc-950 via-zinc-950 to-black ${collapsed ? "p-2" : "p-2.5"}`}>
        <div className={`mb-4 ${collapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between"}`}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`flex items-center gap-3 px-1 rounded-xl hover:bg-orange-500/10 transition-colors ${
              collapsed ? "justify-center px-0 py-1 w-full" : ""
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="rounded-lg flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-orange-500/30 ring-offset-2 ring-offset-zinc-950 bg-zinc-900/80">
              <Image
                src={LOGO_SRC}
                alt="NeuraApp"
                width={collapsed ? 34 : 36}
                height={collapsed ? 34 : 36}
                className="object-contain"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 text-left">
                <h1 className="text-zinc-100 text-base font-bold leading-tight tracking-tight truncate">
                  NeuraApp
                </h1>
                <p className="text-orange-400/70 text-xs font-medium">Pro Edition</p>
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`inline-flex items-center justify-center rounded-full text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 transition-colors ${collapsed ? "p-1" : "p-1.5"}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-xl">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DashboardNav collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
