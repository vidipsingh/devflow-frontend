
"use client";

import Link from "next/link";
import {
  Star,
  GitFork,
  Pin,
  Lock,
  Globe,
  GitPullRequest,
  CircleDot,
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Repository } from "@/hooks/useRepository";

interface Props {
  repo: Repository;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
  onEdit: (repo: Repository) => void;
  onDelete: (repo: Repository) => void;
}

function CIBadge({ status }: { status: Repository["ciStatus"] }) {
  if (status === "none") return null;
  const map = {
    passing: { icon: CheckCircle2, color: "text-emerald-400", label: "Passing" },
    failing: { icon: XCircle, color: "text-red-400", label: "Failing" },
    pending: { icon: Clock, color: "text-amber-400", label: "Pending" },
  } as const;
  const { icon: Icon, color, label } = map[status];
  return (
    <span className={`hidden md:flex items-center gap-1 text-[11px] font-medium ${color}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

export default function RepoListRow({ repo, isPinned, onTogglePin, onEdit, onDelete }: Props) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all">
      {/* Language dot */}
      <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${repo.languageColor}`} />

      {/* Name + badges */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Link
          href={`/dashboard/repositories/${repo.name}`}
          className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors truncate"
        >
          {repo.name}
        </Link>
        <span
          className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
            repo.visibility === "private"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {repo.visibility === "private" ? <Lock size={9} /> : <Globe size={9} />}
          {repo.visibility}
        </span>
        {repo.isForked && (
          <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
            fork
          </span>
        )}
      </div>

      {/* Description */}
      <p className="hidden lg:block text-xs text-white/40 truncate max-w-xs">
        {repo.description}
      </p>

      {/* Topics */}
      <div className="hidden xl:flex items-center gap-1.5">
        {repo.topics.slice(0, 2).map((t) => (
          <span
            key={t}
            className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300/80"
          >
            {t}
          </span>
        ))}
      </div>

      {/* CI badge */}
      <CIBadge status={repo.ciStatus} />

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-white/35 flex-shrink-0">
        <span className="flex items-center gap-1"><Star size={11} /> {repo.stars}</span>
        <span className="hidden sm:flex items-center gap-1"><GitFork size={11} /> {repo.forks}</span>
        <span className="hidden md:flex items-center gap-1"><GitPullRequest size={11} /> {repo.openPRs}</span>
        <span className="hidden md:flex items-center gap-1"><CircleDot size={11} /> {repo.openIssues}</span>
      </div>

      {/* Updated */}
      <span className="hidden sm:block text-[11px] text-white/25 flex-shrink-0 w-20 text-right">
        {repo.lastUpdated}
      </span>

      {/* Action buttons — always visible */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(repo)}
          title="Edit"
          className="p-1.5 rounded-lg text-white/35 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(repo)}
          title="Delete"
          className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
        <button
          onClick={() => onTogglePin(repo.id)}
          title={isPinned ? "Unpin" : "Pin"}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isPinned
              ? "text-amber-400 bg-amber-500/15"
              : "text-white/35 hover:text-amber-400 hover:bg-amber-500/10"
          }`}
        >
          <Pin size={13} className={isPinned ? "fill-amber-400" : ""} />
        </button>
      </div>
    </div>
  );
}
