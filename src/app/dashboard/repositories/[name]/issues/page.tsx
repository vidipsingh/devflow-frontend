
"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useIssues, Issue, IssueLabel } from "@/hooks/useIssues";

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
  const bg = label.color ? `#${label.color.replace("#", "")}` : "#6366f1";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}
    >
      {label.name}
    </span>
  );
}

// ─── Issue row ────────────────────────────────────────────────────────────────
function IssueRow({ issue, repoName }: { issue: Issue; repoName: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.06] last:border-0">
      {/* State icon */}
      <div className="mt-0.5 shrink-0">
        {issue.state === "open" ? (
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            href={`/dashboard/repositories/${repoName}/issues/${issue.number}`}
            className="text-sm font-medium text-white/90 hover:text-indigo-300 transition-colors leading-snug"
          >
            {issue.title}
          </Link>
          {issue.isPinned && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Pinned
            </span>
          )}
          {issue.isLocked && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-red-400 bg-red-400/10 border border-red-400/20">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Locked
            </span>
          )}
          {issue.labels.map((l) => (
            <LabelPill key={l.name} label={l} />
          ))}
        </div>
        <p className="text-white/35 text-xs mt-1">
          #{issue.number} opened {timeAgo(issue.createdAt)} by{" "}
          <span className="text-white/50">{issue.authorName}</span>
          {issue.milestone && (
            <span className="ml-2 text-violet-400">• {issue.milestone}</span>
          )}
        </p>
      </div>

      {/* Comment count */}
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
export default function IssuesPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const { issues, total, loading, error, fetchIssues } = useIssues(name);

  const [tab, setTab] = useState<"open" | "closed">("open");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const load = useCallback(
    (state: "open" | "closed", p: number) => fetchIssues(state, p, LIMIT),
    [fetchIssues]
  );

  useEffect(() => {
    load(tab, page);
  }, [tab, page, load]);

  const openCount = tab === "open" ? total : null;
  const closedCount = tab === "closed" ? total : null;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/dashboard/repositories" className="hover:text-white transition-colors">
            Repositories
          </Link>
          <span className="text-white/20">/</span>
          <Link href={`/dashboard/repositories/${name}`} className="hover:text-white transition-colors">
            {name}
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70">Issues</span>
        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-white">Issues</h1>
          <Link
            href={`/dashboard/repositories/${name}/issues/new`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New issue
          </Link>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d0d14]">
          <div className="flex items-center gap-1 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            <button
              onClick={() => { setTab("open"); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "open"
                  ? "text-white bg-white/[0.07]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tab === "open" && openCount !== null ? `${openCount} Open` : "Open"}
            </button>
            <button
              onClick={() => { setTab("closed"); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "closed"
                  ? "text-white bg-white/[0.07]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tab === "closed" && closedCount !== null ? `${closedCount} Closed` : "Closed"}
            </button>
          </div>

          {/* ── Issue list ────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col gap-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.06] last:border-0 animate-pulse">
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
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white/50 text-sm font-medium">No {tab} issues</p>
                <p className="text-white/25 text-xs mt-1">
                  {tab === "open"
                    ? "Create a new issue to track bugs or feature requests."
                    : "No issues have been closed yet."}
                </p>
              </div>
              {tab === "open" && (
                <Link
                  href={`/dashboard/repositories/${name}/issues/new`}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Open a new issue →
                </Link>
              )}
            </div>
          ) : (
            <div>
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} repoName={name} />
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
            <span className="text-white/30 text-sm">
              Page {page} of {totalPages}
            </span>
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
