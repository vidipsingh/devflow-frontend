
"use client";

import type { StatCard } from "@/hooks/useDashboard";


// Icons per stat type


function RepoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="2.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 6h6M6 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2l1.63 3.3L14.5 6l-2.75 2.68.65 3.82L9 10.75l-3.4 1.75.65-3.82L3.5 6l3.87-.7L9 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function PRIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="13" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7v4M13 7v1a4 4 0 0 1-4 4H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2l1.2 2.4L13.5 5l-2.25 2.19.53 3.11L9 9.1l-2.78 1.2.53-3.11L4.5 5l3.3-.6L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4 14l2.5 2.5M13.5 14l-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const ICONS: Record<StatCard["icon"], React.ReactNode> = {
  repo:   <RepoIcon />,
  star:   <StarIcon />,
  pr:     <PRIcon />,
  review: <ReviewIcon />,
};

// Gradient map per icon type
const GLOW: Record<StatCard["icon"], string> = {
  repo:   "from-indigo-500/20 to-indigo-500/5",
  star:   "from-amber-500/20 to-amber-500/5",
  pr:     "from-violet-500/20 to-violet-500/5",
  review: "from-cyan-500/20 to-cyan-500/5",
};

const ICON_BG: Record<StatCard["icon"], string> = {
  repo:   "bg-indigo-500/15 text-indigo-400",
  star:   "bg-amber-500/15 text-amber-400",
  pr:     "bg-violet-500/15 text-violet-400",
  review: "bg-cyan-500/15 text-cyan-400",
};


// Single card


function StatCardItem({ card }: { card: StatCard }) {
  return (
    <div className={`relative rounded-2xl border border-white/[0.07] bg-gradient-to-br ${GLOW[card.icon]} p-5 overflow-hidden group hover:border-white/[0.12] transition-all duration-200`}>
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[#0d0d0f]/60" />

      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ICON_BG[card.icon]}`}>
          {ICONS[card.icon]}
        </div>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
            card.positive
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}
        >
          {card.positive ? "↑" : "•"} {card.delta}
        </span>
      </div>

      <div className="relative">
        <p className={`text-3xl font-bold ${card.color} tabular-nums`}>{card.value}</p>
        <p className="text-xs text-[#71717a] mt-1">{card.label}</p>
      </div>
    </div>
  );
}


// Grid


export default function OverviewCards({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((card) => (
        <StatCardItem key={card.label} card={card} />
      ))}
    </div>
  );
}
