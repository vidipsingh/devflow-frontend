
"use client";

import { BookOpen, Globe, Star, GitPullRequest } from "lucide-react";
import type { RepoStats } from "@/hooks/useRepositoriesPage";

interface Props {
  stats: RepoStats;
}

const STAT_CARDS = [
  {
    key: "total" as const,
    label: "Total Repos",
    icon: BookOpen,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  {
    key: "publicCount" as const,
    label: "Public",
    icon: Globe,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    key: "totalStars" as const,
    label: "Total Stars",
    icon: Star,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    key: "openPRs" as const,
    label: "Open PRs",
    icon: GitPullRequest,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
];

export default function RepoStatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, border }) => (
        <div
          key={key}
          className={`flex items-center gap-3 rounded-xl border ${border} ${bg} px-4 py-3`}
        >
          <span className={`flex-shrink-0 p-2 rounded-lg ${bg} ${color}`}>
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold text-white leading-none">
              {stats[key]}
            </p>
            <p className="text-xs text-white/40 mt-0.5 truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
