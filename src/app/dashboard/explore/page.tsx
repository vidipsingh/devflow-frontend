
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function getToken() {
  try { return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null; }
  catch { return null; }
}
function authHeaders(): HeadersInit {
  const t = getToken();
  return t
    ? { "Content-Type": "application/json", Authorization: `Bearer ${t}` }
    : { "Content-Type": "application/json" };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface APIRepoStats { stars: number; forks: number; openIssues: number; openPRs: number; }
interface APIRepo {
  id: string; name: string; slug: string; fullName: string;
  description: string; visibility: string; language: string;
  topics: string[]; stats: APIRepoStats; updatedAt: string;
}

const LANG_COLOR: Record<string, string> = {
  Go: "bg-cyan-400", TypeScript: "bg-blue-400", JavaScript: "bg-yellow-400",
  Python: "bg-green-400", Rust: "bg-orange-500", "C++": "bg-rose-400",
  Java: "bg-red-400", Ruby: "bg-pink-400",
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ─── Repo card ────────────────────────────────────────────────────────────────
function RepoCard({ repo }: { repo: APIRepo }) {
  const langColor = LANG_COLOR[repo.language] ?? "bg-white/30";
  const slug = repo.slug ?? repo.name.toLowerCase().replace(/\s+/g, "-");
  // fullName looks like "username/repo-slug" — extract username for display
  const ownerName = repo.fullName?.split("/")[0] ?? "unknown";

  return (
    <Link
      href={`/dashboard/repositories/${slug}`}
      className="group block bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/[0.13] transition-all duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-[11px] text-white/30 mb-0.5 truncate">@{ownerName}</p>
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
            {repo.name}
          </h3>
        </div>
        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          public
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-white/40 line-clamp-2 mb-3 leading-relaxed min-h-[2rem]">
        {repo.description || "No description provided."}
      </p>

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 text-[11px] text-white/30">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${langColor}`} />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 2l1.2 2.4L12 5 9.8 7l.6 2.8L8 8.5 5.6 9.8 6.2 7 4 5l2.8-.6L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          {repo.stats?.stars ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="4.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="4.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="11.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4.5 6v4M11.5 6v1a3 3 0 0 1-3 3H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {repo.stats?.openPRs ?? 0} PRs
        </span>
        <span className="ml-auto">{timeAgo(repo.updatedAt)}</span>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [repos, setRepos] = useState<APIRepo[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPublicRepos = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await fetch(`${API_BASE}/api/v1/public/repos${params}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to fetch");
      setRepos(json.data?.repositories ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load repos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicRepos(debouncedSearch);
  }, [debouncedSearch, fetchPublicRepos]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="#818cf8" strokeWidth="1.3" />
                <path d="M10 6l-3.5 1.5L5 11l3.5-1.5L10 6Z" stroke="#818cf8" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Explore</h1>
              <p className="text-xs text-white/40">Discover public repositories from all users</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search public repositories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Stats row */}
        {!loading && !error && (
          <p className="text-xs text-white/30 mb-5">
            {repos.length === 0
              ? "No public repositories found"
              : `${repos.length} public repositor${repos.length === 1 ? "y" : "ies"} found`}
            {debouncedSearch && ` for "${debouncedSearch}"`}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-white/[0.08] rounded w-1/3 mb-2" />
                <div className="h-4 bg-white/[0.08] rounded w-2/3 mb-3" />
                <div className="h-3 bg-white/[0.06] rounded w-full mb-1" />
                <div className="h-3 bg-white/[0.06] rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="#f87171" strokeWidth="1.3" />
                <path d="M8 5v4M8 11h.01" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/60 mb-1">Failed to load repositories</p>
            <p className="text-xs text-white/30 mb-4">{error}</p>
            <button
              onClick={() => fetchPublicRepos(debouncedSearch)}
              className="px-4 py-2 text-xs font-medium bg-white/[0.05] border border-white/[0.1] rounded-lg hover:bg-white/[0.09] transition-all cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="#52525b" strokeWidth="1.3" />
                <path d="M10 6l-3.5 1.5L5 11l3.5-1.5L10 6Z" stroke="#52525b" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/40 mb-1">No public repositories found</p>
            {debouncedSearch ? (
              <p className="text-xs text-white/25">
                Try a different search term or{" "}
                <button onClick={() => setSearch("")} className="text-indigo-400 hover:underline cursor-pointer">
                  clear search
                </button>
              </p>
            ) : (
              <p className="text-xs text-white/25">
                Public repositories from all users will appear here.
              </p>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && repos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
