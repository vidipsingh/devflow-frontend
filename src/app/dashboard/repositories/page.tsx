
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { useRepositoriesPage } from "@/hooks/useRepositoriesPage";
import { useRepoActions } from "@/hooks/useRepoActions";
import type { Repository } from "@/hooks/useRepository";
import RepoStatsBar from "@/components/repositories/RepoStatsBar";
import RepoToolbar from "@/components/repositories/RepoToolbar";
import RepoSection from "@/components/repositories/RepoSection";
import RepoEmptyState from "@/components/repositories/RepoEmptyState";
import EditRepoModal from "@/components/repositories/EditRepoModal";
import DeleteRepoModal from "@/components/repositories/DeleteRepoModal";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-[#111117] to-[#0d0d12] p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/8" />
        <div className="h-4 w-32 rounded bg-white/8" />
        <div className="h-4 w-14 rounded-full bg-white/8 ml-auto" />
      </div>
      <div className="h-3 w-full rounded bg-white/5" />
      <div className="h-3 w-3/4 rounded bg-white/5" />
      <div className="flex gap-1.5 mt-1">
        <div className="h-5 w-12 rounded-full bg-white/8" />
        <div className="h-5 w-16 rounded-full bg-white/8" />
        <div className="h-5 w-10 rounded-full bg-white/8" />
      </div>
      <div className="flex gap-4 pt-2 border-t border-white/5 mt-auto">
        <div className="h-3 w-8 rounded bg-white/8" />
        <div className="h-3 w-8 rounded bg-white/8" />
        <div className="h-3 w-8 rounded bg-white/8" />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-white/8 bg-white/[0.02] animate-pulse" />
        ))}
      </div>
      <div className="h-11 rounded-xl border border-white/8 bg-white/[0.02] mb-6 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-white/60 mb-1.5">Failed to load repositories</h3>
      <p className="text-sm text-white/30 max-w-xs leading-relaxed mb-5">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/15 transition-all"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RepositoriesPage() {
  const {
    stats,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    visibilityFilter,
    setVisibilityFilter,
    sortKey,
    setSortKey,
    pinnedIds,
    togglePin,
    pinnedRepos,
    unpinnedRepos,
    filtered,
    isLoading,
    error,
    refetch,
  } = useRepositoriesPage();

  const { updateRepo, deleteRepo, isSubmitting } = useRepoActions();

  // Modal state
  const [editTarget, setEditTarget] = useState<Repository | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Repository | null>(null);

  const hasResults = filtered.length > 0;
  const hasSearch = searchQuery.trim().length > 0 || visibilityFilter !== "all";

  // Edit handler — calls API then refetches
  async function handleSave(slug: string, payload: Parameters<typeof updateRepo>[1]) {
    const result = await updateRepo(slug, payload);
    if (result.ok) {
      refetch();
      setEditTarget(null);
    }
    return result;
  }

  // Delete handler — calls API then refetches
  async function handleDelete(slug: string) {
    const result = await deleteRepo(slug);
    if (result.ok) {
      refetch();
      setDeleteTarget(null);
    }
    return result;
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Repositories</h1>
          <p className="text-sm text-white/40 mt-1">Manage and explore your repositories</p>
        </div>
        <Link
          href="/dashboard/repositories/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          New repository
        </Link>
      </div>

      {/* Loading */}
      {isLoading && <LoadingState />}

      {/* Error */}
      {!isLoading && error && <ErrorState message={error} onRetry={refetch} />}

      {/* Content */}
      {!isLoading && !error && (
        <>
          <RepoStatsBar stats={stats} />

          <RepoToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            visibilityFilter={visibilityFilter}
            setVisibilityFilter={setVisibilityFilter}
            sortKey={sortKey}
            setSortKey={setSortKey}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {hasResults ? (
            <>
              <RepoSection
                title="Pinned"
                repos={pinnedRepos}
                pinnedIds={pinnedIds}
                onTogglePin={togglePin}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                viewMode={viewMode}
                badge={pinnedRepos.length}
              />
              <RepoSection
                title="All repositories"
                repos={unpinnedRepos}
                pinnedIds={pinnedIds}
                onTogglePin={togglePin}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                viewMode={viewMode}
                badge={unpinnedRepos.length}
              />
            </>
          ) : (
            <RepoEmptyState
              hasSearch={hasSearch}
              onClearSearch={() => {
                setSearchQuery("");
                setVisibilityFilter("all");
              }}
            />
          )}
        </>
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditRepoModal
          repo={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
          isSaving={isSubmitting}
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteRepoModal
          repo={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDeleting={isSubmitting}
        />
      )}
    </div>
  );
}
