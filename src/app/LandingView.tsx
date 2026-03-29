"use client";

import Link from "next/link";
import Image from "next/image";

import { EmployerLogoMarquee } from "@/components/EmployerLogoMarquee";
import { primary } from "@/lib/theme";

const LOGO_SRC = "/logo.png";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=600&fit=crop";
const FEAT_1_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop";
const FEAT_2_IMAGE =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop";
const FEAT_3_IMAGE =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop";

export function LandingView() {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 antialiased"
      style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/50 border-b border-orange-500/15 shadow-[0_1px_0_rgba(255,122,26,0.06)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden bg-primary/10 border border-primary/20">
                <Image src={LOGO_SRC} alt="NeuraApp" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-100">NeuraApp</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-orange-400 transition-colors">
                Features
              </a>
              <a href="#paths" className="text-sm font-medium text-zinc-400 hover:text-orange-400 transition-colors">
                Paths
              </a>
              <a href="#curriculum" className="text-sm font-medium text-zinc-400 hover:text-orange-400 transition-colors">
                Curriculum
              </a>
              <a href="#testimonials" className="text-sm font-medium text-zinc-400 hover:text-orange-400 transition-colors">
                Testimonials
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-zinc-300 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:brightness-110 shadow-[0_8px_24px_-4px_rgba(255,122,26,0.55)]"
                style={{ backgroundColor: primary }}
              >
                Join for Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden hero-mesh-orange">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[120px] rounded-full pointer-events-none opacity-40"
            style={{ background: `radial-gradient(circle, ${primary} 0%, rgba(251, 146, 60, 0.4) 40%, transparent 70%)` }}
          />
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-6 text-center lg:text-left">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border w-fit mx-auto lg:mx-0 text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${primary}18`, borderColor: `${primary}40`, color: primary }}
                >
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  New Curriculum Live
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-zinc-50">
                  Master{" "}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(105deg, ${primary}, #fbbf24, ${primary})`,
                    }}
                  >
                    AI & Machine
                  </span>{" "}
                  Learning
                </h1>
                <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto lg:mx-0">
                  Elevate your career with cutting-edge courses, real-world projects, and a community of
                  experts. Build the future with our comprehensive learning platform.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 justify-center lg:justify-start">
                  <Link
                    href="/register"
                    className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_12px_40px_-8px_rgba(255,122,26,0.6)]"
                    style={{ backgroundColor: primary }}
                  >
                    Start Learning Now
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                  <a
                    href="#features"
                    className="w-full sm:w-auto px-8 py-4 text-base font-bold text-zinc-100 bg-zinc-900/80 border border-orange-500/25 hover:bg-orange-500/10 hover:border-orange-500/40 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-orange-400/90">play_circle</span>
                    View Demo
                  </a>
                </div>
              </div>
              <div className="relative w-full aspect-square max-w-[600px] mx-auto hidden lg:block">
                <div
                  className="absolute inset-0 rounded-full blur-3xl mix-blend-screen opacity-50"
                  style={{
                    background: `linear-gradient(to top right, ${primary}55, rgba(251, 191, 36, 0.25))`,
                  }}
                />
                <img
                  src={HERO_IMAGE}
                  alt="AI and machine learning visualization"
                  className="w-full h-full object-cover rounded-[3rem] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] border border-orange-500/20 relative z-10 p-2 bg-zinc-900/50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Placements: company logos marquee */}
        <EmployerLogoMarquee />

        {/* Stats Section */}
        <section className="py-12 bg-black/60 border-y border-orange-500/10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <p className="text-4xl font-black text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, #fbbf24)` }}>
                  2K+
                </p>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                  Active Students
                </p>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <p className="text-4xl font-black text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, #fbbf24)` }}>
                  500+
                </p>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                  Curated Courses
                </p>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <p className="text-4xl font-black text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, #fbbf24)` }}>
                  2M+
                </p>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                  Models Trained
                </p>
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <p className="text-4xl font-black text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${primary}, #fbbf24)` }}>
                  4.9/5
                </p>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                  Average Rating
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24" id="features">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-zinc-50">
                Built for Deep Learning
              </h2>
              <p className="text-lg text-zinc-400">
                Discover a platform engineered specifically to help you understand complex AI concepts
                through hands-on practice and world-class instruction.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-5 p-6 rounded-2xl bg-zinc-900/40 border border-orange-500/10 hover:border-orange-500/35 hover:shadow-[0_0_40px_-12px_rgba(255,122,26,0.2)] transition-all duration-300 group">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${primary}18`, color: primary }}
                >
                  <span className="material-symbols-outlined text-3xl">smart_display</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-50">Video Lessons</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    High-quality, bite-sized video lessons from industry experts. Learn the theory behind
                    the magic.
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-orange-500/10">
                  <img
                    src={FEAT_1_IMAGE}
                    alt="Video lessons"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-5 p-6 rounded-2xl bg-zinc-900/40 border border-orange-500/10 hover:border-orange-500/35 hover:shadow-[0_0_40px_-12px_rgba(255,122,26,0.2)] transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                    style={{ backgroundColor: `${primary}18`, borderColor: `${primary}40`, color: primary }}
                  >
                    Popular
                  </span>
                </div>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${primary}18`, color: primary }}
                >
                  <span className="material-symbols-outlined text-3xl">terminal</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-50">Code Playgrounds</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Interactive coding environments to practice training models right in your browser. Zero
                    setup required.
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-orange-500/10">
                  <img
                    src={FEAT_2_IMAGE}
                    alt="Code playground"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-5 p-6 rounded-2xl bg-zinc-900/40 border border-orange-500/10 hover:border-orange-500/35 hover:shadow-[0_0_40px_-12px_rgba(255,122,26,0.2)] transition-all duration-300 group">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${primary}18`, color: primary }}
                >
                  <span className="material-symbols-outlined text-3xl">article</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-50">Research Feeds</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Stay up-to-date with the latest academic papers and industry trends. Curated summaries
                    sent directly to you.
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-orange-500/10">
                  <img
                    src={FEAT_3_IMAGE}
                    alt="Research and data"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Paths */}
        <section className="py-24 bg-black/40 border-y border-orange-500/10" id="paths">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-zinc-50">
                Choose Your Learning Path
              </h2>
              <p className="text-lg text-zinc-400">
                Structured roadmaps from fundamentals to advanced. Pick a path and follow step-by-step
                modules with projects and assessments.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: "psychology", title: "AI & Machine Learning", desc: "Neural networks, deep learning, NLP, and computer vision. From theory to production.", color: primary },
                { icon: "code", title: "Software Development", desc: "Full-stack, DevOps, and cloud. Build the skills that power AI applications.", color: "#fb923c" },
                { icon: "calculate", title: "Math Foundation", desc: "Linear algebra, calculus, and statistics. The math behind every model.", color: "#ea580c" },
              ].map((path) => (
                <div
                  key={path.title}
                  className="p-6 rounded-2xl bg-zinc-900/50 border border-orange-500/10 hover:border-orange-500/30 transition-all group"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${path.color}18`, color: path.color }}
                  >
                    <span className="material-symbols-outlined text-3xl">{path.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-50">{path.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{path.desc}</p>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold hover:opacity-80"
                    style={{ color: path.color }}
                  >
                    Start path <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="py-24" id="curriculum">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-zinc-50">
                Comprehensive Curriculum
              </h2>
              <p className="text-lg text-zinc-400">
                From basics to state-of-the-art. Each module includes theory, code labs, and real-world
                projects.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                "Python for ML",
                "Linear Algebra",
                "Calculus & Optimization",
                "Statistics & Probability",
                "Neural Networks",
                "Deep Learning",
                "NLP & Transformers",
                "Computer Vision",
                "Reinforcement Learning",
                "MLOps & Deployment",
                "Ethics in AI",
                "Capstone Projects",
              ].map((topic) => (
                <div
                  key={topic}
                  className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/40 border border-orange-500/10 hover:border-orange-500/35 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl text-orange-500/70">check_circle</span>
                  <span className="font-medium text-zinc-100">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-black/40 border-y border-orange-500/10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-zinc-50">
                How It Works
              </h2>
              <p className="text-lg text-zinc-400">
                Get started in minutes. No credit card required.
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "1", icon: "person_add", title: "Create account", desc: "Sign up free and pick your learning path." },
                { step: "2", icon: "menu_book", title: "Learn", desc: "Watch lessons, run code in the browser, and complete exercises." },
                { step: "3", icon: "code", title: "Build", desc: "Apply skills in projects and use our model hub." },
                { step: "4", icon: "workspace_premium", title: "Get certified", desc: "Earn certificates and share your progress." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${primary}18`, color: primary }}
                    >
                      <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                    </div>
                    <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: primary }}>{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-zinc-50">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24" id="testimonials">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-zinc-50">
                Loved by Learners Worldwide
              </h2>
              <p className="text-lg text-zinc-400">
                Join thousands who have leveled up their AI and ML skills with NeuraApp.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { quote: "The playground and real projects made everything click. I landed an ML engineer role within 6 months.", name: "Sarah K.", role: "ML Engineer" },
                { quote: "Best balance of theory and hands-on. The curriculum is exactly what I needed to switch from web dev to AI.", name: "Marcus T.", role: "Software Developer" },
                { quote: "Clear explanations and a supportive community. I finally understand transformers and attention.", name: "Yuki L.", role: "Research Student" },
              ].map((t) => (
                <div key={t.name} className="p-6 rounded-2xl bg-zinc-900/50 border border-orange-500/10 hover:border-orange-500/25 transition-colors">
                  <p className="text-zinc-300 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <p className="font-semibold text-zinc-50">{t.name}</p>
                  <p className="text-sm text-zinc-500">{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-black/40 border-y border-orange-500/10">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-zinc-50">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "Do I need a background in math or programming?", a: "We have paths for complete beginners and for those with some experience. Our Math Foundation path covers the essentials, and we offer Python basics as part of the curriculum." },
                { q: "Is there a free tier?", a: "Yes. You can create an account for free and access core lessons, the code playground, and community. Premium features include certificates and advanced projects." },
                { q: "How long does a typical path take?", a: "Most learners complete a path in 2–4 months at 5–10 hours per week. You can go at your own pace; your progress is saved." },
                { q: "Can I use this for my team or organization?", a: "We offer team and enterprise plans with admin dashboards, custom paths, and SSO. Contact us for pricing." },
              ].map((faq) => (
                <div key={faq.q} className="p-5 rounded-xl bg-zinc-900/50 border border-orange-500/10">
                  <h3 className="font-bold text-zinc-50 mb-2">{faq.q}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden border border-orange-500/20 bg-linear-to-br from-zinc-900/90 via-black to-zinc-950 shadow-[0_0_80px_-20px_rgba(255,122,26,0.25)]">
              <div
                className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(circle at 50% 40%, ${primary}50, transparent 65%)` }}
              />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-zinc-50">
                  Ready to Master AI?
                </h2>
                <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
                  Join NeuraApp today. Free to start — no credit card required.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_12px_40px_-8px_rgba(255,122,26,0.55)]"
                    style={{ backgroundColor: primary }}
                  >
                    Get Started for Free
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-xl border-2 border-orange-500/30 text-zinc-200 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-orange-500/15 pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl" style={{ color: primary }}>
                psychology
              </span>
              <span className="text-xl font-bold tracking-tight text-zinc-100">NeuraApp</span>
            </Link>
            <p className="text-sm text-zinc-500 text-center md:text-left">
              © {new Date().getFullYear()} NeuraApp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
