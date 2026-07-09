
"use client";

import type { Repository } from "@/hooks/useRepository";
import type { ViewMode } from "@/hooks/useRepositoriesPage";
import RepoGridCard from "./RepoGridCard";
import RepoListRow from "./RepoListRow";

interface Props {
  title: string;
  repos: Repository[];
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
  onEdit: (repo: Repository) => void;
  onDelete: (repo: Repository) => void;
  viewMode: ViewMode;
  badge?: number;
}

export default function RepoSection({
  title,
  repos,
  pinnedIds,
  onTogglePin,
  onEdit,
  onDelete,
  viewMode,
  badge,
}: Props) {
  if (repos.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
          {title}
        </h2>
        {badge !== undefined && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/40">
            {badge}
          </span>
        )}
        <div className="flex-1 h-px bg-white/6" />
      </div>

      {/* Cards */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <RepoGridCard
              key={repo.id}
              repo={repo}
              isPinned={pinnedIds.includes(repo.id)}
              onTogglePin={onTogglePin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {repos.map((repo) => (
            <RepoListRow
              key={repo.id}
              repo={repo}
              isPinned={pinnedIds.includes(repo.id)}
              onTogglePin={onTogglePin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
