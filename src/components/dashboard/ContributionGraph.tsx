
"use client";

import { useMemo, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DayCell {
  date: string; // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

// ─── Level → color classes ────────────────────────────────────────────────────
const LEVEL_CLASSES: Record<DayCell["level"], string> = {
  0: "bg-white/[0.04]",
  1: "bg-indigo-500/25",
  2: "bg-indigo-500/50",
  3: "bg-indigo-400/75",
  4: "bg-indigo-400",
};

// ─── Month labels ─────────────────────────────────────────────────────────────
function getMonthLabels(weeks: DayCell[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].date).getMonth();
    if (m !== lastMonth) {
      labels.push({
        label: new Date(week[0].date).toLocaleString("default", { month: "short" }),
        col: wi,
      });
      lastMonth = m;
    }
  });
  return labels;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Build grid from a date→count map ────────────────────────────────────────
function buildGrid(countMap: Map<string, number>): DayCell[][] {
  const weeks: DayCell[][] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 363);
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - cursor.getDay()); // align Sunday

  while (cursor <= today) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = cursor.toISOString().split("T")[0];
      const isFuture = cursor > today;
      const count = isFuture ? 0 : (countMap.get(date) ?? 0);
      const level: DayCell["level"] =
        count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4;
      week.push({ date, count, level });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tooltip({ date, count }: { date: string; count: number }) {
  const d = new Date(date);
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 pointer-events-none">
      <div className="bg-[#1a1a26] border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-xs text-white whitespace-nowrap shadow-xl">
        <span className="font-semibold text-indigo-300">{count}</span>
        <span className="text-white/50"> commit{count !== 1 ? "s" : ""}</span>
        <span className="text-white/30"> · {label}</span>
      </div>
    </div>
  );
}

// ─── Day cell with hover tooltip ─────────────────────────────────────────────
function DaySquare({ day }: { day: DayCell }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`w-[10px] h-[10px] rounded-sm flex-shrink-0 cursor-default transition-all duration-75 ${
          LEVEL_CLASSES[day.level]
        } ${hovered && day.count > 0 ? "ring-1 ring-indigo-300/50 scale-110" : ""}`}
      />
      {hovered && <Tooltip date={day.date} count={day.count} />}
    </div>
  );
}

// ─── API helpers ─────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function getToken(): string | null {
  try { return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null; }
  catch { return null; }
}

// ─── ContributionGraph ────────────────────────────────────────────────────────
interface Props {
  streak: number;
  totalThisYear?: number;
}

export default function ContributionGraph({ streak }: Props) {
  const [countMap, setCountMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContributions() {
      const token = getToken();
      if (!token) { setLoading(false); return; }

      try {
        // Fetch all repos first
        const reposRes = await fetch(`${API_BASE}/api/v1/repositories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!reposRes.ok) { setLoading(false); return; }
        const reposJson = await reposRes.json();
        const repos: { name: string }[] = reposJson?.data?.repositories ?? [];

        // Fetch commits for each repo in parallel (up to 10 repos)
        const map = new Map<string, number>();

        await Promise.allSettled(
          repos.slice(0, 10).map(async (repo) => {
            try {
              const res = await fetch(
                `${API_BASE}/api/v1/repositories/${repo.name}/commits?ref=main&limit=200`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (!res.ok) return;
              const j = await res.json();
              const commits: { createdAt: string }[] = j?.data?.commits ?? [];
              commits.forEach((c) => {
                const date = c.createdAt.split("T")[0];
                map.set(date, (map.get(date) ?? 0) + 1);
              });
            } catch { /* skip failed repo */ }
          })
        );

        setCountMap(new Map(map));
      } catch { /* silently degrade */ }
      finally { setLoading(false); }
    }

    fetchContributions();
  }, []);

  const weeks = useMemo(() => buildGrid(countMap), [countMap]);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const total = useMemo(
    () => [...countMap.values()].reduce((a, b) => a + b, 0),
    [countMap]
  );

  // Compute real streak from countMap
  const realStreak = useMemo(() => {
    let s = 0;
    const cursor = new Date();
    while (true) {
      const d = cursor.toISOString().split("T")[0];
      if ((countMap.get(d) ?? 0) > 0) { s++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
    return s;
  }, [countMap]);

  const displayStreak = realStreak > 0 ? realStreak : streak;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f14] p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Contribution Activity</h3>
          <p className="text-[11px] text-[#52525b] mt-0.5">
            {loading ? (
              <span className="inline-block w-28 h-3 rounded bg-white/[0.06] animate-pulse" />
            ) : (
              <>{total} contribution{total !== 1 ? "s" : ""} in the last year</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="text-right">
            <p className="text-base font-bold text-orange-400 flex items-center gap-1 justify-end">
              🔥 <span>{displayStreak}d</span>
            </p>
            <p className="text-[10px] text-[#52525b]">current streak</p>
          </div>
          {/* Total badge */}
          <div className="text-right hidden sm:block">
            <p className="text-base font-bold text-indigo-400">{total}</p>
            <p className="text-[10px] text-[#52525b]">this year</p>
          </div>
        </div>
      </div>

      {/* Graph */}
      {loading ? (
        <div className="h-[88px] rounded-xl bg-white/[0.03] animate-pulse" />
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels */}
            <div className="flex gap-[3px] mb-1 ml-8">
              {weeks.map((_, wi) => {
                const lbl = monthLabels.find((m) => m.col === wi);
                return (
                  <div key={wi} className="w-[10px] flex-shrink-0">
                    {lbl && (
                      <span className="text-[9px] text-[#52525b] whitespace-nowrap">
                        {lbl.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day rows */}
            <div className="flex gap-[3px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] mr-1.5">
                {DAYS.map((d, i) => (
                  <div key={d} className="h-[10px] flex items-center">
                    {i % 2 === 1 && (
                      <span className="text-[8px] text-[#3f3f46] w-6 text-right pr-1">
                        {d.slice(0, 3)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <DaySquare key={day.date} day={day} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-[#3f3f46]">Less</span>
        {([0, 1, 2, 3, 4] as DayCell["level"][]).map((l) => (
          <div key={l} className={`w-[10px] h-[10px] rounded-sm ${LEVEL_CLASSES[l]}`} />
        ))}
        <span className="text-[10px] text-[#3f3f46]">More</span>
      </div>
    </div>
  );
}
