"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { stroke: "#52525b", fontSize: 11 };
const grid = { stroke: "#27272a", strokeDasharray: "3 3" as const };
const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "12px",
  fontSize: "12px",
};

export type TrafficPoint = { day: string; visits: number };
export type SignupPoint = { day: string; signups: number };

function formatDayLabel(day: string) {
  if (day.length >= 10) return day.slice(5, 10);
  return day;
}

export function TrafficAreaChart({ data }: { data: TrafficPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDayLabel(d.day),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="adminVisitsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...grid} />
        <XAxis dataKey="label" tick={axis} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
        <YAxis tick={axis} tickLine={false} allowDecimals={false} width={40} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload as TrafficPoint | undefined;
            return p?.day ?? "";
          }}
          formatter={(value: number) => [value, "Visits"]}
        />
        <Area
          type="monotone"
          dataKey="visits"
          name="Visits"
          stroke="#fb923c"
          strokeWidth={2}
          fill="url(#adminVisitsGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SignupsBarChart({ data }: { data: SignupPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDayLabel(d.day),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="label" tick={axis} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
        <YAxis tick={axis} tickLine={false} allowDecimals={false} width={40} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload as SignupPoint | undefined;
            return p?.day ?? "";
          }}
          formatter={(value: number) => [value, "Sign-ups"]}
        />
        <Bar dataKey="signups" name="New accounts" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#f97316", "#38bdf8", "#a78bfa", "#f472b6"];

export function ContentMixPie({
  segments,
}: {
  segments: { name: string; value: number }[];
}) {
  const filtered = segments.filter((s) => s.value > 0);
  if (filtered.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-500">
        No content yet
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={3}
          stroke="#18181b"
          strokeWidth={2}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Count"]} />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#a1a1aa" }}
          formatter={(value) => <span className="text-zinc-400">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
