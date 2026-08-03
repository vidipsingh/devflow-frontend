
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function getToken() {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PRLabel {
  name: string;
  color: string;
}

interface PullRequest {
  id: string;
  number: number;
  repoSlug: string;
  title: string;
  state: "open" | "closed" | "merged";
  authorName: string;
  headBranch: string;
  baseBranch: string;
  labels: PRLabel[];
  commentCount: number;
  additions: number;
  deletions: number;
  isDraft: boolean;
  mergedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

interface Repo {
  id: string;
  name: string;
  slug: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

// ─── PR row ───────────────────────────────────────────────────────────────────
function PRRow({ pr }: { pr: PullRequest }) {
  const stateColor =
    pr.state === "merged" ? "text-violet-400"
    : pr.state === "closed" ? "text-red-400"
    : "text-emerald-400";

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.06] last:border-0 group">
      {/* State icon */}
      <div className={`mt-0.5 shrink-0 ${stateColor}`}>
        {pr.state === "merged" ? (
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
          </svg>
        ) : pr.state === "closed" ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            href={`/dashboard/repositories/${pr.repoSlug}/pulls/${pr.number}`}
            className="text-sm font-medium text-white/90 hover:text-indigo-300 transition-colors leading-snug"
          >
            {pr.title}
          </Link>
          {pr.isDraft && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-white/35 bg-white/[0.05] border border-white/[0.08]">
              Draft
            </span>
          )}
          {(pr.labels ?? []).map((l) => {
            const bg = l.color ? (l.color.startsWith("#") ? l.color : "#" + l.color) : "#6366f1";
            return (
              <span
                key={l.name}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}
              >
                {l.name}
              </span>
            );
          })}
        </div>
        <p className="text-white/30 text-xs mt-1">
          <Link
            href={`/dashboard/repositories/${pr.repoSlug}/pulls`}
            className="text-indigo-400/70 hover:text-indigo-300 transition-colors"
          >
            {pr.repoSlug}
          </Link>
          <span className="mx-1 text-white/15">·</span>
          #{pr.number}
          <span className="mx-1 text-white/15">·</span>
          {pr.state === "merged"
            ? `merged ${pr.mergedAt ? timeAgo(pr.mergedAt) : ""}`
            : pr.state === "closed"
            ? `closed ${pr.closedAt ? timeAgo(pr.closedAt) : ""}`
            : `opened ${timeAgo(pr.createdAt)}`}{" "}
          by <span className="text-white/45">{pr.authorName}</span>
          <span className="ml-2 text-white/20 font-mono text-[10px]">
            {pr.headBranch} → {pr.baseBranch}
          </span>
        </p>
      </div>

      {/* Right stats */}
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        {(pr.additions > 0 || pr.deletions > 0) && (
          <div className="hidden sm:flex items-center gap-1 text-xs">
            {pr.additions > 0 && <span className="text-teal-400 font-mono">+{pr.additions}</span>}
            {pr.deletions > 0 && <span className="text-rose-400 font-mono">-{pr.deletions}</span>}
          </div>
        )}
        {pr.commentCount > 0 && (
          <div className="flex items-center gap-1 text-white/30 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {pr.commentCount}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GlobalPullsPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);

  const [selectedRepo, setSelectedRepo] = useState<string>("__all__");
  const [tab, setTab] = useState<"open" | "closed" | "merged">("open");

  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch user repos ─────────────────────────────────────────────────────
  const fetchRepos = useCallback(async () => {
    setReposLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/repositories`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setRepos(json.data?.repositories ?? []);
    } catch {
      // ignore
    } finally {
      setReposLoading(false);
    }
  }, []);

  useEffect(() => { fetchRepos(); }, [fetchRepos]);

  // ── Fetch PRs across selected repo(s) ───────────────────────────────────
  const fetchPRs = useCallback(async () => {
    if (repos.length === 0 && !reposLoading) return;
    setLoading(true);
    setError(null);
    try {
      const targets = selectedRepo === "__all__" ? repos : repos.filter((r) => r.slug === selectedRepo);
      const results = await Promise.all(
        targets.map(async (repo) => {
          try {
            const res = await fetch(
              `${API_BASE}/api/v1/repositories/${repo.slug}/pulls?state=${tab}`,
              { headers: authHeaders() }
            );
            const json = await res.json();
            if (!json.success) return [];
            return (json.data?.pullRequests ?? []) as PullRequest[];
          } catch {
            return [];
          }
        })
      );
      const all = results.flat().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPrs(all);
      setTotal(all.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [repos, selectedRepo, tab, reposLoading]);

  useEffect(() => {
    if (!reposLoading) fetchPRs();
  }, [fetchPRs, reposLoading]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
                </svg>
              </div>
              Pull Requests
            </h1>
            <p className="text-white/35 text-sm mt-1 ml-12">
              Pull requests across all your repositories
            </p>
          </div>
        </div>

        {/* ── Toolbar: repo filter + state tabs ──────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Repo filter */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              disabled={reposLoading}
              className="bg-[#0d0d14] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:border-indigo-400/40 cursor-pointer appearance-none pr-8 min-w-[180px]"
            >
              <option value="__all__">All repositories</option>
              {repos.map((r) => (
                <option key={r.id} value={r.slug}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Stats chips */}
          <div className="flex items-center gap-2 text-xs text-white/35">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {loading ? "…" : tab === "open" ? total : "?"} open
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
              merged
            </span>
          </div>
        </div>

        {/* ── Main list panel ─────────────────────────────────────────────── */}
        <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d0d14]">

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            {/* Open */}
            <button
              onClick={() => setTab("open")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "open" ? "text-white bg-white/[0.07]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
              </svg>
              {tab === "open" ? `${total} Open` : "Open"}
            </button>

            {/* Closed */}
            <button
              onClick={() => setTab("closed")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "closed" ? "text-white bg-white/[0.07]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {tab === "closed" ? `${total} Closed` : "Closed"}
            </button>

            {/* Merged */}
            <button
              onClick={() => setTab("merged")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "merged" ? "text-white bg-white/[0.07]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
              </svg>
              {tab === "merged" ? `${total} Merged` : "Merged"}
            </button>
          </div>

          {/* Content */}
          {loading || reposLoading ? (
            <div className="flex flex-col">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.05] last:border-0 animate-pulse">
                  <div className="w-4 h-4 mt-0.5 rounded-full bg-white/[0.06] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-white/[0.06] rounded w-2/3" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-red-400 text-sm gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          ) : prs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                <svg className="w-8 h-8 text-white/15" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-white/50 text-sm font-medium">No {tab} pull requests</p>
                <p className="text-white/25 text-xs mt-1">
                  {repos.length === 0
                    ? "Create a repository first, then open pull requests."
                    : tab === "open"
                    ? "All caught up! No open pull requests across your repositories."
                    : tab === "merged"
                    ? "No pull requests have been merged yet."
                    : "No pull requests have been closed yet."}
                </p>
              </div>
              {repos.length > 0 && tab === "open" && (
                <Link
                  href={`/dashboard/repositories/${repos[0]?.slug}/pulls/new`}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Open a pull request →
                </Link>
              )}
            </div>
          ) : (
            <div>
              {prs.map((pr) => (
                <PRRow key={`${pr.repoSlug}-${pr.id}`} pr={pr} />
              ))}
            </div>
          )}
        </div>

        {/* ── Quick links ─────────────────────────────────────────────────── */}
        {repos.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/20 text-xs">Go to repo PRs:</span>
            {repos.slice(0, 8).map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/repositories/${r.slug}/pulls`}
                className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
              >
                {r.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
