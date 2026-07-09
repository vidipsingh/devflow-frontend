
"use client";

import { useState, useMemo } from "react";
import { useRepository } from "./useRepository";

// Types
export type ViewMode = "grid" | "list";

export interface RepoStats {
  total: number;
  publicCount: number;
  totalStars: number;
  openPRs: number;
}

export interface UseRepositoriesPageReturn
  extends ReturnType<typeof useRepository> {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  stats: RepoStats;
  pinnedRepos: ReturnType<typeof useRepository>["filtered"];
  unpinnedRepos: ReturnType<typeof useRepository>["filtered"];
}

// Hook
export function useRepositoriesPage(): UseRepositoriesPageReturn {
  const repo = useRepository();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const stats = useMemo<RepoStats>(() => {
    const all = repo.repositories;
    return {
      total: all.length,
      publicCount: all.filter((r) => r.visibility === "public").length,
      totalStars: all.reduce((acc, r) => acc + r.stars, 0),
      openPRs: all.reduce((acc, r) => acc + r.openPRs, 0),
    };
  }, [repo.repositories]);

  const pinnedRepos = useMemo(
    () => repo.filtered.filter((r) => repo.pinnedIds.includes(r.id)),
    [repo.filtered, repo.pinnedIds]
  );

  const unpinnedRepos = useMemo(
    () => repo.filtered.filter((r) => !repo.pinnedIds.includes(r.id)),
    [repo.filtered, repo.pinnedIds]
  );

  return {
    ...repo,
    viewMode,
    setViewMode,
    stats,
    pinnedRepos,
    unpinnedRepos,
  };
}
