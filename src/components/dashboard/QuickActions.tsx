
"use client";

import Link from "next/link";
import type { DashboardUser } from "@/hooks/useDashboard";


// Action definitions


interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;   // icon bg+text
  border: string;  // hover border color
}

const ACTIONS: QuickAction[] = [
  {
    label: "New repository",
    description: "Start a new project",
    href: "/dashboard/repositories/new",
    color: "bg-indigo-500/15 text-indigo-400",
    border: "hover:border-indigo-500/30",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <rect x="2.5" y="2.5" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8.5 5.5v6M5.5 8.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "New pull request",
    description: "Propose code changes",
    href: "/dashboard/pulls/new",
    color: "bg-violet-500/15 text-violet-400",
    border: "hover:border-violet-500/30",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 7v3M12 7v1a4 4 0 0 1-4 4H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "AI Code Review",
    description: "Run AI review on a PR",
    href: "/dashboard/ai",
    color: "bg-cyan-500/15 text-cyan-400",
    border: "hover:border-cyan-500/30",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M8.5 2l1.3 2.6L13 5.4l-2.25 2.19.53 3.11L8.5 9.5l-2.78 1.2.53-3.11L4 5.4l3.2-.8L8.5 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M3.5 13l2 2M13.5 13l-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Browse marketplace",
    description: "Find or sell snippets",
    href: "/dashboard/marketplace",
    color: "bg-emerald-500/15 text-emerald-400",
    border: "hover:border-emerald-500/30",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M2.5 4h12l-1.5 7H4L2.5 4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <circle cx="6" cy="14.5" r="1" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="11" cy="14.5" r="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    label: "Invite teammate",
    description: "Collaborate with your team",
    href: "/dashboard/team",
    color: "bg-amber-500/15 text-amber-400",
    border: "hover:border-amber-500/30",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 14c0-2.76 2.24-5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M13 10v4M11 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    description: "View code quality insights",
    href: "/dashboard/analytics",
    color: "bg-rose-500/15 text-rose-400",
    border: "hover:border-rose-500/30",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M3 12l3.5-4.5 3 2.5 4-5.5 1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];


// GamificationStrip — shows XP, level, badges


function GamificationStrip({ user }: { user: DashboardUser }) {
  const pct = Math.round((user.xp / user.xpToNext) * 100);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f14] p-4">
      {/* Level + XP */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
            {user.level}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Level {user.level}</p>
            <p className="text-[10px] text-[#52525b]">{user.xp} / {user.xpToNext} XP</p>
          </div>
        </div>
        <span className="text-sm text-orange-400 font-semibold">🔥 {user.streak}d</span>
      </div>

      {/* XP bar */}
      <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {user.badges.map((badge) => (
          <span
            key={badge}
            className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.07] text-[#a1a1aa]"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}


// QuickActions


export default function QuickActions({ user }: { user: DashboardUser }) {
  return (
    <div className="space-y-4">
      {/* Gamification card */}
      <GamificationStrip user={user} />

      {/* Action grid */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f14] p-4">
        <h3 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-3">
          Quick actions
        </h3>
        <div className="grid grid-cols-1 gap-1.5">
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] ${action.border} hover:bg-white/[0.05] transition-all duration-150 group`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white group-hover:text-white/90 truncate">
                  {action.label}
                </p>
                <p className="text-[10px] text-[#52525b] truncate">{action.description}</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#3f3f46] group-hover:text-[#71717a] transition-colors flex-shrink-0">
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
