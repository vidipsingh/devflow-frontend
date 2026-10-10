
"use client";

import { useState, useMemo } from "react";
import {
  useAnalytics,
  useAllReposAnalytics,
  useRepoAnalytics,
  useTeamAnalytics,
  DailyActivity,
  MonthlySeries,
  SnippetPerformance,
  LanguageStat,
  RepoActivitySummary,
  MemberActivity,
  TimeSeriesPoint,
} from "@/hooks/useAnalytics";
import { useMyTeams, Team } from "@/hooks/useTeams";

// ─── Utility helpers ──────────────────────────────────────────────────────────

function fmtNum(n: number, decimals = 0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(decimals);
}

function fmtINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtHrs(h: number): string {
  if (h <= 0) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function fmtMins(m: number): string {
  if (m <= 0) return "—";
  if (m < 60) return `${Math.round(m)}m`;
  return `${(m / 60).toFixed(1)}h`;
}

// ─── Accent colour map ────────────────────────────────────────────────────────

type Accent = "violet" | "emerald" | "amber" | "cyan" | "rose" | "blue" | "pink" | "indigo" | "sky";

const ACCENT: Record<Accent, { border: string; glow: string; text: string; bg: string; bar: string }> = {
  violet:  { border: "border-violet-500/25",  glow: "from-violet-500/8",  text: "text-violet-400",  bg: "bg-violet-500/15",  bar: "#7c3aed" },
  emerald: { border: "border-emerald-500/25", glow: "from-emerald-500/8", text: "text-emerald-400", bg: "bg-emerald-500/15", bar: "#10b981" },
  amber:   { border: "border-amber-500/25",   glow: "from-amber-500/8",   text: "text-amber-400",   bg: "bg-amber-500/15",   bar: "#f59e0b" },
  cyan:    { border: "border-cyan-500/25",     glow: "from-cyan-500/8",    text: "text-cyan-400",    bg: "bg-cyan-500/15",    bar: "#06b6d4" },
  rose:    { border: "border-rose-500/25",     glow: "from-rose-500/8",    text: "text-rose-400",    bg: "bg-rose-500/15",    bar: "#f43f5e" },
  blue:    { border: "border-blue-500/25",     glow: "from-blue-500/8",    text: "text-blue-400",    bg: "bg-blue-500/15",    bar: "#3b82f6" },
  pink:    { border: "border-pink-500/25",     glow: "from-pink-500/8",    text: "text-pink-400",    bg: "bg-pink-500/15",    bar: "#ec4899" },
  indigo:  { border: "border-indigo-500/25",   glow: "from-indigo-500/8",  text: "text-indigo-400",  bg: "bg-indigo-500/15",  bar: "#6366f1" },
  sky:     { border: "border-sky-500/25",      glow: "from-sky-500/8",     text: "text-sky-400",     bg: "bg-sky-500/15",     bar: "#0ea5e9" },
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: Accent;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, accent = "violet", icon }: StatCardProps) {
  const a = ACCENT[accent];
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${a.border} bg-gradient-to-br ${a.glow} to-transparent bg-[#0d0d14] p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center ${a.text}`}>
          {icon}
        </div>
        {sub && (
          <span className="text-[10px] text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-[11px] text-white/40 mt-0.5 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

// ─── Error box ────────────────────────────────────────────────────────────────
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-rose-400 text-sm">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

// ─── Contribution heatmap ─────────────────────────────────────────────────────

function Heatmap({ data }: { data: DailyActivity[] }) {
  const map = useMemo(() => {
    const m: Record<string, number> = {};
    data.forEach((d) => { m[d.date] = d.count; });
    return m;
  }, [data]);

  const cells = useMemo(() => {
    const result: { date: string; count: number; dow: number }[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push({ date: key, count: map[key] ?? 0, dow: d.getDay() });
    }
    return result;
  }, [map]);

  const weeks = useMemo(() => {
    const w: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [cells]);

  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DOW_LABELS   = ["Sun","Mon","","Wed","","Fri",""];

  function cellColor(c: number) {
    if (c === 0) return "bg-white/[0.05]";
    if (c <= 2) return "bg-violet-900/70";
    if (c <= 5) return "bg-violet-700/80";
    if (c <= 10) return "bg-violet-500/90";
    return "bg-violet-400";
  }

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const d = new Date(week[0]?.date);
    const m = d.getMonth();
    if (m !== lastMonth) { monthLabels.push({ label: MONTH_LABELS[m], col: wi }); lastMonth = m; }
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-px min-w-max">
        <div className="flex flex-col gap-px mr-1.5 pt-5">
          {DOW_LABELS.map((l, i) => (
            <span key={i} className="text-[9px] text-white/20 h-[13px] flex items-center leading-none">{l}</span>
          ))}
        </div>
        <div>
          <div className="flex gap-px mb-1 h-4">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.col === wi);
              return (
                <div key={wi} className="w-[13px]">
                  {ml && <span className="text-[9px] text-white/25 whitespace-nowrap">{ml.label}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-px">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-px">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} commit${cell.count !== 1 ? "s" : ""}`}
                    className={`w-[13px] h-[13px] rounded-[3px] ${cellColor(cell.count)} transition-opacity hover:opacity-80 cursor-default`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-white/25">Less</span>
        {(["bg-white/[0.05]", "bg-violet-900/70", "bg-violet-700/80", "bg-violet-500/90", "bg-violet-400"] as const).map((c, i) => (
          <span key={i} className={`w-[13px] h-[13px] rounded-[3px] ${c}`} />
        ))}
        <span className="text-[10px] text-white/25">More</span>
      </div>
    </div>
  );
}

// ─── Bar chart (monthly) ──────────────────────────────────────────────────────

function BarChart({
  series,
  color = "#7c3aed",
  valueLabel = "",
  height = 96,
}: {
  series: MonthlySeries[];
  color?: string;
  valueLabel?: string;
  height?: number;
}) {
  if (!series.length)
    return (
      <div className="flex items-center justify-center h-24">
        <p className="text-xs text-white/20">No data for this period</p>
      </div>
    );

  const max = Math.max(...series.map((s) => s.count), 1);

  return (
    <div className="flex items-end gap-1.5 w-full" style={{ height }}>
      {series.map((s) => {
        const pct = Math.max((s.count / max) * 100, 3);
        return (
          <div key={s.month} className="flex flex-col items-center gap-1 flex-1 min-w-0 group">
            <div className="relative flex-1 w-full flex items-end">
              <div
                title={`${s.month}: ${s.count}${valueLabel}`}
                style={{ height: `${pct}%`, backgroundColor: color }}
                className="w-full rounded-t-sm opacity-70 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-[#1a1a2e] border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap">
                  <p className="text-[10px] text-white/80 font-medium">{s.count}{valueLabel}</p>
                </div>
              </div>
            </div>
            <span className="text-[8px] text-white/20 truncate w-full text-center">{s.month.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Language breakdown bars ──────────────────────────────────────────────────

const LANG_COLORS = [
  "#7c3aed", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e",
  "#3b82f6", "#a78bfa", "#fb923c", "#34d399", "#e879f9",
];

function LanguageBreakdown({ data }: { data: LanguageStat[] }) {
  if (!data.length)
    return (
      <div className="flex items-center justify-center h-24">
        <p className="text-xs text-white/20">No repository language data</p>
      </div>
    );

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
        {data.slice(0, 8).map((d, i) => (
          <div
            key={d.language}
            title={`${d.language} – ${((d.count / total) * 100).toFixed(1)}%`}
            style={{ width: `${(d.count / total) * 100}%`, backgroundColor: LANG_COLORS[i % LANG_COLORS.length] }}
          />
        ))}
      </div>
      <div className="space-y-2">
        {data.slice(0, 8).map((d, i) => {
          const pct = ((d.count / total) * 100).toFixed(1);
          return (
            <div key={d.language} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: LANG_COLORS[i % LANG_COLORS.length] }} />
              <span className="text-xs text-white/60 flex-1 truncate">{d.language}</span>
              <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: LANG_COLORS[i % LANG_COLORS.length] }} />
              </div>
              <span className="text-[10px] text-white/30 w-10 text-right tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Donut ring ───────────────────────────────────────────────────────────────

function DonutRing({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0)
    return (
      <div className="flex items-center justify-center h-28">
        <p className="text-xs text-white/20">No data</p>
      </div>
    );

  let offset = 0;
  const R = 40;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="flex items-center gap-6">
      <svg width={100} height={100} viewBox="0 0 100 100" className="flex-shrink-0">
        <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={12} />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * CIRC;
          const gap = CIRC - dash;
          const el = (
            <circle
              key={i}
              cx={50} cy={50} r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={12}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              opacity={0.85}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={50} y={47} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">{fmtNum(total)}</text>
        <text x={50} y={59} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={7}>total</text>
      </svg>
      <div className="space-y-2 flex-1 min-w-0">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-white/50 flex-1 truncate">{seg.label}</span>
            <span className="text-xs font-semibold text-white tabular-nums">{seg.value}</span>
            <span className="text-[10px] text-white/25 tabular-nums w-10 text-right">
              {((seg.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Snippet performance table ────────────────────────────────────────────────

function SnippetTable({ data }: { data: SnippetPerformance[] }) {
  if (!data.length)
    return (
      <div className="flex items-center justify-center h-16">
        <p className="text-xs text-white/20">No snippets yet</p>
      </div>
    );

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {["Snippet", "Downloads", "Purchases", "Revenue", "Rating", "Status"].map((h) => (
              <th key={h} className={`py-2 font-medium text-white/30 ${h === "Snippet" ? "text-left pr-4 pl-1" : "text-right px-2 last:pr-1"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="py-2.5 pr-4 pl-1 text-white/70 max-w-[180px] truncate font-medium">{s.title}</td>
              <td className="py-2.5 px-2 text-right text-white/50 tabular-nums">{fmtNum(s.downloads)}</td>
              <td className="py-2.5 px-2 text-right text-white/50 tabular-nums">{fmtNum(s.purchases)}</td>
              <td className="py-2.5 px-2 text-right tabular-nums text-emerald-400 font-medium">
                {s.revenue > 0 ? fmtINR(s.revenue) : "—"}
              </td>
              <td className="py-2.5 px-2 text-right tabular-nums text-amber-400">
                {s.rating > 0 ? (
                  <span className="flex items-center justify-end gap-0.5">
                    {s.rating.toFixed(1)}
                    <svg className="w-2.5 h-2.5 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </span>
                ) : "—"}
              </td>
              <td className="py-2.5 pl-2 pr-1 text-right">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.status === "published" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {s.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Activity bar chart (for repos/teams time series) ─────────────────────────

function ActivityChart({ points }: { points: TimeSeriesPoint[] }) {
  if (!points || points.length === 0)
    return <p className="text-white/25 text-sm py-4">No activity data for this period.</p>;

  const max = Math.max(...points.map((p) => p.count), 1);

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {points.map((p) => (
        <div key={p.date} className="flex items-center gap-3 group">
          <span className="w-20 text-white/30 text-xs font-mono shrink-0 group-hover:text-white/50 transition-colors">
            {p.date}
          </span>
          <div className="flex-1 bg-white/[0.04] rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${(p.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-white/40 text-xs font-mono shrink-0">{p.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-56 bg-white/[0.05] rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 bg-white/[0.04] rounded-2xl border border-white/[0.05]" />
        ))}
      </div>
      <div className="h-48 bg-white/[0.04] rounded-2xl border border-white/[0.05]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-white/[0.04] rounded-2xl border border-white/[0.05]" />
        ))}
      </div>
    </div>
  );
}

// ─── Repo card (expandable) ───────────────────────────────────────────────────

function RepoCard({
  repo,
  days,
  expanded,
  onToggle,
}: {
  repo: RepoActivitySummary;
  days: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data, isLoading } = useRepoAnalytics(expanded ? repo.repoName : "", days, "daily");

  return (
    <div className={`bg-[#0d0d14] border rounded-2xl overflow-hidden transition-colors ${
      expanded ? "border-violet-500/30" : "border-white/[0.06] hover:border-white/[0.10]"
    }`}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer group">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/90 font-medium text-sm truncate">{repo.repoName}</span>
            {repo.language && (
              <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                {repo.language}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
            <span>{repo.commits} commits</span>
            <span>★ {repo.stars}</span>
            <span>{repo.forks} forks</span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-white/20 group-hover:text-white/40 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-white/30 text-sm py-2">
              <div className="w-4 h-4 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
              Loading details…
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[
                  { label: "Commits",     value: String(data.commits),    accent: "violet"  as Accent },
                  { label: "Stars",       value: String(data.stars),      accent: "amber"   as Accent },
                  { label: "Forks",       value: String(data.forks),      accent: "cyan"    as Accent },
                  { label: "Open Issues", value: String(data.openIssues), accent: "emerald" as Accent },
                  { label: "Open PRs",    value: String(data.openPRs),    accent: "blue"    as Accent },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border ${ACCENT[s.accent].border} bg-gradient-to-br ${ACCENT[s.accent].glow} to-transparent bg-[#0d0d14] p-3`}>
                    <p className={`text-lg font-bold ${ACCENT[s.accent].text}`}>{s.value}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {data.timeSeries && data.timeSeries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/25 text-xs uppercase tracking-wider">Activity</p>
                  <ActivityChart points={data.timeSeries} />
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/25 text-sm">No detailed data available.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  commit: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx={12} cy={12} r={4} /><line x1={2} y1={12} x2={8} y2={12} /><line x1={16} y1={12} x2={22} y2={12} /></svg>,
  repo:   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 3h18v18H3z" strokeLinejoin="round" /><path d="M8 3v18M16 3v18" /></svg>,
  star:   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  fork:   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M7 3v6m0 0a4 4 0 004 4h2a4 4 0 004-4V3M7 9a4 4 0 004 4" /></svg>,
  pr:     <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx={6} cy={6} r={3} /><circle cx={18} cy={18} r={3} /><path d="M6 9v3a6 6 0 006 6h3" /></svg>,
  issue:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></svg>,
  pair:   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  clock:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx={12} cy={12} r={10} /><polyline points="12 6 12 12 16 14" /></svg>,
  download: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>,
  money:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1={12} y1={1} x2={12} y2={23} /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  snippet:<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
  chart:  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  team:   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  folder: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
};

// ─── Range picker ─────────────────────────────────────────────────────────────

const RANGES = [
  { label: "7d",  value: 7   },
  { label: "30d", value: 30  },
  { label: "90d", value: 90  },
  { label: "1yr", value: 365 },
] as const;

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Code", "Marketplace", "Collaboration", "Repositories", "Teams"] as const;
type Tab = typeof TABS[number];

// ─── Repositories Tab ─────────────────────────────────────────────────────────

function RepositoriesTab({ days }: { days: number }) {
  const { repos, total, isLoading, error } = useAllReposAnalytics(days);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-4">
      <p className="text-white/30 text-sm">
        <span className="text-white/70 font-medium">{total}</span>{" "}
        repositor{total !== 1 ? "ies" : "y"} with activity in the last{" "}
        <span className="text-white/70 font-medium">{days}</span> days
      </p>

      {repos.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] p-10 text-center">
          <p className="text-white/25 text-sm">No repository activity found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {repos.map((r: RepoActivitySummary) => (
            <RepoCard
              key={r.repoId}
              repo={r}
              days={days}
              expanded={expanded === r.repoId}
              onToggle={() => setExpanded(expanded === r.repoId ? null : r.repoId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────

function TeamsTab({ days }: { days: number }) {
  const { teams, loading: teamsLoading } = useMyTeams();
  const [selectedSlug, setSelectedSlug] = useState<string>("");

  const slug = selectedSlug || (teams && teams.length > 0 ? teams[0].slug : "");
  const { data, isLoading, error } = useTeamAnalytics(slug, days, "daily");

  if (teamsLoading) return <Spinner />;

  if (!teams || teams.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d14] p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-white/20">
          {Icon.team}
        </div>
        <p className="text-white/30 text-sm">You are not a member of any team yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team picker */}
      <div className="flex items-center gap-3">
        <span className="text-white/30 text-sm">Team</span>
        <div className="relative">
          <select
            value={slug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="bg-[#0d0d14] border border-white/[0.08] rounded-xl pl-4 pr-8 py-2 text-sm text-white/70 appearance-none focus:outline-none focus:border-violet-400/40 transition-colors cursor-pointer"
          >
            {teams.map((t: Team) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
          <svg className="w-3.5 h-3.5 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBox message={error} />}

      {data && !isLoading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Members"     value={String(data.totalMembers)}    icon={Icon.pair}   accent="violet"  />
            <StatCard label="Repos"       value={String(data.totalRepos)}      icon={Icon.folder} accent="blue"    />
            <StatCard label="Commits"     value={String(data.totalCommits)}    icon={Icon.commit} accent="cyan"    />
            <StatCard label="Discussions" value={String(data.totalDiscussions)} icon={Icon.chart}  accent="emerald" />
          </div>

          {/* Member leaderboard */}
          {data.memberActivity && data.memberActivity.length > 0 && (
            <Section title="Member Leaderboard" subtitle={`Top contributors · last ${days} days`}>
              {data.memberActivity.map((m: MemberActivity, i: number) => {
                const maxCommits = data.memberActivity[0]?.commits ?? 1;
                const pct = maxCommits > 0 ? (m.commits / maxCommits) * 100 : 0;
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0"
                  >
                    <span className="w-6 text-center text-base shrink-0">
                      {i < 3 ? medals[i] : <span className="text-white/20 text-xs font-mono">{i + 1}</span>}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                      {m.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{m.username}</p>
                      <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-violet-400 text-sm font-mono font-bold shrink-0">{m.commits}</span>
                  </div>
                );
              })}
            </Section>
          )}

          {/* Team activity time series */}
          {data.timeSeries && data.timeSeries.length > 0 && (
            <Section title={`Team Activity`} subtitle={`Last ${days} days`}>
              <ActivityChart points={data.timeSeries} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>("Overview");
  const { data, isLoading, error } = useAnalytics(days);

  // ── Derived values — ALL hooks must be called before any early return ──────

  const totalCommits = useMemo(
    () => (data?.activity ?? []).reduce((s, d) => s + d.count, 0),
    [data]
  );

  const streak = useMemo(() => {
    if (!data) return 0;
    let s = 0;
    const today = new Date().toISOString().split("T")[0];
    const map: Record<string, number> = {};
    data.activity.forEach((d) => { map[d.date] = d.count; });
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if ((map[key] ?? 0) > 0) s++;
      else if (key !== today) break;
    }
    return s;
  }, [data]);

  const prMergeRate = useMemo(() => {
    if (!data || data.prs.totalOpened === 0) return "0";
    return ((data.prs.totalMerged / data.prs.totalOpened) * 100).toFixed(0);
  }, [data]);

  const issueCloseRate = useMemo(() => {
    if (!data || data.issues.totalOpened === 0) return "0";
    return ((data.issues.totalClosed / data.issues.totalOpened) * 100).toFixed(0);
  }, [data]);

  // ── Early returns AFTER all hooks ─────────────────────────────────────────

  // Repos/Teams tabs have their own loading — don't block on overview data
  const overviewLoading = isLoading && (tab === "Overview" || tab === "Code" || tab === "Marketplace" || tab === "Collaboration");

  if (overviewLoading) return <Skeleton />;

  if ((error || !data) && (tab === "Overview" || tab === "Code" || tab === "Marketplace" || tab === "Collaboration")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto text-rose-400">
            {Icon.issue}
          </div>
          <p className="text-white/50 text-sm">{error ?? "Failed to load analytics"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
            <p className="text-sm text-white/35 mt-1">Your DevFlow activity overview</p>
          </div>

          {/* Range picker */}
          <div className="flex gap-0.5 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDays(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  days === r.value
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "text-white/35 hover:text-white/65"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-white/[0.07] pb-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-all relative whitespace-nowrap cursor-pointer ${
                tab === t ? "text-white" : "text-white/35 hover:text-white/60"
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "Overview" && data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatCard label="Total Commits"    value={fmtNum(totalCommits)}                    sub={`${streak}d streak`}                    icon={Icon.commit}   accent="violet"  />
              <StatCard label="Repositories"     value={String(data.repos.totalRepos)}           sub={`${data.repos.publicRepos} public`}     icon={Icon.repo}     accent="blue"    />
              <StatCard label="Stars Received"   value={fmtNum(data.repos.totalStars)}           sub={`${data.repos.totalForks} forks`}       icon={Icon.star}     accent="amber"   />
              <StatCard label="PRs Opened"       value={fmtNum(data.prs.totalOpened)}            sub={`${prMergeRate}% merge rate`}           icon={Icon.pr}       accent="emerald" />
              <StatCard label="Issues Opened"    value={fmtNum(data.issues.totalOpened)}         sub={`${issueCloseRate}% close rate`}        icon={Icon.issue}    accent="rose"    />
              <StatCard label="Pair Sessions"    value={fmtNum(data.pairSessions.totalSessions)} sub={`${fmtMins(data.pairSessions.totalMinutes)} total`} icon={Icon.pair} accent="cyan" />
              <StatCard label="Avg Merge Time"   value={fmtHrs(data.prs.avgMergeHrs)}           sub="pull requests"                          icon={Icon.clock}    accent="pink"    />
              <StatCard label="Avg Issue Close"  value={fmtHrs(data.issues.avgCloseHrs)}         sub="issues"                                 icon={Icon.clock}    accent="amber"   />
            </div>

            <Section title="Contribution Activity" subtitle="Daily commit history — last 365 days">
              <Heatmap data={data.activity} />
            </Section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Monthly Commits" subtitle="Commit activity over the last 12 months">
                <BarChart series={data.monthlyCommits} color="#7c3aed" valueLabel=" commits" height={112} />
              </Section>
              <Section title="Monthly Sales" subtitle="Marketplace sales count — last 12 months">
                <BarChart series={data.monthlyRevenue} color="#10b981" valueLabel=" sales" height={112} />
              </Section>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: CODE
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "Code" && data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Repos"   value={String(data.repos.totalRepos)}   sub={`${data.repos.publicRepos} public`} icon={Icon.repo}  accent="blue"   />
              <StatCard label="Private Repos" value={String(data.repos.privateRepos)} sub="repos"                              icon={Icon.repo}  accent="violet" />
              <StatCard label="Stars"         value={fmtNum(data.repos.totalStars)}   sub="received"                           icon={Icon.star}  accent="amber"  />
              <StatCard label="Forks"         value={fmtNum(data.repos.totalForks)}   sub="total"                              icon={Icon.fork}  accent="cyan"   />
            </div>

            <Section title="Contribution Heatmap" subtitle="365-day commit activity">
              <Heatmap data={data.activity} />
            </Section>

            <Section title="Language Breakdown" subtitle="Based on repository language tags">
              <LanguageBreakdown data={data.languages} />
            </Section>

            <Section title="Commit History" subtitle="Monthly commit count — last 12 months">
              <BarChart series={data.monthlyCommits} color="#7c3aed" valueLabel=" commits" height={128} />
            </Section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Pull Request Breakdown" subtitle="By status">
                <DonutRing
                  segments={[
                    { label: "Merged", value: data.prs.totalMerged, color: "#10b981" },
                    { label: "Closed", value: data.prs.totalClosed, color: "#f43f5e" },
                    { label: "Open",   value: Math.max(data.prs.totalOpened - data.prs.totalMerged - data.prs.totalClosed, 0), color: "#7c3aed" },
                  ]}
                />
                <div className="flex gap-6 pt-2 border-t border-white/[0.06]">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Avg merge time</p>
                    <p className="text-lg font-bold text-white mt-0.5">{fmtHrs(data.prs.avgMergeHrs)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Merge rate</p>
                    <p className="text-lg font-bold text-white mt-0.5">{prMergeRate}%</p>
                  </div>
                </div>
              </Section>

              <Section title="Issue Breakdown" subtitle="By status">
                <DonutRing
                  segments={[
                    { label: "Closed", value: data.issues.totalClosed, color: "#10b981" },
                    { label: "Open",   value: Math.max(data.issues.totalOpened - data.issues.totalClosed, 0), color: "#f59e0b" },
                  ]}
                />
                <div className="flex gap-6 pt-2 border-t border-white/[0.06]">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Avg resolution</p>
                    <p className="text-lg font-bold text-white mt-0.5">{fmtHrs(data.issues.avgCloseHrs)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Close rate</p>
                    <p className="text-lg font-bold text-white mt-0.5">{issueCloseRate}%</p>
                  </div>
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: MARKETPLACE
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "Marketplace" && data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Snippets"   value={String(data.marketplace.totalSnippets)}    sub={`${data.marketplace.publishedSnippets} published`} icon={Icon.snippet}  accent="violet"  />
              <StatCard label="Total Downloads"  value={fmtNum(data.marketplace.totalDownloads)}   sub="all snippets"                                      icon={Icon.download} accent="cyan"    />
              <StatCard label="Total Purchases"  value={fmtNum(data.marketplace.totalPurchases)}   sub="paid sales"                                        icon={Icon.chart}    accent="emerald" />
              <StatCard label="Creator Earnings" value={fmtINR(data.marketplace.creatorEarnings)}  sub="net to you"                                        icon={Icon.money}    accent="amber"   />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-5 space-y-1 sm:col-span-1">
                <p className="text-[11px] text-white/30 uppercase tracking-widest">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{fmtINR(data.marketplace.totalRevenue)}</p>
                <p className="text-xs text-white/25">Gross before platform fee</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-5 space-y-1">
                <p className="text-[11px] text-white/30 uppercase tracking-widest">Platform Take</p>
                <p className="text-3xl font-bold text-rose-400">
                  {fmtINR(data.marketplace.totalRevenue - data.marketplace.creatorEarnings)}
                </p>
                <p className="text-xs text-white/25">Revenue − earnings</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 bg-[#0d0d14] p-5 space-y-1">
                <p className="text-[11px] text-white/30 uppercase tracking-widest">Avg Rating</p>
                <p className="text-3xl font-bold text-amber-400">
                  {data.marketplace.avgRating > 0 ? `${data.marketplace.avgRating.toFixed(1)} ★` : "—"}
                </p>
                <p className="text-xs text-white/25">Across all snippets</p>
              </div>
            </div>

            <Section title="Monthly Sales Volume" subtitle="Number of sales per month — last 12 months">
              <BarChart series={data.monthlyRevenue} color="#10b981" valueLabel=" sales" height={128} />
            </Section>

            <Section title="Snippet Performance" subtitle="Sorted by downloads">
              <SnippetTable data={data.snippetPerformance} />
            </Section>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: COLLABORATION
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "Collaboration" && data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label="Total Sessions" value={fmtNum(data.pairSessions.totalSessions)}             icon={Icon.pair}  accent="cyan"    />
              <StatCard label="Total Time"     value={fmtMins(data.pairSessions.totalMinutes)} sub="coded together" icon={Icon.clock} accent="violet"  />
              <StatCard label="Avg Session"    value={fmtMins(data.pairSessions.avgMinutes)}  sub="per session"    icon={Icon.clock} accent="emerald" />
            </div>

            <Section title="Pair Programming" subtitle={`Sessions in the last ${days} days`}>
              {data.pairSessions.totalSessions === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto text-cyan-400">
                      {Icon.pair}
                    </div>
                    <p className="text-sm text-white/30">No pair sessions recorded</p>
                    <p className="text-xs text-white/20">Start a session to see stats here</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Sessions",      value: data.pairSessions.totalSessions,           color: "text-cyan-400"    },
                    { label: "Total Minutes", value: data.pairSessions.totalMinutes.toFixed(0), color: "text-violet-400"  },
                    { label: "Avg Minutes",   value: data.pairSessions.avgMinutes.toFixed(1),   color: "text-emerald-400" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-[11px] text-white/35 mt-1 uppercase tracking-widest">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Code Review Velocity" subtitle="Pull request turnaround metrics">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DonutRing
                  segments={[
                    { label: "Merged", value: data.prs.totalMerged, color: "#10b981" },
                    { label: "Closed", value: data.prs.totalClosed, color: "#f43f5e" },
                    { label: "Open",   value: Math.max(data.prs.totalOpened - data.prs.totalMerged - data.prs.totalClosed, 0), color: "#7c3aed" },
                  ]}
                />
                <div className="space-y-3">
                  {[
                    { label: "PRs Opened",    value: data.prs.totalOpened,               color: "text-white"       },
                    { label: "Merged",        value: data.prs.totalMerged,               color: "text-emerald-400" },
                    { label: "Closed",        value: data.prs.totalClosed,               color: "text-rose-400"    },
                    { label: "Avg Merge Time",value: fmtHrs(data.prs.avgMergeHrs),       color: "text-violet-400"  },
                    { label: "Merge Rate",    value: `${prMergeRate}%`,                  color: "text-cyan-400"    },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-xs text-white/45">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Issue Resolution" subtitle="Issue tracking metrics">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DonutRing
                  segments={[
                    { label: "Closed", value: data.issues.totalClosed, color: "#10b981" },
                    { label: "Open",   value: Math.max(data.issues.totalOpened - data.issues.totalClosed, 0), color: "#f59e0b" },
                  ]}
                />
                <div className="space-y-3">
                  {[
                    { label: "Issues Opened",  value: data.issues.totalOpened,  color: "text-white"       },
                    { label: "Closed",         value: data.issues.totalClosed,  color: "text-emerald-400" },
                    { label: "Open",           value: Math.max(data.issues.totalOpened - data.issues.totalClosed, 0), color: "text-amber-400" },
                    { label: "Avg Resolution", value: fmtHrs(data.issues.avgCloseHrs), color: "text-violet-400" },
                    { label: "Close Rate",     value: `${issueCloseRate}%`,     color: "text-cyan-400"    },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-xs text-white/45">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: REPOSITORIES
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "Repositories" && <RepositoriesTab days={days} />}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: TEAMS
        ════════════════════════════════════════════════════════════════════ */}
        {tab === "Teams" && <TeamsTab days={days} />}

      </div>
    </div>
  );
}
