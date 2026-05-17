"use client";

import {
  useState,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import Image from "next/image";

const LOGO_SRC = "/logo.png";
const primary = "#FF6B00";
const primaryLight = "#FF8C35";

type BtnVariant = "primary" | "ghost" | "outline";

function BrandLogo({ size = 36, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        width: size,
        height: size,
        borderRadius: size > 32 ? 8 : 6,
        overflow: "hidden",
        background: "rgba(255,107,0,0.08)",
        border: "1px solid rgba(255,107,0,0.25)",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Image
        src={LOGO_SRC}
        alt="NeuraApp"
        width={size}
        height={size}
        style={{ objectFit: "contain" }}
        priority={priority}
      />
    </span>
  );
}

const PATHWAYS = [
  { icon: "⬡", title: "Development", desc: "Master modern frameworks, systems architecture, and algorithmic design." },
  { icon: "◈", title: "Design Systems", desc: "Construct scalable visual languages and deep behavioral psychology." },
  { icon: "⬢", title: "Data Science", desc: "Neural network modeling, statistical analysis, and predictive metrics." },
];

const CURRICULUM = [
  { name: "Python & Programming", cat: "Tech" },
  { name: "Web Development", cat: "Tech" },
  { name: "AI & Machine Learning", cat: "AI" },
  { name: "Data Science", cat: "Data" },
  { name: "UI/UX Design", cat: "Design" },
  { name: "Digital Marketing", cat: "Business" },
  { name: "Cloud & DevOps", cat: "Tech" },
  { name: "Cybersecurity", cat: "Security" },
  { name: "Business Strategy", cat: "Business" },
  { name: "Finance & Accounting", cat: "Finance" },
  { name: "Content Creation", cat: "Creative" },
  { name: "Capstone Projects", cat: "Core" },
];

const PROCESS = [
  { num: "01", title: "Create Account", desc: "Sign up free and pick your learning path." },
  { num: "02", title: "Learn", desc: "Watch lessons, run code, and complete exercises." },
  { num: "03", title: "Build", desc: "Apply skills on real projects. Build a portfolio that speaks for itself." },
  { num: "04", title: "Get Certified", desc: "Earn certificates and share your progress with the world." },
];

const FEATURES = [
  { icon: "◎", title: "Personalized Pathing", desc: "Learning sequence based on goals, pace, and skills you actually need next." },
  { icon: "▷", title: "Hands-on Labs", desc: "Run structured exercises that turn concepts into working intuition." },
  { icon: "◈", title: "Project-First Outcomes", desc: "Ship portfolio-ready work as you progress, not just passive content." },
  { icon: "⟳", title: "Consistency Design", desc: "Streaks, reminders, and progress signals keep you moving without burnout." },
  { icon: "✦", title: "Verified Certificates", desc: "Track milestones and receive credible proof of completion." },
  { icon: "⬡", title: "AI Support", desc: "In-context help to debug, learn faster, and break through blockers." },
];

const PRICING = [
  {
    name: "Starter", price: "$0", period: "", subtitle: "Try the platform", highlight: false, cta: "Start free",
    bullets: ["Core lessons", "Limited practice sets", "Community access", "Basic progress tracking"],
  },
  {
    name: "Pro", price: "$19", period: "/mo", subtitle: "For serious learners", highlight: true, cta: "Go Pro",
    bullets: ["Full curriculum", "Unlimited practice", "Projects + portfolio guidance", "AI learning support"],
  },
  {
    name: "Team", price: "$49", period: "/mo", subtitle: "For cohorts & organizations", highlight: false, cta: "Talk to us",
    bullets: ["Cohort dashboards", "Mentor workflows", "Centralized reporting", "Priority support"],
  },
];

const TESTIMONIALS = [
  { quote: "The structured paths and real projects made everything click. I landed my dream role as a product designer within 6 months.", name: "Sarah K.", role: "Product Designer", initials: "SK" },
  { quote: "Best balance of theory and hands-on learning. The curriculum is exactly what I needed to switch careers into tech.", name: "Marcus T.", role: "Software Developer", initials: "MT" },
  { quote: "Clear explanations, great community, and content that actually keeps up with the industry. Worth every minute.", name: "Yuki L.", role: "Data Analyst", initials: "YL" },
];

const STATS = [
  { value: "12k+", label: "Active Learners" },
  { value: "180+", label: "Modules" },
  { value: "4.8★", label: "Satisfaction" },
  { value: "50+", label: "Practice Sets" },
];

const FAQ = [
  { q: "Do I need a background in math or programming?", a: "No. Paths start from foundations and ramp up. You can begin with beginner-friendly modules and add depth only when your goals require it." },
  { q: "Is there a free tier?", a: "Yes. The Starter plan includes core lessons, limited practice, community access, and basic progress tracking so you can validate the experience before upgrading." },
  { q: "How long does a typical path take?", a: "It depends on your weekly rhythm and goal. Casual learners spread a track over several months; intensive learners can compress similar material into weeks." },
  { q: "What makes NeuraApp different from random tutorials?", a: "Curriculum sequencing, hands-on labs, portfolio-ready projects, and progress signals in one place — so you spend time learning instead of hunting for what to do next." },
];

function useInView(threshold = 0.15): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`
    }}>{children}</div>
  );
}

function GlowOrb({
  x,
  y,
  size,
  opacity = 0.12,
}: {
  x: string;
  y: string;
  size: string;
  opacity?: number;
}) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: size, height: size,
      borderRadius: "50%", background: `radial-gradient(circle, ${primary}${Math.round(opacity * 255).toString(16).padStart(2,"0")} 0%, transparent 70%)`,
      pointerEvents: "none", zIndex: 0
    }} />
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "rgba(255,107,0,0.12)", border: "1px solid rgba(255,107,0,0.3)",
      color: "#FF8C35", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
      padding: "5px 14px", borderRadius: 100, textTransform: "uppercase"
    }}>{children}</span>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} style={{
      color: "#999", fontSize: 13, fontWeight: 500, textDecoration: "none",
      transition: "color 0.2s", letterSpacing: "0.01em"
    }}
    onMouseEnter={(e) => { e.currentTarget.style.color = "#FF8C35"; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = "#999"; }}>
      {children}
    </a>
  );
}

function Btn({
  href,
  children,
  variant = "primary",
  style: extraStyle = {},
}: {
  href?: string;
  children: ReactNode;
  variant?: BtnVariant;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "13px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14,
    textDecoration: "none", cursor: "pointer", border: "none",
    transition: "all 0.2s", letterSpacing: "0.01em", ...extraStyle
  };
  const styles: Record<BtnVariant, CSSProperties> = {
    primary: { background: primary, color: "#000" },
    ghost: { background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" },
    outline: { background: "transparent", color: primary, border: `1px solid ${primary}` },
  };
  return (
    <a href={href || "#"} style={{ ...base, ...styles[variant] }}
      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {children}
    </a>
  );
}

function GlassCard({
  children,
  style: s = {},
  highlight = false,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: highlight ? "rgba(255,107,0,0.05)" : "rgba(255,255,255,0.02)",
        border: highlight ? "1px solid rgba(255,107,0,0.4)" : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        backdropFilter: "blur(12px)",
        transition: "border-color 0.3s",
        ...s,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ num, text }: { num: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ color: primary, fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>{num}</span>
      <div style={{ width: 32, height: 1, background: "rgba(255,107,0,0.4)" }} />
      <span style={{ color: "#FF8C35", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>{text}</span>
    </div>
  );
}

export default function LandingView() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const t = TESTIMONIALS[activeTestimonial];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#E8E6E0", fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        .nav-blur { background: rgba(8,8,8,0.82) !important; backdrop-filter: blur(20px) !important; }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { display: flex; animation: marquee 28s linear infinite; width: max-content; }
        .marquee-track:hover { animation-play-state: paused; }
        .card-hover:hover { border-color: rgba(255,107,0,0.4) !important; transform: translateY(-3px); }
        .card-hover { transition: border-color 0.3s, transform 0.3s; }
        .gradient-text { background: linear-gradient(135deg, #FF6B00, #FF9A4D, #FFD580); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stat-num { font-family: 'Space Grotesk', monospace; }
        .grid-line { background-image: linear-gradient(rgba(255,107,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.04) 1px, transparent 1px); background-size: 60px 60px; }
      `}</style>

      {/* NAV */}
      <header
        className={scrolled ? "nav-blur" : ""}
        style={{
        position: "fixed", inset: "0 0 auto 0", zIndex: 100,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 20px",
        background: scrolled ? undefined : "rgba(8,8,8,0.6)",
        transition: "background 0.25s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandLogo size={36} priority />
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#fff" }}>NeuraApp</span>
          </div>
          <nav className="hidden md:flex" style={{ gap: 28, alignItems: "center" }}>
            {[["#roadmap","Pathways"],["#curriculum","Curriculum"],["#features","Features"],["#pricing","Pricing"]].map(([h,l]) => (
              <NavLink key={h} href={h}>{l}</NavLink>
            ))}
          </nav>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/login" style={{ color: "#aaa", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Log in</a>
            <Btn href="/register" style={{ padding: "9px 20px", fontSize: 13 }}>Get Started →</Btn>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: 64 }}>

        {/* HERO */}
        <section className="grid-line" style={{ position: "relative", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "80px 40px" }}>
          <GlowOrb x="10%" y="20%" size="600px" opacity={0.08} />
          <GlowOrb x="60%" y="60%" size="500px" opacity={0.06} />
          {/* Rotating ring */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: 700, height: 700, borderRadius: "50%", border: "1px solid rgba(255,107,0,0.06)", animation: "spin-slow 40s linear infinite" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "1px dashed rgba(255,107,0,0.04)", transform: "scale(0.75)" }} />
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 1, maxWidth: 860, textAlign: "center" }}>
            <FadeIn>
              <Tag>⚡ Intelligence in Motion</Tag>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 style={{ fontSize: "clamp(48px, 7vw, 88px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#fff", margin: "28px 0 0" }}>
                Learn Any Skill
                <br />
                <span className="gradient-text">Your Way.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p style={{ fontSize: 18, color: "#888", lineHeight: 1.7, maxWidth: 560, margin: "24px auto 0" }}>
                Accelerate your growth with personalized learning paths, hands-on labs, and real portfolio projects.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
                <Btn href="/register">Start Your Journey →</Btn>
                <Btn href="#platform" variant="ghost">▷ See How It Works</Btn>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 64, flexWrap: "wrap" }}>
                {STATS.map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div className="stat-num" style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 4, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* PATHWAYS */}
        <section id="roadmap" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <SectionLabel num="01" text="Pathways" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
              <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1 }}>
                Choose Your<br />Cognitive Domain
              </h2>
              <p style={{ color: "#666", fontSize: 15, maxWidth: 320, lineHeight: 1.7 }}>Select a pathway and get a sequenced roadmap built around your goals.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {PATHWAYS.map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.1}>
                <GlassCard className="card-hover" style={{ padding: "36px 32px", height: "100%", position: "relative", overflow: "hidden", cursor: "pointer" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle at top right, rgba(255,107,0,0.08), transparent)`, pointerEvents: "none" }} />
                  <div style={{ fontSize: 40, marginBottom: 20, color: primary, lineHeight: 1 }}>{p.icon}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: "-0.01em" }}>{p.title}</h3>
                  <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>{p.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: primary, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Explore Path <span style={{ fontSize: 16 }}>→</span>
                  </div>
                </GlassCard>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* MARQUEE */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "20px 0", overflow: "hidden", background: "rgba(255,107,0,0.02)" }}>
          <div className="marquee-track">
            {[...CURRICULUM, ...CURRICULUM].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, padding: "0 32px", whiteSpace: "nowrap" }}>
                <span style={{ color: "#444", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{c.cat}</span>
                <span style={{ color: "#888", fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                <span style={{ color: "rgba(255,107,0,0.4)", fontSize: 8 }}>◆</span>
              </div>
            ))}
          </div>
        </div>

        {/* CURRICULUM */}
        <section id="curriculum" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <SectionLabel num="02" text="Curriculum" />
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
                Comprehensive<br />Curriculum
              </h2>
              <p style={{ color: "#666", fontSize: 15, maxWidth: 420, lineHeight: 1.7 }}>Spanning tech, design, business, and beyond. Every track includes theory, hands-on labs, and real-world projects.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {CURRICULUM.map((topic, i) => (
              <FadeIn key={topic.name} delay={i * 0.04}>
                <div className="card-hover" style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer"
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,107,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: primary, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{topic.name}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{topic.cat}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="platform" style={{ padding: "100px 40px", background: "rgba(255,107,0,0.02)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: 64 }}>
                <SectionLabel num="03" text="Process" />
                <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1 }}>How It Works</h2>
              </div>
            </FadeIn>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 0 }}>
              {PROCESS.map((step, i) => (
                <FadeIn key={step.title} delay={i * 0.1}>
                  <div style={{ padding: "32px 28px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none", position: "relative" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, border: "1px solid rgba(255,107,0,0.3)",
                      background: "rgba(255,107,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: primary, marginBottom: 24, fontFamily: "'Space Grotesk', monospace"
                    }}>{step.num}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.01em" }}>{step.title}</h3>
                    <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7 }}>{step.desc}</p>
                    {i < 3 && <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,107,0,0.3)", fontSize: 20, display: "none" }}>→</div>}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <SectionLabel num="04" text="Why NeuraApp" />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
                Built for Outcomes,<br />Not Just Content
              </h2>
              <p style={{ color: "#666", fontSize: 15, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>A learning experience designed to keep momentum high and results visible.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <GlassCard className="card-hover" style={{ padding: "28px 28px" }}>
                  <div style={{ fontSize: 28, color: primary, marginBottom: 16, lineHeight: 1 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.01em" }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7 }}>{f.desc}</p>
                </GlassCard>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ padding: "80px 40px", background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            <FadeIn>
              <SectionLabel num="05" text="Community" />
              <div style={{ position: "relative", minHeight: 180 }}>
                <p style={{ fontSize: "clamp(18px, 2.5vw, 24px)", color: "#ccc", lineHeight: 1.6, fontStyle: "italic", marginBottom: 32, transition: "opacity 0.4s" }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#000" }}>{t.initials}</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{t.name}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>{t.role}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 32 }}>
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setActiveTestimonial(i)} style={{
                    width: i === activeTestimonial ? 28 : 8, height: 8, borderRadius: 4,
                    background: i === activeTestimonial ? primary : "rgba(255,255,255,0.15)",
                    border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0
                  }} />
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <SectionLabel num="06" text="Pricing" />
              <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
                Choose Your Plan
              </h2>
              <p style={{ color: "#666", fontSize: 15, lineHeight: 1.7 }}>Start free. Upgrade when you're ready.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, alignItems: "start" }}>
            {PRICING.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.1}>
                <GlassCard highlight={p.highlight} style={{ padding: "36px 28px", position: "relative", overflow: "hidden" }}>
                  {p.highlight && (
                    <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,107,0,0.15)", color: primary, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, border: "1px solid rgba(255,107,0,0.3)" }}>Popular</div>
                  )}
                  {p.highlight && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${primary}, ${primaryLight})` }} />}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#666", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>{p.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                      <span className="stat-num" style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{p.price}</span>
                      <span style={{ color: "#555", fontSize: 14 }}>{p.period}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#555" }}>{p.subtitle}</div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, marginBottom: 28 }}>
                    {p.bullets.map(b => (
                      <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                        <span style={{ color: primary, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                  <Btn href="/register" variant={p.highlight ? "primary" : "ghost"} style={{ width: "100%", justifyContent: "center" }}>
                    {p.cta}
                  </Btn>
                </GlassCard>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "80px 40px", maxWidth: 800, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <SectionLabel num="07" text="FAQ" />
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1 }}>Questions, Answered</h2>
            </div>
          </FadeIn>
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <FadeIn key={item.q} delay={i * 0.05}>
                  <div style={{ borderBottom: i < FAQ.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <button onClick={() => setOpenFaq(open ? null : i)} style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "22px 28px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16
                    }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <span style={{ color: primary, fontSize: 11, fontWeight: 800, fontFamily: "'Space Grotesk', monospace", flexShrink: 0 }}>{String(i+1).padStart(2,"0")}</span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: open ? "#FF8C35" : "#ddd", lineHeight: 1.4 }}>{item.q}</span>
                      </div>
                      <span style={{ color: open ? primary : "#444", fontSize: 22, lineHeight: 1, flexShrink: 0, transition: "transform 0.3s", transform: open ? "rotate(45deg)" : "none" }}>+</span>
                    </button>
                    {open && (
                      <div style={{ padding: "0 28px 22px 56px", background: "rgba(255,255,255,0.01)" }}>
                        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "80px 40px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <FadeIn>
              <div style={{
                background: "linear-gradient(135deg, rgba(255,107,0,0.12) 0%, rgba(255,107,0,0.03) 50%, rgba(255,107,0,0.08) 100%)",
                border: "1px solid rgba(255,107,0,0.25)", borderRadius: 24, padding: "64px 56px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap",
                position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${primary}, transparent)` }} />
                <GlowOrb x="-100px" y="-100px" size="400px" opacity={0.1} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
                    Ready to <span className="gradient-text">Level Up?</span>
                  </h2>
                  <p style={{ fontSize: 16, color: "#777", maxWidth: 440, lineHeight: 1.6 }}>
                    Join NeuraApp today and start learning across any discipline. Free to start — no credit card required.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", position: "relative", zIndex: 1 }}>
                  <Btn href="/register" style={{ fontSize: 15, padding: "15px 36px" }}>Get Started for Free →</Btn>
                  <a href="/login" style={{ color: "#555", fontSize: 13, textDecoration: "none" }}>Already have an account? Sign in</a>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "36px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandLogo size={28} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#888" }}>NeuraApp</span>
            <span style={{ color: "#333", fontSize: 12, marginLeft: 16 }}>© {new Date().getFullYear()} NeuraApp. All rights reserved.</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} href="#" style={{ color: "#444", fontSize: 12, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}