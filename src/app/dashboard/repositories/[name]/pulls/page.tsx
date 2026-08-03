
"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePullRequests, PullRequest, PRLabel } from "@/hooks/usePullRequests";

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

function LabelPill({ label }: { label: PRLabel }) {
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

function PRStateIcon({ state }: { state: PullRequest["state"] }) {
  if (state === "merged") {
    return (
      <svg className="w-4 h-4 text-violet-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
      </svg>
    );
  }
  if (state === "closed") {
    return (
      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
    </svg>
  );
}

// ─── PR row ───────────────────────────────────────────────────────────────────
function PRRow({ pr, repoName }: { pr: PullRequest; repoName: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.06] last:border-0">
      <div className="mt-0.5 shrink-0">
        <PRStateIcon state={pr.state} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            href={`/dashboard/repositories/${repoName}/pulls/${pr.number}`}
            className="text-sm font-medium text-white/90 hover:text-indigo-300 transition-colors leading-snug"
          >
            {pr.title}
          </Link>
          {pr.isDraft && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-white/40 bg-white/[0.06] border border-white/[0.08]">
              Draft
            </span>
          )}
          {(pr.labels ?? []).map((l) => (
            <LabelPill key={l.name} label={l} />
          ))}
        </div>
        <p className="text-white/35 text-xs mt-1">
          #{pr.number}{" "}
          {pr.state === "merged" ? (
            <span>merged {pr.mergedAt ? timeAgo(pr.mergedAt) : ""}</span>
          ) : pr.state === "closed" ? (
            <span>closed {pr.closedAt ? timeAgo(pr.closedAt) : ""}</span>
          ) : (
            <span>opened {timeAgo(pr.createdAt)}</span>
          )}{" "}
          by <span className="text-white/50">{pr.authorName}</span>
          <span className="ml-2 text-white/25">
            {pr.headBranch}
            <span className="mx-1 text-white/15">→</span>
            {pr.baseBranch}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 mt-0.5">
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
export default function PullsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const { prs, total, loading, error, fetchPRs } = usePullRequests(name);

  const [tab, setTab] = useState<"open" | "closed" | "merged">("open");

  const load = useCallback(
    (state: "open" | "closed" | "merged") => fetchPRs(state),
    [fetchPRs]
  );

  useEffect(() => {
    load(tab);
  }, [tab, load]);

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
          <span className="text-white/70">Pull Requests</span>
        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-white">Pull Requests</h1>
          <Link
            href={`/dashboard/repositories/${name}/pulls/new`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New pull request
          </Link>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d0d14]">
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

          {/* ── PR list ───────────────────────────────────────────── */}
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
          ) : prs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <svg className="w-7 h-7 text-white/20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-white/50 text-sm font-medium">No {tab} pull requests</p>
                <p className="text-white/25 text-xs mt-1">
                  {tab === "open"
                    ? "Create a pull request to propose and collaborate on changes."
                    : tab === "merged"
                    ? "No pull requests have been merged yet."
                    : "No pull requests have been closed yet."}
                </p>
              </div>
              {tab === "open" && (
                <Link
                  href={`/dashboard/repositories/${name}/pulls/new`}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Open a pull request →
                </Link>
              )}
            </div>
          ) : (
            <div>
              {prs.map((pr) => (
                <PRRow key={pr.id} pr={pr} repoName={name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
