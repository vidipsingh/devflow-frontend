
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
interface IssueLabel {
  name: string;
  color: string;
}

interface Issue {
  id: string;
  number: number;
  repoSlug: string;
  title: string;
  state: "open" | "closed";
  authorName: string;
  labels: IssueLabel[];
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  milestone: string;
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

function LabelPill({ label }: { label: IssueLabel }) {
  const bg = label.color ? (label.color.startsWith("#") ? label.color : "#" + label.color) : "#6366f1";
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}
    >
      {label.name}
    </span>
  );
}

// ─── Issue row ────────────────────────────────────────────────────────────────
function IssueRow({ issue }: { issue: Issue }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.06] last:border-0">
      <div className="mt-0.5 shrink-0">
        {issue.state === "open" ? (
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            href={`/dashboard/repositories/${issue.repoSlug}/issues/${issue.number}`}
            className="text-sm font-medium text-white/90 hover:text-indigo-300 transition-colors leading-snug"
          >
            {issue.title}
          </Link>
          {issue.isPinned && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20">📌</span>
          )}
          {issue.isLocked && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-red-400 bg-red-400/10 border border-red-400/20">🔒</span>
          )}
          {issue.labels.map((l) => <LabelPill key={l.name} label={l} />)}
        </div>
        <p className="text-white/35 text-xs mt-1">
          <Link
            href={`/dashboard/repositories/${issue.repoSlug}`}
            className="text-indigo-400/70 hover:text-indigo-300 transition-colors mr-1"
          >
            {issue.repoSlug}
          </Link>
          #{issue.number} · opened {timeAgo(issue.createdAt)} by{" "}
          <span className="text-white/50">{issue.authorName}</span>
          {issue.milestone && <span className="ml-2 text-violet-400">· {issue.milestone}</span>}
        </p>
      </div>
      {issue.commentCount > 0 && (
        <div className="flex items-center gap-1 text-white/30 text-xs shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {issue.commentCount}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GlobalIssuesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 20;

  // Fetch all repos for the filter dropdown
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/repositories`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success) setRepos(json.data?.repositories ?? []);
      } catch {/* ignore */}
    };
    fetchRepos();
  }, []);

  const fetchIssues = useCallback(async () => {
    if (selectedRepo === "all" && repos.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const slugsToFetch = selectedRepo === "all"
        ? repos.map((r) => r.slug ?? r.name)
        : [selectedRepo];

      // Fetch issues from all selected repos in parallel
      const results = await Promise.all(
        slugsToFetch.map(async (slug) => {
          const params = new URLSearchParams({ state: tab, page: String(page), limit: String(LIMIT) });
          const res = await fetch(`${API_BASE}/api/v1/repositories/${slug}/issues?${params}`, {
            headers: authHeaders(),
          });
          const json = await res.json();
          if (!json.success) return { issues: [], total: 0 };
          return { issues: (json.data?.issues ?? []) as Issue[], total: (json.data?.total ?? 0) as number };
        })
      );

      const allIssues = results.flatMap((r) => r.issues);
      const allTotal = results.reduce((sum, r) => sum + r.total, 0);

      // Sort combined results by createdAt desc
      allIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setIssues(allIssues);
      setTotal(allTotal);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  }, [selectedRepo, repos, tab, page]);

  useEffect(() => {
    if (repos.length > 0) fetchIssues();
  }, [fetchIssues, repos]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Issues</h1>
            <p className="text-white/40 text-sm mt-1">Track bugs, feature requests, and tasks across your repositories.</p>
          </div>
        </div>

        {/* ── Filters row ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Repo filter */}
          <div className="relative">
            <select
              value={selectedRepo}
              onChange={(e) => { setSelectedRepo(e.target.value); setPage(1); }}
              className="bg-[#0d0d14] border border-white/[0.08] rounded-xl pl-4 pr-8 py-2 text-sm text-white/70 appearance-none focus:outline-none focus:border-indigo-400/40 transition-colors cursor-pointer"
            >
              <option value="all">All repositories</option>
              {repos.map((r) => (
                <option key={r.id} value={r.slug ?? r.name}>{r.name}</option>
              ))}
            </select>
            <svg className="w-3.5 h-3.5 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* ── Issues list ────────────────────────────────────────────────── */}
        <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d0d14]">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            <button
              onClick={() => { setTab("open"); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "open" ? "text-white bg-white/[0.07]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tab === "open" ? `${total} Open` : "Open"}
            </button>
            <button
              onClick={() => { setTab("closed"); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "closed" ? "text-white bg-white/[0.07]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tab === "closed" ? `${total} Closed` : "Closed"}
            </button>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex flex-col gap-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.06] last:border-0 animate-pulse">
                  <div className="w-4 h-4 mt-0.5 rounded-full bg-white/[0.06] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-white/[0.06] rounded w-3/4" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/2" />
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
          ) : repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white/50 text-sm font-medium">No repositories yet</p>
                <p className="text-white/25 text-xs mt-1">Create a repository first to start tracking issues.</p>
              </div>
              <Link
                href="/dashboard/repositories/new"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Create a repository →
              </Link>
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white/50 text-sm font-medium">No {tab} issues</p>
                <p className="text-white/25 text-xs mt-1">
                  {tab === "open"
                    ? "All caught up! No open issues across your repositories."
                    : "No issues have been closed yet."}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50 text-sm hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-white/30 text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50 text-sm hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
