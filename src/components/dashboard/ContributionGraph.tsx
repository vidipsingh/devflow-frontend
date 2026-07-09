
"use client";

import { useMemo } from "react";


// Types


interface DayCell {
  date: string;       // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}


// Generate mock contribution data (52 weeks × 7 days)


function generateContributions(): DayCell[][] {
  const weeks: DayCell[][] = [];
  const today = new Date();
  // Go back 364 days
  const start = new Date(today);
  start.setDate(start.getDate() - 363);

  let cursor = new Date(start);
  // Align to Sunday
  cursor.setDate(cursor.getDate() - cursor.getDay());

  while (cursor <= today) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = cursor.toISOString().split("T")[0];
      const isFuture = cursor > today;
      const isWeekend = d === 0 || d === 6;
      const base = isFuture ? 0 : Math.random();
      // Simulate realistic contribution patterns
      const count = isFuture
        ? 0
        : base > 0.65
        ? Math.floor(Math.random() * (isWeekend ? 4 : 12)) + 1
        : 0;

      const level: DayCell["level"] =
        count === 0 ? 0 :
        count <= 2  ? 1 :
        count <= 5  ? 2 :
        count <= 9  ? 3 : 4;

      week.push({ date, count, level });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}


// Color map


const LEVEL_CLASSES: Record<DayCell["level"], string> = {
  0: "bg-white/[0.05]",
  1: "bg-indigo-500/30",
  2: "bg-indigo-500/55",
  3: "bg-indigo-500/75",
  4: "bg-indigo-400",
};


// Month labels


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


// ContributionGraph


export default function ContributionGraph({ streak, totalThisYear = 0 }: { streak: number; totalThisYear?: number }) {
  const weeks = useMemo(() => generateContributions(), []);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const total = useMemo(
    () => weeks.flat().reduce((sum, d) => sum + d.count, 0),
    [weeks]
  );

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f14] p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Contribution Activity</h3>
          <p className="text-[11px] text-[#52525b] mt-0.5">
            {total} contributions in the last year
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold text-orange-400">🔥 {streak}d</p>
            <p className="text-[10px] text-[#52525b]">current streak</p>
          </div>
        </div>
      </div>

      {/* Graph */}
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
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`}
                    className={`w-[10px] h-[10px] rounded-sm flex-shrink-0 ${LEVEL_CLASSES[day.level]} transition-opacity hover:opacity-80 cursor-default`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

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
