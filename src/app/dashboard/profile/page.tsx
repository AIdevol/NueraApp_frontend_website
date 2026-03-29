"use client";

import { clearUserProfileCache } from "@/hooks/useUserProfile";
import { getPublicApiUrl } from "@/lib/publicUrl";
import { primary } from "@/lib/theme";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

const MAX_AVATAR_PAYLOAD_CHARS = 1_900_000;

async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxW = 720;
  const maxH = 720;
  let { width, height } = bitmap;
  const scale = Math.min(1, maxW / width, maxH / height);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  let quality = 0.72;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_AVATAR_PAYLOAD_CHARS && quality > 0.35) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_AVATAR_PAYLOAD_CHARS) {
    throw new Error("Image is still too large. Try a smaller photo.");
  }
  return dataUrl;
}

type DailyActivity = Record<string, number>;

interface LearningProfile {
  primary_focus?: string | null;
  secondary_focus?: string | null;
  goals?: string[];
  interests?: string[];
  current_learning_path_id?: string | null;
  tags?: string[];
  time_commitment?: string | null;
  experience_level?: string | null;
}

interface Progress {
  completed_courses?: number;
  in_progress_courses?: number;
  completed_lessons?: number;
  achievements_unlocked?: number;
  streak_days?: number;
  xp_points?: number;
  daily_activity?: DailyActivity;
}

interface SubscriptionInfo {
  tier?: string;
  status?: string;
  renewal_date?: string | null;
  features?: string[];
}

interface NotificationSettings {
  email_enabled?: boolean;
  push_enabled?: boolean;
  newsletter_opt_in?: boolean;
}

interface UiPreferences {
  theme?: string;
  language?: string;
  time_zone?: string;
}

interface Achievement {
  title: string;
  description: string;
  badge_icon: string;
}

interface ProfileData {
  id: number;
  full_name: string;
  email: string;
  learning_level?: string | null;
  avatar_url?: string | null;
  roles?: string[];
  is_active: boolean;
  created_at: string;
  last_active_at?: string | null;
  learning_profile?: LearningProfile;
  progress?: Progress;
  achievements?: Achievement[];
  subscription?: SubscriptionInfo;
  notifications?: NotificationSettings;
  ui_preferences?: UiPreferences;
}

interface StreakApiResponse {
  streak_days: number;
  last_6_months: DailyActivity;
  yearly: Record<string, number>;
}

function formatDate(s?: string | null): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

// ── Heatmap ──────────────────────────────────────────────────────────────────

/** Local calendar YYYY-MM-DD — must match keys stored from /streak/activity (browser local date). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ACTIVITY_RANGE_MONTHS = [1, 3, 6, 12] as const;
type ActivityRangeMonths = (typeof ACTIVITY_RANGE_MONTHS)[number];

function buildHeatmapDataForMonths(dailyActivity: DailyActivity = {}, months: ActivityRangeMonths) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeStart = new Date(today);
  rangeStart.setMonth(rangeStart.getMonth() - months);

  const startDate = new Date(rangeStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: {
    date: string;
    count: number;
    weekIndex: number;
    dayOfWeek: number;
  }[][] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let weekIndex = 0;
  let current = new Date(startDate);
  let lastMonth = -1;

  while (current <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      if (current > today) break;
      const isoDate = localDateKey(current);
      const month = current.getMonth();
      if (month !== lastMonth && current.getDay() === 0) {
        monthLabels.push({
          label: current.toLocaleString("default", { month: "short" }),
          weekIndex,
        });
        lastMonth = month;
      }
      week.push({
        date: isoDate,
        count: dailyActivity[isoDate] ?? 0,
        weekIndex,
        dayOfWeek: current.getDay(),
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    weekIndex++;
  }
  return { weeks, monthLabels };
}

function sumWeeksLessons(weeks: { date: string; count: number }[][]): number {
  let s = 0;
  for (const w of weeks) {
    for (const day of w) s += day.count;
  }
  return s;
}

function cellSizeForMonths(m: ActivityRangeMonths): number {
  switch (m) {
    case 1:
      return 14;
    case 3:
      return 12;
    case 6:
      return 11;
    case 12:
      return 9;
    default:
      return 10;
  }
}

function getHeatmapColor(count: number): string {
  if (count === 0) return "rgba(148,163,184,0.25)"; // slate-400/25, visible in light and dark
  if (count <= 1) return `${primary}33`;
  if (count <= 3) return `${primary}66`;
  if (count <= 6) return `${primary}aa`;
  return primary;
}

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

function LearningActivityHeatmapBody({
  dailyActivity,
  months,
}: {
  dailyActivity?: DailyActivity;
  months: ActivityRangeMonths;
}) {
  const da = dailyActivity ?? {};
  const { weeks, monthLabels } = buildHeatmapDataForMonths(da, months);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const CELL = cellSizeForMonths(months);
  const GAP = Math.max(2, Math.round(CELL / 4));
  const DAY_LABEL_W = 28;
  const totalWeeks = weeks.length;
  const svgWidth = DAY_LABEL_W + totalWeeks * (CELL + GAP);
  const lessonsHere = sumWeeksLessons(weeks);

  return (
    <>
      <p className="text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300 mb-3">
        {lessonsHere} lesson{lessonsHere === 1 ? "" : "s"} in the selected range
      </p>

      <div className="w-full overflow-x-auto pb-2 rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="p-3 min-w-0">
          <div style={{ position: "relative", minWidth: svgWidth }} data-heatmap>
            <div style={{ position: "relative", height: 18, marginLeft: DAY_LABEL_W }}>
              {monthLabels.map((m) => (
                <span
                  key={`${m.label}-${m.weekIndex}-${months}`}
                  className="absolute text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                  style={{ left: m.weekIndex * (CELL + GAP) }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", marginTop: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: 4 }}>
                {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-end pr-1 text-[9px] text-slate-400 dark:text-slate-500"
                    style={{ height: CELL, width: DAY_LABEL_W - 4 }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: GAP }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                    {week[0]?.dayOfWeek > 0 &&
                      Array.from({ length: week[0].dayOfWeek }).map((_, pi) => (
                        <div key={`pad-${pi}`} style={{ width: CELL, height: CELL }} />
                      ))}
                    {week.map((day) => (
                      <div
                        key={day.date}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 3,
                          backgroundColor: getHeatmapColor(day.count),
                          cursor: "default",
                          transition: "opacity 0.15s",
                          boxShadow: day.count > 0 ? "inset 0 0 0 1px rgba(0,0,0,0.06)" : undefined,
                        }}
                        onMouseEnter={(e) => {
                          const target = e.currentTarget;
                          const rect = target.getBoundingClientRect();
                          const heatmapEl = target.closest("[data-heatmap]");
                          const parentRect = heatmapEl ? heatmapEl.getBoundingClientRect() : rect;
                          setTooltip({
                            text:
                              day.count === 0
                                ? `No activity on ${day.date}`
                                : `${day.count} lesson${day.count > 1 ? "s" : ""} on ${day.date}`,
                            x: rect.left - parentRect.left + CELL / 2,
                            y: rect.top - parentRect.top - 6,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {tooltip ? (
              <div
                className="absolute z-10 px-2 py-1 rounded-md text-xs font-semibold text-slate-100 bg-slate-800 dark:bg-slate-700 border border-slate-600 whitespace-nowrap pointer-events-none shadow-lg"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: "translate(-50%, -100%)",
                }}
              >
                {tooltip.text}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 justify-between flex-wrap">
        <span className="text-[10px] text-slate-500 dark:text-slate-400">Intensity scale</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Less</span>
          {[0, 1, 3, 5, 8].map((v) => (
            <div
              key={v}
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 2,
                backgroundColor: getHeatmapColor(v),
              }}
            />
          ))}
          <span className="text-[10px] text-slate-500 dark:text-slate-400">More</span>
        </div>
      </div>
    </>
  );
}

function LearningActivitySection({
  dailyActivity,
  streak,
}: {
  dailyActivity?: DailyActivity;
  streak: number;
}) {
  const [rangeMonths, setRangeMonths] = useState<ActivityRangeMonths>(6);
  const storedLessons = Object.values(dailyActivity ?? {}).reduce(
    (s, n) => s + (typeof n === "number" ? n : 0),
    0,
  );

  return (
    <div className={`${cardClass} p-6`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Learning activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              One box per day; color shows how many lessons you opened that day. Longer ranges use smaller squares.
              {storedLessons === 0 ? (
                <span className="block mt-2 text-slate-400 dark:text-slate-500">
                  Open lessons from your learning path to fill the grid; totals refresh when you return here.
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            {streak > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold w-fit">
                <span className="material-symbols-outlined text-sm">local_fire_department</span>
                {streak} day streak
              </span>
            ) : null}

            <label className="flex flex-col gap-1 min-w-[200px]">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Time range
              </span>
              <div className="relative">
                <select
                  value={rangeMonths}
                  onChange={(e) => setRangeMonths(Number(e.target.value) as ActivityRangeMonths)}
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 text-sm font-semibold py-2.5 pl-3 pr-10 cursor-pointer shadow-sm hover:border-primary/40 focus:ring-2 focus:ring-primary/35 focus:border-primary outline-none transition-colors"
                  aria-label="Learning activity time range"
                >
                  {ACTIVITY_RANGE_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m === 1 ? "Last 1 month" : `Last ${m} months`}
                    </option>
                  ))}
                </select>
                <span
                  className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xl"
                  aria-hidden
                >
                  expand_more
                </span>
              </div>
            </label>
          </div>
        </div>

        <LearningActivityHeatmapBody dailyActivity={dailyActivity} months={rangeMonths} />
      </div>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  avatarUrl?: string | null;
  fullName: string;
  size?: number;
  /** Active indicator (top-right) so bottom-right stays clear for edit control */
  showStatusDot?: boolean;
}

function Avatar({ avatarUrl, fullName, size = 112, showStatusDot = true }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = (fullName || "U").trim().charAt(0).toUpperCase() || "?";
  const showImg = Boolean(avatarUrl && !imgFailed);

  return (
    <div
      className="relative shrink-0 rounded-full overflow-hidden border-4 border-primary/30 bg-primary"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 z-0 flex items-center justify-center font-bold text-white select-none"
        style={{ fontSize: size * 0.36 }}
      >
        {initial}
      </div>
      {showImg && avatarUrl && (
        <img
          src={avatarUrl as string}
          alt={fullName}
          key={avatarUrl}
          className="absolute inset-0 w-full h-full object-cover rounded-full z-[1]"
          onError={() => setImgFailed(true)}
          referrerPolicy="no-referrer"
        />
      )}
      {showStatusDot && (
        <div
          className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-slate-800 z-[2]"
          aria-hidden
        />
      )}
    </div>
  );
}

// Theme-aware card (works in light and dark)
const cardClass =
  "rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/40 backdrop-blur-sm shadow-sm dark:shadow-none";

// ── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  accentColor: string;
}

function StatCard({ icon, value, label, accentColor }: StatCardProps) {
  return (
    <div
      className={`${cardClass} p-4 flex flex-col items-center text-center border-l-4`}
      style={{ borderLeftColor: accentColor }}
    >
      <span className="material-symbols-outlined mb-1.5" style={{ color: accentColor, fontSize: 22 }}>{icon}</span>
      <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{label}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [savingAvatar, setSavingAvatar] = useState<boolean>(false);
  const [aboutModalOpen, setAboutModalOpen] = useState<boolean>(false);
  const [editLearningLevel, setEditLearningLevel] = useState<string>("");
  const [editPrimaryFocus, setEditPrimaryFocus] = useState<string>("");
  const [editSecondaryFocus, setEditSecondaryFocus] = useState<string>("");
  const [editGoals, setEditGoals] = useState<string>("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Not authenticated. Please sign in.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        setError("Your session has expired. Please sign in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Failed to load profile");
        return;
      }
      const data: ProfileData = await res.json();
      setProfile(data);
      setEditLearningLevel(data.learning_level || "");
      setEditPrimaryFocus(data.learning_profile?.primary_focus || "");
      setEditSecondaryFocus(data.learning_profile?.secondary_focus || "");
      setEditGoals((data.learning_profile?.goals ?? []).join(", "));
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStreak = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    try {
      const res = await fetch(`${getPublicApiUrl()}/api/v1/streak`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: StreakApiResponse = await res.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              progress: {
                ...(prev.progress || {}),
                streak_days: data.streak_days,
                daily_activity: data.last_6_months,
              },
            }
          : prev,
      );
    } catch {
      // ignore streak errors
    }
  }, []);

  useEffect(() => {
    fetchProfile().then(() => {
      void refreshStreak();
    });
  }, [fetchProfile, refreshStreak]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshStreak();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshStreak]);

  const goalsFromEditText = useCallback(() => {
    return editGoals
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [editGoals]);

  async function handleAvatarFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file?.type.startsWith("image/")) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Not authenticated. Please sign in.");
      return;
    }
    setSavingAvatar(true);
    setError("");
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const res = await fetch(`${getPublicApiUrl()}/api/v1/profile/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: dataUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to update profile photo");
      }
      const body: { avatar_url?: string | null } = await res.json().catch(() => ({}));
      const nextUrl = body.avatar_url ?? dataUrl;
      setProfile((prev) => (prev ? { ...prev, avatar_url: nextUrl } : null));
      clearUserProfileCache();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update photo.";
      setError(msg);
    } finally {
      setSavingAvatar(false);
    }
  }

  async function saveAboutGoals() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Not authenticated. Please sign in.");
      return;
    }
    setSavingProfile(true);
    setError("");
    try {
      const lpRes = await fetch(`${getPublicApiUrl()}/api/v1/profile/learning-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goals: goalsFromEditText() }),
      });
      if (!lpRes.ok) {
        const body = await lpRes.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to save about");
      }
      const updatedLp: LearningProfile = await lpRes.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              learning_profile: {
                ...(prev.learning_profile || {}),
                ...updatedLp,
              },
            }
          : prev,
      );
      setAboutModalOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save about.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveProfile() {
    if (!profile) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Not authenticated. Please sign in.");
      return;
    }
    setSavingProfile(true);
    setError("");
    try {
      // Basic profile (learning level)
      await fetch(`${getPublicApiUrl()}/api/v1/profile/basic`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          learning_level: editLearningLevel || null,
        }),
      });
      // Learning profile (focus fields)
      const lpRes = await fetch(`${getPublicApiUrl()}/api/v1/profile/learning-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          primary_focus: editPrimaryFocus || null,
          secondary_focus: editSecondaryFocus || null,
          goals: goalsFromEditText(),
        }),
      });
      if (!lpRes.ok) {
        const body = await lpRes.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to update profile");
      }
      const updatedLp: LearningProfile = await lpRes.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              learning_level: editLearningLevel || null,
              learning_profile: {
                ...(prev.learning_profile || {}),
                ...updatedLp,
              },
            }
          : prev,
      );
    } catch (e: any) {
      setError(e?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Demo fallback (remove in production) ─────────────────────────────────
  useEffect(() => {
    if (!loading && !profile && !error) return;
    if (!loading && error) {
      // Use demo data for preview
      setProfile({
        id: 1,
        full_name: "Alex Rivera",
        email: "alex.rivera@ailearn.dev",
        learning_level: "Advanced",
        avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdI0OX6URffctCpd3pvzdySwFikHJCdpEBxHUep8s3A6JC03p5PoyZ5iYs5ItTvuMXbBPhJMWBKnKkbI_b_Ud5RDO_OVqUQopjaCr0VDW4cT2QKXpALNxQDPd-vXSfSpniMIPZ4PKK8Ko42b-SUz4tF_rFxLmqkGSm2l0xwPwhr_AXv1hrjEu_sLOy8oODY0DtLhEype5erm5xOawcFOtbrNaVsp0ePiyJYyi51PiUP4IYmKdfIqPrm0Skv9cHJ5uY2irKrD_jGg",
        roles: ["student", "researcher"],
        is_active: true,
        created_at: "2023-01-15T00:00:00Z",
        last_active_at: new Date().toISOString(),
        learning_profile: {
          primary_focus: "Neural Network Architecture",
          secondary_focus: "RAG Systems",
          experience_level: "advanced",
          time_commitment: "10+ hrs/week",
          goals: ["Master LLM fine-tuning", "Publish research paper"],
          interests: ["Transformers", "Diffusion Models", "RL"],
          tags: ["PyTorch", "Python", "CUDA", "HuggingFace", "LangChain"],
        },
        progress: {
          completed_courses: 12,
          in_progress_courses: 2,
          completed_lessons: 148,
          achievements_unlocked: 8,
          streak_days: 42,
          xp_points: 24500,
          daily_activity: (() => {
            const d: { [key: string]: number } = {};
            for (let i = 0; i < 180; i++) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              if (Math.random() > 0.45) {
                d[date.toISOString().slice(0, 10)] = Math.floor(Math.random() * 8) + 1;
              }
            }
            return d;
          })(),
        },
        achievements: [
          { title: "PyTorch Specialist", description: "Completed advanced PyTorch curriculum", badge_icon: "terminal" },
          { title: "Deep Learning Expert", description: "Mastered CNN, RNN, and Transformer architectures", badge_icon: "neurology" },
          { title: "Streak Master", description: "Maintained a 30-day learning streak", badge_icon: "local_fire_department" },
          { title: "NLP Pioneer", description: "Completed NLP fundamentals with distinction", badge_icon: "forum" },
        ],
        subscription: {
          tier: "Pro",
          status: "active",
          renewal_date: "2025-01-15T00:00:00Z",
          features: ["Unlimited courses", "AI tutoring", "Certificate downloads", "Priority support"],
        },
        notifications: { email_enabled: true, push_enabled: false, newsletter_opt_in: true },
        ui_preferences: { theme: "dark", language: "English", time_zone: "UTC-8" },
      });
      setError("");
      setEditGoals(
        ["Master LLM fine-tuning", "Publish research paper"].join(", "),
      );
    }
  }, [loading, error, profile]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 bg-background-light dark:bg-background-dark">
        <div
          className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-primary animate-spin"
          aria-hidden
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading profile…</p>
      </div>
    );
  }

  if (!profile) return null;
  const p = profile;
  const streak = p.progress?.streak_days ?? 0;

  const statCards = [
    { icon: "bolt", value: (p.progress?.xp_points ?? 0).toLocaleString(), label: "Total XP", color: primary },
    { icon: "local_fire_department", value: `${streak} Days`, label: "Streak", color: "#f97316" },
    { icon: "school", value: p.progress?.completed_courses ?? 0, label: "Courses", color: "#60a5fa" },
    { icon: "play_circle", value: p.progress?.completed_lessons ?? 0, label: "Lessons", color: "#34d399" },
    { icon: "pending", value: p.progress?.in_progress_courses ?? 0, label: "In Progress", color: "#fbbf24" },
    { icon: "military_tech", value: p.progress?.achievements_unlocked ?? 0, label: "Achievements", color: "#a78bfa" },
  ];

  return (
      <div className="min-h-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">

          {/* ── Page Title ── */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">My Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Your account and learning overview.</p>
            {error ? (
              <p
                className="mt-3 text-sm text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-3 py-2"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Profile Card */}
              <div className={`${cardClass} p-8 flex flex-col items-center text-center`}>
                <div className="relative mb-6 shrink-0">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-hidden
                    tabIndex={-1}
                    onChange={handleAvatarFileChange}
                  />
                  <Avatar avatarUrl={p.avatar_url} fullName={p.full_name} size={140} showStatusDot />
                  <button
                    type="button"
                    aria-label="Change profile photo"
                    disabled={savingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 z-[3] flex h-10 w-10 items-center justify-center rounded-full border-2 border-white dark:border-slate-800 bg-primary text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {savingAvatar ? (
                      <span
                        className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                        aria-hidden
                      />
                    ) : (
                      <span className="material-symbols-outlined text-xl">edit</span>
                    )}
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{p.full_name}</h2>

                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {p.learning_level && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/15 dark:bg-primary/20 border border-primary/30 text-primary">
                      {p.learning_level}
                    </span>
                  )}
                  {p.subscription?.tier && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                      {p.subscription.tier} Plan
                    </span>
                  )}
                  {p.is_active && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                      Active
                    </span>
                  )}
                </div>

                <div className="w-full text-left mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      About
                    </span>
                    <button
                      type="button"
                      aria-label="Edit about"
                      disabled={savingProfile}
                      onClick={() => setAboutModalOpen(true)}
                      className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm leading-relaxed">
                    {(p.learning_profile?.goals?.length ?? 0) > 0
                      ? (p.learning_profile?.goals ?? []).join(", ")
                      : "Add a short bio — what you’re learning and what you care about. Tap edit to write it."}
                  </p>
                  {(p.learning_profile?.primary_focus || p.learning_profile?.secondary_focus) && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 leading-relaxed">
                      {p.learning_profile?.primary_focus && <>Focused on {p.learning_profile.primary_focus}. </>}
                      {p.learning_profile?.secondary_focus && <>Exploring {p.learning_profile.secondary_focus}.</>}
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{p.email}</p>

                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    className="px-5 py-2 rounded-lg font-bold text-sm text-white border-0 cursor-pointer bg-primary hover:opacity-90 transition-opacity"
                    onClick={() => {
                      document
                        .getElementById("profile-about-panel")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    className="px-5 py-2 rounded-lg font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600/60 transition-colors"
                  >
                    Share
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {statCards.map((s) => (
                  <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} accentColor={s.color} />
                ))}
              </div>

              {/* Achievements */}
              {(p.achievements?.length ?? 0) > 0 && (
                <div className={`${cardClass} p-6`}>
                  <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-xl">verified</span>
                    Achievements
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {(p.achievements ?? []).map((a) => (
                      <div
                        key={a.title}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/15 dark:bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-lg">{a.badge_icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {/* Heatmap */}
              <LearningActivitySection dailyActivity={p.progress?.daily_activity} streak={streak} />

              {/* Active Learning Paths */}
              {(p.progress?.in_progress_courses ?? 0) > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary">rocket_launch</span>
                    Active Learning Paths
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { title: p.learning_profile?.primary_focus || "Primary Course", pct: 75, icon: "neurology", color: primary, level: "Advanced" },
                      { title: p.learning_profile?.secondary_focus || "Secondary Course", pct: 40, icon: "forum", color: "#60a5fa", level: "Intermediate" },
                    ].map((course) => (
                      <div key={course.title} className={`${cardClass} p-5 cursor-pointer`}>
                        <div className="flex justify-between items-start mb-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${course.color}22` }}
                          >
                            <span className="material-symbols-outlined" style={{ color: course.color }}>{course.icon}</span>
                          </div>
                          <span
                            className="text-xs font-bold px-2 py-1 rounded-md"
                            style={{ backgroundColor: `${course.color}18`, color: course.color }}
                          >
                            {course.level}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{course.title}</p>
                        <div className="mt-4">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-500 dark:text-slate-400">Progress</span>
                            <span className="font-bold" style={{ color: course.color }}>{course.pct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-[width] duration-500 ease-out"
                              style={{ width: `${course.pct}%`, backgroundColor: course.color }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About Section */}
              <div id="profile-about-panel" className={`${cardClass} p-6 scroll-mt-24`}>
                <h3 className="text-base font-bold mb-5 text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                  <span className="material-symbols-outlined text-primary text-xl">person</span>
                  About
                  <button
                    type="button"
                    aria-label="Edit about"
                    disabled={savingProfile}
                    onClick={() => setAboutModalOpen(true)}
                    className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="ml-auto text-xs px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-600 bg-primary/15 dark:bg-primary/20 text-primary font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-default"
                  >
                    {savingProfile ? "Saving..." : "Save"}
                  </button>
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Account Info */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Account</p>
                    <dl className="flex flex-col gap-2 text-sm">
                      {[
                        ["Member since", formatDate(p.created_at)],
                        ["Last active", formatDate(p.last_active_at)],
                        ["Roles", p.roles?.join(", ") || "—"],
                        ["Status", p.is_active ? "Active" : "Inactive"],
                        ["Learning level", editLearningLevel || "—"],
                      ].map(([dt, dd]) => (
                        <div key={dt} className="flex justify-between">
                          <dt className="text-slate-500 dark:text-slate-400">{dt}</dt>
                          <dd className="font-semibold text-slate-900 dark:text-slate-100 text-right">{dd}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Subscription */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Subscription</p>
                    <dl className="flex flex-col gap-2 text-sm">
                      {[
                        ["Plan", p.subscription?.tier || "—"],
                        ["Status", p.subscription?.status || "—"],
                        ["Renewal", formatDate(p.subscription?.renewal_date)],
                      ].map(([dt, dd]) => (
                        <div key={dt} className="flex justify-between">
                          <dt className="text-slate-500 dark:text-slate-400">{dt}</dt>
                          <dd className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{dd}</dd>
                        </div>
                      ))}
                    </dl>
                    {(p.subscription?.features?.length ?? 0) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(p.subscription?.features ?? []).map((f) => (
                          <span
                            key={f}
                            className="text-xs px-2 py-0.5 rounded-md font-semibold bg-primary/15 dark:bg-primary/20 border border-primary/30 text-primary"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Learning Profile */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Learning Profile</p>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 mb-1 text-xs">Primary focus</p>
                      <input
                        value={editPrimaryFocus}
                        onChange={(e) => setEditPrimaryFocus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 mb-1 text-xs">Secondary focus</p>
                      <input
                        value={editSecondaryFocus}
                        onChange={(e) => setEditSecondaryFocus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      />
                    </div>
                    {p.learning_profile?.experience_level && (
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1 text-xs">Experience</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{p.learning_profile.experience_level}</p>
                      </div>
                    )}
                    {p.learning_profile?.time_commitment && (
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 mb-1 text-xs">Time Commitment</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{p.learning_profile.time_commitment}</p>
                      </div>
                    )}
                    <div className="sm:col-span-2" id="profile-goals-field">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-slate-500 dark:text-slate-400 text-xs">About / goals</p>
                        <button
                          type="button"
                          aria-label="Open about editor"
                          disabled={savingProfile}
                          onClick={() => setAboutModalOpen(true)}
                          className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                      </div>
                      <textarea
                        value={editGoals}
                        onChange={(e) => setEditGoals(e.target.value)}
                        rows={3}
                        placeholder="What you are learning, interests — comma-separated goals"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-y min-h-[4.5rem]"
                      />
                    </div>
                    {(p.learning_profile?.interests?.length ?? 0) > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-slate-500 dark:text-slate-400 mb-1 text-xs">Interests</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{(p.learning_profile?.interests ?? []).join(", ")}</p>
                      </div>
                    )}
                    {(p.learning_profile?.tags?.length ?? 0) > 0 && (
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        {(p.learning_profile?.tags ?? []).map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notifications & Preferences */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50 grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Notifications</p>
                    <ul className="list-none p-0 m-0 flex flex-col gap-1.5 text-sm">
                      {[
                        ["Email", p.notifications?.email_enabled],
                        ["Push", p.notifications?.push_enabled],
                        ["Newsletter", p.notifications?.newsletter_opt_in],
                      ].map(([label, on]) => (
                        <li key={String(label)} className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">{label}</span>
                          <span className={`font-semibold ${on ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                            {on ? "On" : "Off"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Preferences</p>
                    <ul className="list-none p-0 m-0 flex flex-col gap-1.5 text-sm">
                      {[
                        ["Theme", p.ui_preferences?.theme || "—"],
                        ["Language", p.ui_preferences?.language || "—"],
                        ["Time Zone", p.ui_preferences?.time_zone || "—"],
                      ].map(([label, val]) => (
                        <li key={String(label)} className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">{label}</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{val}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {aboutModalOpen ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAboutModalOpen(false);
            }}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="about-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Edit about
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
                Use commas to separate multiple goals or phrases.
              </p>
              <textarea
                value={editGoals}
                onChange={(e) => setEditGoals(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-y min-h-[7rem]"
                placeholder="What you are learning, interests, goals…"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                  onClick={() => setAboutModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  disabled={savingProfile}
                  onClick={() => void saveAboutGoals()}
                >
                  {savingProfile ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
  );
}