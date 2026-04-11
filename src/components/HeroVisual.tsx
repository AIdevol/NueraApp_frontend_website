"use client";

import { primary } from "@/lib/theme";

const SKILL_TAGS = [
  { label: "Master Software Engineer", className: "top-[6%] left-[4%] sm:left-[8%]" },
  { label: "AI / ML", className: "top-[12%] right-[6%] sm:right-[10%]" },
  { label: "Deep Learning", className: "top-[38%] left-[2%] sm:left-[4%]" },
  { label: "LLMs & Transformers", className: "top-[44%] right-[2%] sm:right-[6%]" },
  { label: "MLOps", className: "bottom-[38%] left-[8%] sm:left-[12%]" },
  { label: "System Design", className: "bottom-[32%] right-[6%] sm:right-[10%]" },
  { label: "Computer Vision", className: "bottom-[10%] left-[10%] sm:left-[14%]" },
  { label: "NLP & RAG", className: "bottom-[8%] right-[10%] sm:right-[14%]" },
] as const;

export function HeroVisual() {
  return (
    <div className="relative w-full min-h-[300px] sm:min-h-[380px] lg:min-h-0 lg:aspect-square max-w-[560px] mx-auto mt-10 lg:mt-0">
      {/* Flowing animated backdrop */}
      <div
        className="absolute inset-0 rounded-4xl sm:rounded-[2.5rem] overflow-hidden border border-orange-500/20 bg-zinc-950/80 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,122,26,0.08)]"
        aria-hidden
      >
        <div className="hero-flow-mesh absolute inset-0 opacity-90" />
        <div className="hero-flow-blob hero-flow-blob-a absolute -top-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-3xl pointer-events-none" />
        <div className="hero-flow-blob hero-flow-blob-b absolute -bottom-1/4 -left-1/4 w-[65%] h-[65%] rounded-full blur-3xl pointer-events-none" />
        <div className="hero-flow-blob hero-flow-c absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full blur-3xl pointer-events-none opacity-70" />

        {/* SVG: flowing curves + nodes */}
        <svg
          className="absolute inset-0 w-full h-full text-orange-500/25"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="hero-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primary} stopOpacity="0.5" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.35" />
              <stop offset="100%" stopColor={primary} stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="hero-glow" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor={primary} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          <path
            className="hero-flow-path"
            d="M40 200 C 100 80, 180 80, 240 200 S 340 320, 380 200"
            stroke="url(#hero-line-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            className="hero-flow-path hero-flow-path-delay"
            d="M360 120 C 280 200, 200 280, 80 320"
            stroke="url(#hero-line-grad)"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            className="hero-flow-path"
            d="M200 40 Q 320 140, 200 240 T 200 380"
            stroke="url(#hero-line-grad)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.5"
          />

          <circle className="hero-node" cx="200" cy="200" r="6" fill="url(#hero-glow)" />
          <circle className="hero-node hero-node-delay" cx="120" cy="140" r="4" fill={primary} opacity="0.85" />
          <circle className="hero-node" cx="280" cy="260" r="4" fill="#fbbf24" opacity="0.75" />
          <circle className="hero-node hero-node-delay" cx="200" cy="90" r="3.5" fill={primary} opacity="0.65" />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1">
          <div
            className="rounded-2xl px-5 py-3 border backdrop-blur-md bg-black/35 text-center max-w-[200px] shadow-[0_0_40px_-8px_rgba(255,122,26,0.35)]"
            style={{ borderColor: `${primary}44` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/90 mb-1">
              Your path
            </p>
            <p className="text-sm font-bold text-zinc-100 leading-snug">Build · Ship · Scale</p>
          </div>
        </div>
      </div>

      {/* Floating skill tags */}
      <div className="absolute inset-0 z-2 pointer-events-none">
        {SKILL_TAGS.map(({ label, className }, i) => (
          <span
            key={label}
            className={`hero-skill-tag absolute inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border bg-zinc-950/75 backdrop-blur-sm text-zinc-200 shadow-lg max-w-[140px] sm:max-w-none text-center leading-tight ${className}`}
            style={{
              borderColor: `${primary}35`,
              animationDelay: `${i * 0.35}s`,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
