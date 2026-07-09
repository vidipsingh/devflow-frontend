
"use client";

import Link from "next/link";
import type { Repository, SortKey, UseRepositoryReturn } from "@/hooks/useRepository";


// CI status badge


function CIBadge({ status }: { status: Repository["ciStatus"] }) {
  if (status === "none") return null;
  const map = {
    passing: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    failing: "bg-red-500/10 border-red-500/20 text-red-400",
    pending: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };
  const label = { passing: "✓ CI", failing: "✗ CI", pending: "⏳ CI" };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${map[status]}`}>
      {label[status]}
    </span>
  );
}


// Language dot


function LangDot({ color, language }: { color: string; language: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-[#71717a]">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {language}
    </span>
  );
}


// Single repo card


function RepoCard({
  repo,
  pinned,
  onTogglePin,
}: {
  repo: Repository;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/[0.07] bg-[#0f0f14] hover:border-white/[0.12] hover:bg-[#111116] transition-all duration-200 p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Fork indicator */}
          {repo.isForked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#52525b] flex-shrink-0">
              <circle cx="3" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
              <circle cx="3" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
              <circle cx="9" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
              <path d="M3 4v4M9 4v1a3 3 0 0 1-3 3H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          )}
          <Link
            href={`/dashboard/${repo.name}`}
            className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors truncate"
          >
            {repo.name}
          </Link>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md border flex-shrink-0 ${
            repo.visibility === "private"
              ? "bg-white/[0.04] border-white/[0.08] text-[#71717a]"
              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          }`}>
            {repo.visibility}
          </span>
        </div>

        {/* Pin button */}
        <button
          onClick={onTogglePin}
          title={pinned ? "Unpin" : "Pin"}
          className={`flex-shrink-0 p-1 rounded-lg transition-all ${
            pinned
              ? "text-amber-400 hover:text-amber-300"
              : "text-[#3f3f46] hover:text-[#71717a] opacity-0 group-hover:opacity-100"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill={pinned ? "currentColor" : "none"}>
            <path d="M8 2L11 5l-1.5 1.5-1-1-2 2v2l-1 1-3-3 1-1h2l2-2-1-1L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M2 11l3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Description */}
      <p className="text-[12px] text-[#71717a] leading-relaxed mb-3 line-clamp-2 min-h-[32px]">
        {repo.description || "No description provided."}
      </p>

      {/* Topics */}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {repo.topics.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
              {t}
            </span>
          ))}
          {repo.topics.length > 3 && (
            <span className="text-[10px] text-[#52525b]">+{repo.topics.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center flex-wrap gap-3">
        <LangDot color={repo.languageColor} language={repo.language} />
        <CIBadge status={repo.ciStatus} />

        <span className="flex items-center gap-1 text-[11px] text-[#71717a]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l1.2 2.4L10 3.9l-2 1.95.47 2.75L6 7.5 3.53 8.6l.47-2.75L2 3.9l2.8-.5L6 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
          {repo.stars}
        </span>

        <span className="flex items-center gap-1 text-[11px] text-[#71717a]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="3" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="3" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="9" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M3 4v4M9 4v1a3 3 0 0 1-3 3H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          {repo.forks}
        </span>

        {repo.openPRs > 0 && (
          <span className="text-[11px] text-violet-400">{repo.openPRs} PR{repo.openPRs !== 1 ? "s" : ""}</span>
        )}
        {repo.openIssues > 0 && (
          <span className="text-[11px] text-rose-400">{repo.openIssues} issue{repo.openIssues !== 1 ? "s" : ""}</span>
        )}

        <span className="ml-auto text-[10px] text-[#3f3f46]">Updated {repo.lastUpdated}</span>
      </div>
    </div>
  );
}


// Toolbar (search + filters)


function Toolbar({
  searchQuery,
  setSearchQuery,
  sortKey,
  setSortKey,
  visibilityFilter,
  setVisibilityFilter,
  total,
}: Pick<UseRepositoryReturn, "searchQuery" | "setSearchQuery" | "sortKey" | "setSortKey" | "visibilityFilter" | "setVisibilityFilter"> & { total: number }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b] w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder={`Search ${total} repositories…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs text-white placeholder-[#52525b] transition-all"
        />
      </div>

      {/* Sort */}
      <select
        value={sortKey}
        onChange={(e) => setSortKey(e.target.value as SortKey)}
        className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#a1a1aa] focus:outline-none focus:border-indigo-500/40 cursor-pointer appearance-none"
      >
        <option value="updated">Last updated</option>
        <option value="stars">Most stars</option>
        <option value="name">Name</option>
      </select>
    </div>
  );
}


// RepoList


export default function RepoList({
  filtered,
  repositories,
  searchQuery,
  setSearchQuery,
  sortKey,
  setSortKey,
  visibilityFilter,
  setVisibilityFilter,
  pinnedIds,
  togglePin,
}: UseRepositoryReturn) {
  const pinned   = filtered.filter((r) => pinnedIds.includes(r.id));
  const unpinned = filtered.filter((r) => !pinnedIds.includes(r.id));

  return (
    <div>
      <Toolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortKey={sortKey}
        setSortKey={setSortKey}
        visibilityFilter={visibilityFilter}
        setVisibilityFilter={setVisibilityFilter}
        total={repositories.length}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#52525b] text-sm">
          No repositories match &ldquo;{searchQuery}&rdquo;
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pinned */}
          {pinned.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#3f3f46] px-0.5 mb-2">
                📌 Pinned
              </p>
              {pinned.map((r) => (
                <RepoCard key={r.id} repo={r} pinned onTogglePin={() => togglePin(r.id)} />
              ))}
              {unpinned.length > 0 && (
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#3f3f46] px-0.5 mt-4 mb-2">
                  All repositories
                </p>
              )}
            </>
          )}

          {/* Rest */}
          {unpinned.map((r) => (
            <RepoCard key={r.id} repo={r} pinned={false} onTogglePin={() => togglePin(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
