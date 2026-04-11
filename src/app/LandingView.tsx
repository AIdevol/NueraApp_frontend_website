"use client";

import Link from "next/link";
import Image from "next/image";

import { EmployerLogoMarquee } from "@/components/EmployerLogoMarquee";
import { HeroVisual } from "@/components/HeroVisual";
import { primary } from "@/lib/theme";

const LOGO_SRC = "/logo.png";

const FEAT_1_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop";
const FEAT_2_IMAGE =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop";
const FEAT_3_IMAGE =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop";

export function LandingView() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased overflow-x-hidden font-sans [&_h1]:font-display [&_h2]:font-display [&_h3]:font-display">
      {/* ─── NAVIGATION ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 pt-4">
          <div
            className="flex items-center justify-between px-6 h-14 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl"
            style={{ boxShadow: "0 0 0 1px rgba(255,122,26,0.06), 0 8px 32px rgba(0,0,0,0.4)" }}
          >
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-orange-500/30 transition-all group-hover:border-orange-500/60"
                style={{ backgroundColor: `${primary}15` }}
              >
                <Image src={LOGO_SRC} alt="NeuraApp" width={22} height={22} className="object-contain" />
              </div>
              <span className="text-sm font-bold tracking-tight text-zinc-100">NeuraApp</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {["Features", "Paths", "Curriculum", "Testimonials"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 hover:text-zinc-100 rounded-lg hover:bg-zinc-900 transition-all"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:flex items-center px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-zinc-900"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-zinc-950 rounded-xl transition-all hover:opacity-90"
                style={{ backgroundColor: primary, boxShadow: `0 4px 16px -2px ${primary}70` }}
              >
                Join Free
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* ─── HERO ────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center pt-28 pb-24 overflow-hidden">
          {/* Background grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,122,26,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,26,0.04) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          {/* Diagonal accent line */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "10%",
              right: "-5%",
              width: "55%",
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${primary}40, transparent)`,
              transform: "rotate(-12deg)",
            }}
          />
          {/* Glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "20%",
              left: "-10%",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${primary}20 0%, transparent 65%)`,
              filter: "blur(60px)",
            }}
          />

          <div className="max-w-[1400px] mx-auto px-6 w-full relative z-10">
            {/* Eyebrow ticker */}
            <div className="flex items-center gap-3 mb-10">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.14em]"
                style={{
                  backgroundColor: `${primary}12`,
                  borderColor: `${primary}35`,
                  color: primary,
                }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
                New Curriculum Live
              </div>
              <div className="h-px flex-1 max-w-[120px]" style={{ background: `linear-gradient(90deg, ${primary}40, transparent)` }} />
            </div>

            <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-center">
              <div>
                {/* Big editorial headline */}
                <h1
                  className="font-display font-black leading-[0.92] tracking-[-0.03em] text-zinc-50 mb-8"
                  style={{ fontSize: "clamp(56px, 8vw, 112px)" }}
                >
                  Learn
                  <br />
                  <span
                    className="text-transparent bg-clip-text"
                    style={{ backgroundImage: `linear-gradient(110deg, ${primary} 30%, #fbbf24 70%)` }}
                  >
                    Any Skill
                  </span>
                  <br />
                  <span className="text-zinc-600">Your Way.</span>
                </h1>

                <p className="text-lg text-zinc-400 max-w-xl leading-relaxed mb-10">
                  Elevate your career with expert-led courses across tech, design, business, and beyond.
                  Structured paths, real projects, and a community that grows with you.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-zinc-950 rounded-2xl transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: primary,
                      boxShadow: `0 16px 40px -8px ${primary}80`,
                    }}
                  >
                    Start Learning Now
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-[0.08em] text-zinc-300 rounded-2xl border border-zinc-700/60 hover:border-orange-500/40 hover:text-zinc-100 transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: "rgba(24,24,27,0.8)" }}
                  >
                    <span className="material-symbols-outlined text-orange-400" style={{ fontSize: 18 }}>play_circle</span>
                    View Demo
                  </a>
                </div>

                {/* Inline stats row */}
                <div className="flex items-center gap-8 mt-12 pt-8 border-t border-zinc-800/60">
                  {[
                    { val: "2K+", label: "Students" },
                    { val: "500+", label: "Courses" },
                    { val: "4.9★", label: "Rating" },
                  ].map((s) => (
                    <div key={s.val}>
                      <p
                        className="text-2xl font-black text-transparent bg-clip-text"
                        style={{ backgroundImage: `linear-gradient(135deg, ${primary}, #fbbf24)` }}
                      >
                        {s.val}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero visual */}
              <div className="hidden lg:block">
                <HeroVisual />
              </div>
            </div>
          </div>
        </section>

        {/* ─── MARQUEE ─────────────────────────────────────────────── */}
        <div className="border-y border-zinc-800/60">
          <EmployerLogoMarquee />
        </div>

        {/* ─── FEATURES ────────────────────────────────────────────── */}
        <section className="py-32 relative" id="features">
          {/* Side label */}
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700"
            style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
          >
            <span style={{ color: primary }}>◆</span> Features
          </div>

          <div className="max-w-[1400px] mx-auto px-6">
            {/* Section header — left-anchored editorial style */}
            <div className="flex items-end justify-between mb-16 gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
                  01 — Platform
                </p>
                <h2
                  className="font-black leading-tight tracking-tight text-zinc-50"
                  style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
                >
                  Built for<br />Real Growth
                </h2>
              </div>
              <p className="hidden md:block text-zinc-500 max-w-sm text-sm leading-relaxed">
                Engineered to help you go from zero to job-ready — through hands-on practice, expert content, and a platform that adapts to your pace.
              </p>
            </div>

            {/* Feature cards — asymmetric grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: "smart_display",
                  num: "01",
                  title: "Video Lessons",
                  desc: "High-quality, bite-sized video lessons from industry experts across every discipline. Learn at your own pace.",
                  img: FEAT_1_IMAGE,
                  tall: false,
                },
                {
                  icon: "terminal",
                  num: "02",
                  title: "Code Playgrounds",
                  desc: "Interactive coding environments to practice skills right in your browser. Zero setup, instant feedback.",
                  img: FEAT_2_IMAGE,
                  badge: "Popular",
                  tall: true,
                },
                {
                  icon: "article",
                  num: "03",
                  title: "Research Feeds",
                  desc: "Stay current with the latest industry trends, papers, and insights — curated summaries delivered to you.",
                  img: FEAT_3_IMAGE,
                  tall: false,
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group relative rounded-3xl overflow-hidden border border-zinc-800/60 hover:border-orange-500/30 transition-all duration-500"
                  style={{ backgroundColor: "#111113" }}
                >
                  {f.badge && (
                    <div
                      className="absolute top-5 right-5 z-10 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em]"
                      style={{ backgroundColor: primary, color: "#09090b" }}
                    >
                      {f.badge}
                    </div>
                  )}
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${primary}15`, color: primary }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{f.icon}</span>
                      </div>
                      <span className="font-display text-5xl font-black text-zinc-800/60 leading-none">
                        {f.num}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-zinc-50">{f.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="mx-4 mb-4 rounded-2xl overflow-hidden">
                    <img
                      src={f.img}
                      alt={f.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── STATS BAND ──────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden border-y border-orange-500/15"
          style={{ background: `linear-gradient(135deg, ${primary}10 0%, transparent 50%)` }}
        >
          <div className="max-w-[1400px] mx-auto px-6 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-zinc-800/60">
              {[
                { val: "2K+", label: "Active Students", icon: "group" },
                { val: "500+", label: "Curated Courses", icon: "menu_book" },
                { val: "50+", label: "Expert Instructors", icon: "school" },
                { val: "4.9/5", label: "Average Rating", icon: "star" },
              ].map((s) => (
                <div key={s.val} className="flex flex-col items-center text-center gap-3 md:px-8">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primary}15`, color: primary }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{s.icon}</span>
                  </div>
                  <p
                    className="font-display text-4xl font-black text-transparent bg-clip-text leading-none"
                    style={{ backgroundImage: `linear-gradient(135deg, ${primary}, #fbbf24)` }}
                  >
                    {s.val}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── LEARNING PATHS ──────────────────────────────────────── */}
        <section className="py-32" id="paths">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
                02 — Roadmap
              </p>
              <h2
                className="font-black leading-tight tracking-tight text-zinc-50 max-w-lg"
                style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
              >
                Choose Your Learning Path
              </h2>
            </div>

            {/* Horizontal path cards with left border accent */}
            <div className="space-y-4">
              {[
                { icon: "psychology", title: "AI & Machine Learning", desc: "Neural networks, deep learning, NLP, and computer vision. From theory to production.", color: primary, num: "Path 01" },
                { icon: "code", title: "Software Development", desc: "Full-stack, DevOps, and cloud. Build real-world applications from the ground up.", color: "#fb923c", num: "Path 02" },
                { icon: "design_services", title: "Design & Creativity", desc: "UI/UX, product design, motion graphics, and visual storytelling. Make ideas beautiful.", color: "#ea580c", num: "Path 03" },
                { icon: "bar_chart", title: "Business & Analytics", desc: "Data analysis, strategy, marketing, and finance. Drive decisions with confidence.", color: "#f97316", num: "Path 04" },
              ].map((path) => (
                <div
                  key={path.title}
                  className="group flex items-center justify-between gap-8 p-8 rounded-3xl border border-zinc-800/60 hover:border-orange-500/25 transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: "#111113",
                    borderLeft: `3px solid ${path.color}`,
                  }}
                >
                  <div className="flex items-center gap-8">
                    <span
                      className="text-[11px] font-black uppercase tracking-[0.14em] shrink-0 hidden sm:block"
                      style={{ color: `${path.color}80` }}
                    >
                      {path.num}
                    </span>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${path.color}18`, color: path.color }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{path.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1 text-zinc-50 group-hover:text-white">
                        {path.title}
                      </h3>
                      <p className="text-sm text-zinc-500">{path.desc}</p>
                    </div>
                  </div>
                  <Link
                    href="/register"
                    className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border border-zinc-700 group-hover:border-orange-500/50 transition-all group-hover:scale-110"
                    style={{ color: path.color }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CURRICULUM ──────────────────────────────────────────── */}
        <section
          className="py-32 border-y border-orange-500/10 relative overflow-hidden"
          id="curriculum"
          style={{ backgroundColor: "#0a0a0c" }}
        >
          {/* Large decorative text */}
          <div className="font-display absolute -right-8 top-1/2 -translate-y-1/2 text-[200px] font-black text-zinc-900/30 pointer-events-none select-none leading-none">
            EDU
          </div>

          <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-[360px_1fr] gap-16 items-start">
              <div className="lg:sticky lg:top-32">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
                  03 — Curriculum
                </p>
                <h2
                  className="font-black leading-tight tracking-tight text-zinc-50 mb-6"
                  style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
                >
                  Comprehensive Curriculum
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Spanning tech, design, business, and beyond. Every track includes theory, hands-on labs, and real-world projects.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Python & Programming",
                  "Web Development",
                  "AI & Machine Learning",
                  "Data Science",
                  "UI/UX Design",
                  "Digital Marketing",
                  "Cloud & DevOps",
                  "Cybersecurity",
                  "Business Strategy",
                  "Finance & Accounting",
                  "Content Creation",
                  "Capstone Projects",
                ].map((topic, i) => (
                  <div
                    key={topic}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-800/60 hover:border-orange-500/30 transition-all group"
                    style={{ backgroundColor: "#111113" }}
                  >
                    <span
                      className="text-[10px] font-black tabular-nums shrink-0"
                      style={{ color: `${primary}60` }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">{topic}</span>
                    <span
                      className="ml-auto material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ fontSize: 16, color: primary }}
                    >
                      check_circle
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
        <section className="py-32">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
                04 — Process
              </p>
              <h2
                className="font-black leading-tight tracking-tight text-zinc-50"
                style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
              >
                How It Works
              </h2>
            </div>

            {/* Steps with connector lines */}
            <div className="relative grid md:grid-cols-4 gap-4">
              {/* Connector line */}
              <div
                className="absolute top-10 left-[12.5%] right-[12.5%] h-px hidden md:block"
                style={{ background: `linear-gradient(90deg, ${primary}40, ${primary}20, ${primary}40)` }}
              />

              {[
                { step: "01", icon: "person_add", title: "Create account", desc: "Sign up free and pick your learning path." },
                { step: "02", icon: "menu_book", title: "Learn", desc: "Watch lessons, run code, and complete exercises." },
                { step: "03", icon: "code", title: "Build", desc: "Apply skills on real projects and build a portfolio that speaks for itself." },
                { step: "04", icon: "workspace_premium", title: "Get certified", desc: "Earn certificates and share your progress." },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div
                      className="w-20 h-20 rounded-3xl flex items-center justify-center border border-zinc-800/80 relative z-10"
                      style={{ backgroundColor: "#111113" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: primary }}>{item.icon}</span>
                    </div>
                    <span
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black text-zinc-950 z-20"
                      style={{ backgroundColor: primary }}
                    >
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-2 text-zinc-50">{item.title}</h3>
                  <p className="text-sm text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ────────────────────────────────────────── */}
        <section
          className="py-32 border-y border-orange-500/10"
          id="testimonials"
          style={{ backgroundColor: "#0a0a0c" }}
        >
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
                05 — Testimonials
              </p>
              <h2
                className="font-black leading-tight tracking-tight text-zinc-50"
                style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
              >
                Loved by Learners<br />Worldwide
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { quote: "The structured paths and real projects made everything click. I landed my dream role as a product designer within 6 months.", name: "Sarah K.", role: "Product Designer", initials: "SK" },
                { quote: "Best balance of theory and hands-on learning. The curriculum is exactly what I needed to switch careers into tech.", name: "Marcus T.", role: "Software Developer", initials: "MT" },
                { quote: "Clear explanations, a great community, and content that actually keeps up with the industry. Worth every minute.", name: "Yuki L.", role: "Data Analyst", initials: "YL" },
              ].map((t) => (
                <div
                  key={t.name}
                  className="p-8 rounded-3xl border border-zinc-800/60 hover:border-orange-500/25 transition-all"
                  style={{ backgroundColor: "#111113" }}
                >
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-orange-400 text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-sm mb-8">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-6 border-t border-zinc-800/60">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black"
                      style={{ backgroundColor: `${primary}20`, color: primary }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-50">{t.name}</p>
                      <p className="text-[11px] text-zinc-600 uppercase tracking-[0.08em] font-semibold">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────── */}
        <section className="py-32">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid lg:grid-cols-[320px_1fr] gap-16">
              <div className="lg:sticky lg:top-32 h-fit">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
                  06 — FAQ
                </p>
                <h2
                  className="font-black leading-tight tracking-tight text-zinc-50"
                  style={{ fontSize: "clamp(28px, 3vw, 44px)" }}
                >
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  { q: "Do I need a background in math or programming?", a: "We have paths for complete beginners and for those with some experience. Our Math Foundation path covers the essentials, and we offer Python basics as part of the curriculum." },
                  { q: "Is there a free tier?", a: "Yes. You can create an account for free and access core lessons, the code playground, and community. Premium features include certificates and advanced projects." },
                  { q: "How long does a typical path take?", a: "Most learners complete a path in 2–4 months at 5–10 hours per week. You can go at your own pace; your progress is saved." },
                  { q: "Can I use this for my team or organization?", a: "We offer team and enterprise plans with admin dashboards, custom paths, and SSO. Contact us for pricing." },
                ].map((faq, i) => (
                  <div
                    key={faq.q}
                    className="p-7 rounded-3xl border border-zinc-800/60 hover:border-orange-500/25 transition-all group"
                    style={{ backgroundColor: "#111113" }}
                  >
                    <div className="flex items-start gap-5">
                      <span
                        className="text-[10px] font-black tabular-nums shrink-0 mt-1"
                        style={{ color: `${primary}60` }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-bold text-zinc-50 mb-3 group-hover:text-white transition-colors">{faq.q}</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────── */}
        <section className="pb-24 px-6">
          <div className="max-w-[1400px] mx-auto">
            <div
              className="relative rounded-[2rem] overflow-hidden p-12 md:p-20 text-center border border-orange-500/20"
              style={{ backgroundColor: "#0e0a06" }}
            >
              {/* Background texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,122,26,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,26,0.06) 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${primary}30 0%, transparent 60%)`,
                }}
              />

              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6" style={{ color: primary }}>
                  Get Started Today
                </p>
                <h2
                  className="font-black text-zinc-50 leading-tight tracking-tight mb-6"
                  style={{ fontSize: "clamp(36px, 5vw, 72px)" }}
                >
                  Ready to Level Up?
                </h2>
                <p className="text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
                  Join NeuraApp today and start learning across any discipline. Free to start—no credit card required.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-10 py-4 text-sm font-black uppercase tracking-[0.08em] text-zinc-950 rounded-2xl transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: primary,
                      boxShadow: `0 16px 40px -8px ${primary}80`,
                    }}
                  >
                    Get Started for Free
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-10 py-4 text-sm font-bold uppercase tracking-[0.08em] rounded-2xl border-2 border-zinc-700 text-zinc-300 hover:border-orange-500/50 hover:text-zinc-100 transition-all hover:-translate-y-0.5"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer
        className="border-t border-zinc-800/60 py-10"
        style={{ backgroundColor: "#08080a" }}
      >
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl" style={{ color: primary }}>psychology</span>
            <span className="font-display text-sm font-bold tracking-tight text-zinc-100">NeuraApp</span>
          </Link>
          <p className="text-xs text-zinc-700 font-semibold uppercase tracking-[0.1em]">
            © {new Date().getFullYear()} NeuraApp. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700 hover:text-zinc-400 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}