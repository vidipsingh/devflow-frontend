
"use client";

import Link from "next/link";
import {
  Star,
  GitFork,
  GitPullRequest,
  CircleDot,
  Bot,
  Pin,
  Lock,
  Globe,
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
    <span className={`flex items-center gap-1 text-[11px] font-medium ${color}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

export default function RepoGridCard({ repo, isPinned, onTogglePin, onEdit, onDelete }: Props) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/8 bg-gradient-to-b from-[#111117] to-[#0d0d12] transition-all duration-200 hover:border-indigo-500/30 hover:shadow-[0_0_24px_-4px_rgba(99,102,241,0.18)] overflow-hidden">
      {/* top glow on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Main content */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Header row — name + visibility badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                repo.visibility === "private"
                  ? "bg-rose-500/15 text-rose-400"
                  : "bg-indigo-500/15 text-indigo-400"
              }`}
            >
              {repo.isForked ? <GitFork size={15} /> : <CircleDot size={15} />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-white truncate max-w-[140px]">
                  {repo.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                    repo.visibility === "private"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {repo.visibility === "private" ? <Lock size={9} /> : <Globe size={9} />}
                  {repo.visibility}
                </span>
                {repo.isForked && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    fork
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pin button — always visible */}
          <button
            onClick={() => onTogglePin(repo.id)}
            title={isPinned ? "Unpin" : "Pin"}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-all cursor-pointer ${
              isPinned
                ? "text-amber-400 bg-amber-500/15 hover:bg-amber-600/15 "
                : "text-white/30 hover:text-amber-400 hover:bg-amber-500/10"
            }`}
          >
            <Pin size={13} className={isPinned ? "fill-amber-400" : ""} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-white/50 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {repo.description || "No description provided."}
        </p>

        {/* Topics */}
        {repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {repo.topics.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300/80"
              >
                {t}
              </span>
            ))}
            {repo.topics.length > 4 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30">
                +{repo.topics.length - 4}
              </span>
            )}
          </div>
        )}

        {/* CI + AI row */}
        <div className="flex items-center justify-between">
          <CIBadge status={repo.ciStatus} />
          {repo.aiReviews > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-violet-400/80">
              <Bot size={11} />
              {repo.aiReviews} AI reviews
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-white/35 flex-wrap">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${repo.languageColor}`} />
          <span className="text-white/50">{repo.language}</span>
          <span className="flex items-center gap-1"><Star size={11} /> {repo.stars}</span>
          <span className="flex items-center gap-1"><GitFork size={11} /> {repo.forks}</span>
          <span className="flex items-center gap-1"><GitPullRequest size={11} /> {repo.openPRs}</span>
          <span className="flex items-center gap-1"><CircleDot size={11} /> {repo.openIssues}</span>
        </div>
      </div>

      {/* Action footer — always visible */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/6 bg-white/[0.015]">
        {/* Left: updated */}
        <span className="text-[11px] text-white/25">Updated {repo.lastUpdated}</span>

        {/* Right: edit, delete, view */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(repo)}
            title="Edit repository"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
          >
            <Pencil size={11} />
            Edit
          </button>
          <button
            onClick={() => onDelete(repo)}
            title="Delete repository"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <Trash2 size={11} />
            Delete
          </button>
          <Link
            href={`/dashboard/repositories/${repo.name}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
