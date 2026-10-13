
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PRLabel {
  name: string;
  color: string;
}

interface PullRequest {
  id: string;
  number: number;
  repoSlug: string;
  repoFullName?: string;  // owner~repo from backend — convert ~ → / for hrefs
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
  fullName?: string;
}

/** Convert backend slug (owner~repo or bare-name) to URL path (owner/repo) */
function slugToPath(slug: string | undefined): string {
  if (!slug) return "";
  return slug.replace(/~/g, "/");
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
  // Backend returns repoFullName as "owner~repo"; convert to "owner/repo" for URLs
  const repoPath = slugToPath(pr.repoFullName ?? pr.repoSlug);
  const repoDisplay = pr.repoFullName
    ? pr.repoFullName.replace(/~/g, "/")
    : pr.repoSlug;

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
            href={`/dashboard/repositories/${repoPath}/pulls/${pr.number}`}
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
            href={`/dashboard/repositories/${repoPath}/pulls`}
            className="text-indigo-400/70 hover:text-indigo-300 transition-colors"
          >
            {repoDisplay}
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
  const [reposLoaded, setReposLoaded] = useState(false);

  const [selectedRepo, setSelectedRepo] = useState<string>("__all__");
  const [tab, setTab] = useState<"open" | "closed" | "merged">("open");
  const [activeLabel, setActiveLabel] = useState("");
  const [allLabels, setAllLabels] = useState<PRLabel[]>([]);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [total, setTotal] = useState(0);

  // Persistent counts shown in ALL tab buttons regardless of which tab is active
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [closedCount, setClosedCount] = useState<number | null>(null);
  const [mergedCount, setMergedCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch user repos once (dropdown only) ───────────────────────────────
  useEffect(() => {
    apiFetch<{ success: boolean; data: { repositories: Repo[] } }>("/api/v1/repositories")
      .then((json) => {
        if (json.success) setRepos(json.data?.repositories ?? []);
      })
      .catch(() => {/* ignore */})
      .finally(() => setReposLoaded(true));
  }, []);

  // ── Fetch counts for ALL three states in parallel on load / repo change ──
  const fetchCounts = useCallback(async () => {
    const repoSlug = selectedRepo === "__all__" ? "" : selectedRepo;
    const base = repoSlug ? `&repo=${encodeURIComponent(repoSlug)}` : "";
    try {
      const [openJson, closedJson, mergedJson] = await Promise.all([
        apiFetch<{ success: boolean; data: { total: number } }>(`/api/v1/pulls?state=open&page=1&limit=1${base}`),
        apiFetch<{ success: boolean; data: { total: number } }>(`/api/v1/pulls?state=closed&page=1&limit=1${base}`),
        apiFetch<{ success: boolean; data: { total: number } }>(`/api/v1/pulls?state=merged&page=1&limit=1${base}`),
      ]);
      if (openJson.success) setOpenCount(openJson.data?.total ?? 0);
      if (closedJson.success) setClosedCount(closedJson.data?.total ?? 0);
      if (mergedJson.success) setMergedCount(mergedJson.data?.total ?? 0);
    } catch {/* ignore count errors */}
  }, [selectedRepo]);

  useEffect(() => {
    if (reposLoaded) fetchCounts();
  }, [fetchCounts, reposLoaded]);

  // ── Fetch PRs — single backend call ─────────────────────────────────────
  const fetchPRs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const repoSlug = selectedRepo === "__all__" ? "" : selectedRepo;
      const params = new URLSearchParams({
        state: tab,
        page: String(page),
        limit: String(LIMIT),
        ...(repoSlug ? { repo: repoSlug } : {}),
        ...(activeLabel ? { label: activeLabel } : {}),
      });
      const json = await apiFetch<{ success: boolean; data: { pullRequests: PullRequest[]; total: number } }>(
        `/api/v1/pulls?${params}`
      );
      if (!json.success) throw new Error("Failed to fetch pull requests");
      const fetchedPRs = json.data?.pullRequests ?? [];
      const fetchedTotal = json.data?.total ?? 0;
      setPrs(fetchedPRs);
      setTotal(fetchedTotal);
      // Keep persistent counts in sync with latest fetch
      if (tab === "open") setOpenCount(fetchedTotal);
      if (tab === "closed") setClosedCount(fetchedTotal);
      if (tab === "merged") setMergedCount(fetchedTotal);
      // Collect unique labels from the fetched PRs for the filter dropdown
      setAllLabels((prev) => {
        const seen = new Set(prev.map((l) => l.name));
        const merged = [...prev];
        fetchedPRs.forEach((pr) => {
          (pr.labels ?? []).forEach((l) => {
            if (!seen.has(l.name)) { seen.add(l.name); merged.push(l); }
          });
        });
        return merged;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [selectedRepo, tab, page, activeLabel]);

  useEffect(() => {
    if (reposLoaded) fetchPRs();
  }, [fetchPRs, reposLoaded]);

  // Reset page when repo / tab / label changes
  const handleRepoChange = (slug: string) => {
    setSelectedRepo(slug);
    setPage(1);
    // Reset counts so they reload for new repo
    setOpenCount(null);
    setClosedCount(null);
    setMergedCount(null);
  };
  const handleTabChange = (t: "open" | "closed" | "merged") => {
    setTab(t);
    setPage(1);
  };
  const clearLabel = () => {
    setActiveLabel("");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

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

        {/* ── Toolbar: repo filter + label filter ────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: repo + label filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Repo select */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <select
                value={selectedRepo}
                onChange={(e) => handleRepoChange(e.target.value)}
                disabled={loading}
                className="bg-[#0d0d14] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:border-indigo-400/40 cursor-pointer appearance-none pr-8 min-w-[180px]"
              >
                <option value="__all__">All repositories</option>
                {repos.map((r) => (
                  <option key={r.id} value={r.slug}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Label dropdown — always visible; options populate after first fetch */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div className="relative">
                <select
                  value={activeLabel}
                  onChange={(e) => { setActiveLabel(e.target.value); setPage(1); }}
                  className="bg-[#0d0d14] border border-white/[0.08] rounded-lg pl-3 pr-8 py-1.5 text-sm text-white/70 appearance-none focus:outline-none focus:border-indigo-400/40 transition-colors cursor-pointer"
                >
                  <option value="">All labels</option>
                  {allLabels.map((l) => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                </select>
                <svg className="w-3.5 h-3.5 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Active label chip */}
            {activeLabel && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-medium">
                <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {activeLabel}
                <button
                  onClick={clearLabel}
                  className="ml-0.5 text-indigo-300/60 hover:text-indigo-200 transition-colors leading-none cursor-pointer"
                  aria-label="Clear label filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        {/* ── Main list panel ─────────────────────────────────────────────── */}
        <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d0d14]">

          {/* Tab bar — counts always visible for all three tabs */}
          <div className="flex items-center gap-1 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            {/* Open */}
            <button
              onClick={() => handleTabChange("open")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "open" ? "text-white bg-white/[0.07]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
              </svg>
              {openCount !== null ? `${openCount} Open` : "Open"}
            </button>

            {/* Closed */}
            <button
              onClick={() => handleTabChange("closed")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "closed" ? "text-white bg-white/[0.07]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {closedCount !== null ? `${closedCount} Closed` : "Closed"}
            </button>

            {/* Merged */}
            <button
              onClick={() => handleTabChange("merged")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === "merged" ? "text-white bg-white/[0.07]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
              </svg>
              {mergedCount !== null ? `${mergedCount} Merged` : "Merged"}
            </button>
          </div>

          {/* Content */}
          {loading ? (
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
                  href={`/dashboard/repositories/${slugToPath(repos[0]?.fullName ?? repos[0]?.slug ?? "")}/pulls/new`}
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

        {/* ── Pagination ──────────────────────────────────────────────────── */}
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

        {/* ── Quick links ─────────────────────────────────────────────────── */}
        {repos.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/20 text-xs">Go to repo PRs:</span>
            {repos.slice(0, 8).map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/repositories/${slugToPath(r.fullName ?? r.slug)}/pulls`}
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
