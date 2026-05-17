"use client";

import { AuthFlowBackground } from "@/components/auth/AuthFlowBackground";
import { getPublicApiUrl } from "@/lib/publicUrl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { primary } from "@/lib/theme";

const LOGO_SRC = "/logo.png";
const ACTIVE_AVATARS = [
  "https://i.pravatar.cc/80?img=12",
  "https://i.pravatar.cc/80?img=32",
  "https://i.pravatar.cc/80?img=47",
] as const;
const bgDark = "#030303";

type Audience = "student" | "professional";

type TimeCommitment = "few_hours_week" | "many_hours_week" | "intensive";

const TIME_OPTIONS: { id: TimeCommitment; title: string; subtitle: string; icon: string }[] = [
  { id: "few_hours_week", title: "A few hours / week", subtitle: "Steady pace alongside school or work", icon: "schedule" },
  { id: "many_hours_week", title: "Several hours / week", subtitle: "Serious progress with consistent blocks", icon: "trending_up" },
  { id: "intensive", title: "Intensive sprint", subtitle: "Bootcamp-style focus for a limited period", icon: "bolt" },
];

const LEARNING_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const INTERESTS_STUDENT = [
  "Machine Learning fundamentals",
  "Deep Learning",
  "Computer Vision",
  "NLP",
  "Data Science",
  "MLOps basics",
  "Python for AI",
  "Math for ML",
] as const;

const INTERESTS_PROFESSIONAL = [
  "LLMs & prompt engineering",
  "RAG & vector search",
  "Model evaluation",
  "MLOps & deployment",
  "System design for AI",
  "Security & compliance",
  "Team upskilling",
  "Interview prep",
] as const;

const GOALS_STUDENT = [
  { id: "grades", title: "Ace coursework", subtitle: "Projects, labs, and exams", icon: "school" },
  { id: "portfolio", title: "Build portfolio", subtitle: "Ship projects recruiters notice", icon: "folder_special" },
  { id: "research", title: "Research track", subtitle: "Papers, experiments, and depth", icon: "science" },
  { id: "explore", title: "Explore AI broadly", subtitle: "Find the niche you love", icon: "travel_explore" },
] as const;

const GOALS_PROFESSIONAL = [
  { id: "pivot", title: "Career pivot into AI", subtitle: "Structured path into ML roles", icon: "swap_horiz" },
  { id: "upskill", title: "Upskill in current role", subtitle: "Ship AI features with confidence", icon: "workspace_premium" },
  { id: "lead", title: "Lead AI initiatives", subtitle: "Architecture, reviews, and delivery", icon: "groups" },
  { id: "interview", title: "Interview readiness", subtitle: "DSA + ML system design", icon: "quiz" },
] as const;

const DEFAULT_STUDENT_INTERESTS = ["Machine Learning fundamentals", "Python for AI"] as const;
const DEFAULT_PRO_INTERESTS = ["LLMs & prompt engineering", "MLOps & deployment"] as const;

function levelToExperience(level: string): "beginner" | "intermediate" | "advanced" {
  const l = level.toLowerCase();
  if (l === "beginner") return "beginner";
  if (l === "advanced") return "advanced";
  return "intermediate";
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [audience, setAudience] = useState<Audience | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [learningLevel, setLearningLevel] = useState("");

  const [timeCommitment, setTimeCommitment] = useState<TimeCommitment | null>(null);
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const interestPool = useMemo(
    () => (audience === "professional" ? INTERESTS_PROFESSIONAL : INTERESTS_STUDENT),
    [audience]
  );

  const goalPool = useMemo(
    () => (audience === "professional" ? GOALS_PROFESSIONAL : GOALS_STUDENT),
    [audience]
  );

  function setAudienceAndInit(a: Audience) {
    setAudience(a);
    setInterests(new Set(a === "professional" ? DEFAULT_PRO_INTERESTS : DEFAULT_STUDENT_INTERESTS));
    setSelectedGoalId(a === "professional" ? "upskill" : "portfolio");
    setLearningLevel("");
    setTimeCommitment(null);
    setError("");
    setStep(2);
  }

  function toggleInterest(name: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setStep(3);
  }

  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!learningLevel) {
      setError(audience === "professional" ? "Select your experience level." : "Select your learning level.");
      return;
    }
    if (!timeCommitment) {
      setError("Pick how much time you can commit each week.");
      return;
    }
    if (interests.size === 0) {
      setError("Select at least one focus area.");
      return;
    }
    const goal = goalPool.find((g) => g.id === selectedGoalId);
    if (!goal) {
      setError("Select a learning goal.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          learning_level: learningLevel,
          interests: Array.from(interests),
          learning_goals: [goal.title],
          primary_focus: audience === "professional" ? "Professional" : "Student",
          secondary_focus: null,
          time_commitment: timeCommitment,
          experience_level: levelToExperience(learningLevel),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { detail?: string; message?: string }).detail || (data as { message?: string }).message || "Registration failed.");
        return;
      }
      if ((data as { access_key?: string }).access_key != null) {
        router.push("/login?registered=1");
        return;
      }
      router.push("/login");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stepMeta = useMemo(() => {
    if (step === 1) return { label: "Path", title: "Choose your path", pct: "33%" };
    if (step === 2) return { label: "Account", title: "Create your account", pct: "66%" };
    return { label: "Plan", title: audience === "professional" ? "Shape your professional plan" : "Shape your learning plan", pct: "100%" };
  }, [step, audience]);

  return (
    <div className="min-h-screen flex overflow-x-hidden overflow-y-auto relative text-zinc-100 font-sans">
      <AuthFlowBackground />

      <div className="hidden lg:flex lg:w-1/2 relative z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, ${bgDark} 0%, ${bgDark}e8 35%, ${bgDark}99 55%, transparent 100%)`,
          }}
        />
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
        <div className="absolute top-10 left-10 flex items-center gap-3 z-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border backdrop-blur-md overflow-hidden bg-white/10"
            style={{ borderColor: `${primary}40` }}
          >
            <Image src={LOGO_SRC} alt="NeuraApp" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">NeuraApp</span>
        </div>
        <div className="absolute bottom-20 left-10 right-20 z-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400/80 mb-3">Structured onboarding</p>
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Built for <span className="text-orange-300">students</span>
            <br />
            and <span className="text-orange-300">professionals</span>
          </h2>
          <p className="text-zinc-300 text-lg max-w-md leading-relaxed">
            A guided signup that adapts to your goals—so your dashboard, recommendations, and pace feel right from day one.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-3">
              {ACTIVE_AVATARS.map((src, idx) => (
                <div
                  key={src}
                  className="w-10 h-10 rounded-full border-2 overflow-hidden bg-zinc-700"
                  style={{ borderColor: bgDark }}
                  title={`Learner ${idx + 1}`}
                >
                  <img src={src} alt={`Learner ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
              <div
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white bg-zinc-700"
                style={{ borderColor: bgDark }}
              >
                +2k
              </div>
            </div>
            <span className="text-sm font-medium text-zinc-400">Learners on NeuraApp</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-dvh">
        <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-black/60 via-transparent to-black/50" />
        <div className="w-full max-w-[480px] relative z-10">
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/30 bg-primary/10 overflow-hidden">
              <Image src={LOGO_SRC} alt="NeuraApp" width={32} height={32} className="object-contain" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">NeuraApp</span>
          </div>

          <div className="rounded-3xl border border-orange-500/20 bg-zinc-950/90 p-8 sm:p-10 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
            {/* Step rail */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-3">
                {(["Path", "Account", "Plan"] as const).map((label, idx) => {
                  const n = idx + 1;
                  const active = step >= n;
                  const current = step === n;
                  return (
                    <div key={label} className="flex flex-1 flex-col items-center gap-2 min-w-0">
                      <div
                        className={[
                          "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black transition-all",
                          current
                            ? "border-orange-400/70 bg-orange-500/15 text-orange-200 shadow-[0_0_24px_-4px_rgba(255,122,26,0.55)]"
                            : active
                              ? "border-orange-500/35 bg-orange-500/10 text-orange-200"
                              : "border-zinc-700 bg-black/40 text-zinc-500",
                        ].join(" ")}
                      >
                        {n}
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${current ? "text-orange-200" : "text-zinc-500"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: stepMeta.pct, backgroundColor: primary }}
                />
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400/80 mb-2">{stepMeta.label}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight leading-tight">{stepMeta.title}</h1>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                {step === 1 && "Pick the journey that matches how you’ll use NeuraApp—we’ll tailor the next steps."}
                {step === 2 && "We’ll send your secure access key to this email after you finish."}
                {step === 3 && (audience === "professional" ? "Tell us your pace and focus so we can align content with your work context." : "Tell us your pace and interests so we can align content with your studies.")}
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAudienceAndInit("student")}
                  className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-linear-to-br from-zinc-900/80 to-black/60 p-6 text-left transition-all hover:border-orange-400/45 hover:shadow-[0_16px_48px_-20px_rgba(255,122,26,0.35)]"
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20" />
                  <div className="relative z-10">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 ring-1 ring-orange-500/30">
                      <span className="material-symbols-outlined text-2xl text-orange-300">school</span>
                    </div>
                    <h2 className="text-lg font-bold text-zinc-50">Student</h2>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                      Coursework, portfolio projects, and fundamentals—with a pace that fits your semester.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300">
                      Continue
                      <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceAndInit("professional")}
                  className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-linear-to-br from-zinc-900/80 to-black/60 p-6 text-left transition-all hover:border-orange-400/45 hover:shadow-[0_16px_48px_-20px_rgba(255,122,26,0.35)]"
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20" />
                  <div className="relative z-10">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 ring-1 ring-orange-500/30">
                      <span className="material-symbols-outlined text-2xl text-orange-300">work</span>
                    </div>
                    <h2 className="text-lg font-bold text-zinc-50">Professional</h2>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                      Upskilling, production ML, and leadership—with language tuned to your workplace outcomes.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300">
                      Continue
                      <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full name</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="block w-full rounded-2xl border border-orange-500/15 bg-black/40 py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 transition-all focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full rounded-2xl border border-orange-500/15 bg-black/40 py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 transition-all focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setAudience(null);
                      setError("");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/40 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-black shadow-[0_12px_40px_-12px_rgba(255,122,26,0.65)] transition-all active:scale-[0.99] sm:min-w-[200px]"
                    style={{ backgroundColor: primary }}
                  >
                    Continue
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </button>
                </div>
              </form>
            )}

            {step === 3 && audience && (
              <form onSubmit={handleStep3Submit} className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                    {audience === "professional" ? "Experience level" : "Learning level"}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {LEARNING_LEVELS.map((level) => {
                      const selected = learningLevel === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setLearningLevel(level)}
                          className={[
                            "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                            selected
                              ? "border-orange-400/60 bg-orange-500/10 text-orange-100 shadow-[0_0_0_1px_rgba(255,122,26,0.25)]"
                              : "border-zinc-700 bg-black/30 text-zinc-300 hover:border-zinc-600",
                          ].join(" ")}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">Weekly rhythm</h3>
                  <div className="space-y-2">
                    {TIME_OPTIONS.map((opt) => {
                      const selected = timeCommitment === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setTimeCommitment(opt.id)}
                          className={[
                            "flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all",
                            selected
                              ? "border-orange-400/55 bg-orange-500/10"
                              : "border-zinc-700 bg-black/25 hover:border-zinc-600",
                          ].join(" ")}
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-700">
                            <span className="material-symbols-outlined text-zinc-300">{opt.icon}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-zinc-50">{opt.title}</p>
                            <p className="text-xs text-zinc-500">{opt.subtitle}</p>
                          </div>
                          <div
                            className="h-5 w-5 shrink-0 rounded-full border-2"
                            style={{
                              borderColor: selected ? primary : "rgb(63 63 70)",
                              backgroundColor: selected ? primary : "transparent",
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-1">Focus areas</h3>
                  <p className="text-xs text-zinc-500 mb-3">Pick at least one—this powers your recommendations.</p>
                  <div className="flex flex-wrap gap-2">
                    {interestPool.map((name) => {
                      const selected = interests.has(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleInterest(name)}
                          className={[
                            "rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                            selected ? "text-orange-100" : "border-zinc-700 bg-black/30 text-zinc-400 hover:border-zinc-600",
                          ].join(" ")}
                          style={
                            selected
                              ? {
                                  backgroundColor: `${primary}22`,
                                  borderColor: primary,
                                }
                              : undefined
                          }
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">Primary goal</h3>
                  <div className="space-y-2">
                    {goalPool.map((goal) => {
                      const selected = selectedGoalId === goal.id;
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => setSelectedGoalId(goal.id)}
                          className={[
                            "flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all",
                            selected ? "border-orange-400/55 bg-orange-500/10" : "border-zinc-700 bg-black/25 hover:border-zinc-600",
                          ].join(" ")}
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-700">
                            <span className="material-symbols-outlined text-zinc-300" style={selected ? { color: primary } : undefined}>
                              {goal.icon}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-zinc-50">{goal.title}</p>
                            <p className="text-xs text-zinc-500">{goal.subtitle}</p>
                          </div>
                          <div
                            className="h-5 w-5 shrink-0 rounded-full border-2"
                            style={{
                              borderColor: selected ? primary : "rgb(63 63 70)",
                              backgroundColor: selected ? primary : "transparent",
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      setError("");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/40 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-black shadow-[0_12px_40px_-12px_rgba(255,122,26,0.65)] transition-all active:scale-[0.99] disabled:opacity-60 sm:min-w-[220px]"
                    style={{ backgroundColor: primary }}
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create account
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:opacity-90" style={{ color: primary }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
