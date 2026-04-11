"use client";

import { AuthFlowBackground } from "@/components/auth/AuthFlowBackground";
import { getPublicApiUrl } from "@/lib/publicUrl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { primary } from "@/lib/theme";

const LOGO_SRC = "/logo.png";
const ACTIVE_AVATARS = [
  "https://i.pravatar.cc/80?img=12",
  "https://i.pravatar.cc/80?img=32",
  "https://i.pravatar.cc/80?img=47",
] as const;
const bgDark = "#030303";

const LEARNING_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const INTERESTS = [
  "Computer Vision",
  "NLP",
  "Robotics",
  "Data Science",
  "Deep Learning",
  "Ethics in AI",
];
const DEFAULT_INTERESTS = ["Computer Vision", "Data Science"];
const LEARNING_GOALS = [
  { id: "career", title: "Career Pivot", subtitle: "Transitioning into AI roles", icon: "work_history" },
  { id: "academic", title: "Academic Research", subtitle: "University studies & papers", icon: "school" },
  { id: "hobbyist", title: "Hobbyist", subtitle: "Learning for personal projects", icon: "rocket_launch" },
];

type Step1Data = { fullName: string; email: string; learningLevel: string };

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({
    fullName: "",
    email: "",
    learningLevel: "",
  });
  const [interests, setInterests] = useState<Set<string>>(new Set(DEFAULT_INTERESTS));
  const [selectedGoalId, setSelectedGoalId] = useState<string>("academic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleInterest(name: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!step1Data.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!step1Data.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!step1Data.learningLevel) {
      setError("Please select a learning level.");
      return;
    }
    setStep(2);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (interests.size === 0) {
      setError("Select at least one interest.");
      return;
    }
    setLoading(true);
    try {
      const goal = LEARNING_GOALS.find((g) => g.id === selectedGoalId);
      const res = await fetch(`${getPublicApiUrl()}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: step1Data.fullName.trim(),
          email: step1Data.email.trim(),
          learning_level: step1Data.learningLevel,
          interests: Array.from(interests),
          learning_goals: goal ? [goal.title] : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Registration failed.");
        return;
      }
      if (data.access_key != null) {
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
            <span className="text-sm font-medium text-slate-400">Active learners</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-dvh">
        <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-black/60 via-transparent to-black/50" />
        <div className="w-full max-w-[440px] relative z-10">
          {/* Mobile logo - same as login */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/30 bg-primary/10 overflow-hidden">
              <Image src={LOGO_SRC} alt="NeuraApp" width={32} height={32} className="object-contain" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              NeuraApp
            </span>
          </div>

          {/* Card - same style as login */}
          <div className="bg-zinc-950/85 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-8 sm:p-10 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,122,26,0.08)]">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Step {step} of 2
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {step === 1 ? "Account" : "Preferences"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-6">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: step === 1 ? "50%" : "100%",
                  backgroundColor: primary,
                }}
              />
            </div>

            {step === 1 ? (
              <form onSubmit={handleStep1Submit}>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-zinc-50 tracking-tight">
                    Create your account
                  </h1>
                  <p className="text-zinc-400 text-sm sm:text-base">
                    Start your learning path in a few steps.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      Full name
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                      <input
                        type="text"
                        value={step1Data.fullName}
                        onChange={(e) => setStep1Data((s) => ({ ...s, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                        className="block w-full pl-11 pr-4 py-3 border border-orange-500/15 rounded-xl bg-black/40 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-primary/35 focus:border-primary/50 sm:text-sm transition-all"
                      />
                    </div>
                  </div>
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
                        value={step1Data.email}
                        onChange={(e) => setStep1Data((s) => ({ ...s, email: e.target.value }))}
                        placeholder="name@example.com"
                        className="block w-full pl-11 pr-4 py-3 border border-orange-500/15 rounded-xl bg-black/40 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-primary/35 focus:border-primary/50 sm:text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      Learning level
                    </label>
                    <select
                      value={step1Data.learningLevel}
                      onChange={(e) => setStep1Data((s) => ({ ...s, learningLevel: e.target.value }))}
                      className="block w-full pl-4 pr-4 py-3 border border-orange-500/15 rounded-xl bg-black/40 text-zinc-100 focus:ring-2 focus:ring-primary/35 focus:border-primary/50 sm:text-sm transition-all"
                    >
                      <option value="">Select your experience</option>
                      {LEARNING_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-[#2727f1]/20 transition-all active:scale-[0.98] mt-6"
                  style={{ backgroundColor: primary }}
                >
                  Continue
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleStep2Submit}>
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Your preferences
                    </h1>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:underline"
                    >
                      Back
                    </button>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                    Customize your learning experience
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Interests
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Select topics you want to master (at least one)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((name) => {
                        const selected = interests.has(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleInterest(name)}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                              selected
                                ? ""
                                : "border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
                            }`}
                            style={
                              selected
                                ? {
                                    backgroundColor: `${primary}18`,
                                    borderColor: primary,
                                    color: primary,
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
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Learning goal
                    </h3>
                    <div className="space-y-3">
                      {LEARNING_GOALS.map((goal) => {
                        const selected = selectedGoalId === goal.id;
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => setSelectedGoalId(goal.id)}
                            className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${
                              selected
                                ? "border-primary bg-primary/10 dark:bg-primary/15"
                                : "border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
                              <span
                                className="material-symbols-outlined text-slate-500 dark:text-slate-400"
                                style={selected ? { color: primary } : {}}
                              >
                                {goal.icon}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {goal.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {goal.subtitle}
                              </p>
                            </div>
                            <div
                              className="w-5 h-5 rounded-full border-2 shrink-0"
                              style={{
                                borderColor: selected ? primary : "rgb(203 213 225)",
                                backgroundColor: selected ? primary : "transparent",
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-[#2727f1]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-6"
                  style={{ backgroundColor: primary }}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl">
                        progress_activity
                      </span>
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:opacity-80" style={{ color: primary }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
