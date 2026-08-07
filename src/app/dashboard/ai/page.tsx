
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
  return t ? { "Content-Type": "application/json", Authorization: `Bearer ${t}` } : { "Content-Type": "application/json" };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AISuggestion {
  filePath: string;
  lineStart: number;
  lineEnd: number;
  severity: "info" | "warning" | "critical";
  category: string;
  message: string;
  suggestion: string;
}

interface AIReview {
  status: "pending" | "done" | "error" | "skipped";
  summary: string;
  suggestions: AISuggestion[];
  model: string;
  reviewedAt: string | null;
  errorMsg: string;
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
  changedFiles: string[];
  additions: number;
  deletions: number;
  createdAt: string;
  aiReview: AIReview | null;
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

// ─── Status helpers ───────────────────────────────────────────────────────────
function ReviewStatusBadge({ review }: { review: AIReview | null }) {
  if (!review) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] text-white/30 border border-white/[0.07]">
      Not run
    </span>
  );
  if (review.status === "pending") return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Analysing…
    </span>
  );
  if (review.status === "error") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/20">
      ✕ Error
    </span>
  );
  if (review.status === "skipped") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.06] text-white/35 border border-white/[0.09]">
      — Skipped
    </span>
  );
  const critCount = review.suggestions?.filter(s => s.severity === "critical").length ?? 0;
  const warnCount = review.suggestions?.filter(s => s.severity === "warning").length ?? 0;
  const total = review.suggestions?.length ?? 0;
  if (total === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      ✓ Clean
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
      {critCount > 0 && <span className="text-red-400">⚠ {critCount}</span>}
      {warnCount > 0 && <span>◆ {warnCount}</span>}
      {total - critCount - warnCount > 0 && <span className="text-sky-400">ℹ {total - critCount - warnCount}</span>}
    </span>
  );
}

// ─── Compact suggestion row ───────────────────────────────────────────────────
function SuggestionRow({ s }: { s: AISuggestion }) {
  const colorMap = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    info: "text-sky-400 bg-sky-500/10 border-sky-500/15",
  };
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${colorMap[s.severity] ?? colorMap.info}`}>
      <span className="text-xs font-bold mt-0.5 shrink-0">
        {s.severity === "critical" ? "⚠" : s.severity === "warning" ? "◆" : "ℹ"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-[10px] font-mono text-current opacity-70 truncate">{s.filePath}{s.lineStart ? `:${s.lineStart}` : ""}</span>
          <span className="text-[10px] opacity-50 font-medium">{s.category}</span>
        </div>
        <p className="text-xs text-white/70 leading-snug">{s.message}</p>
      </div>
    </div>
  );
}

// ─── PR Review Card ───────────────────────────────────────────────────────────
function PRReviewCard({ pr, expanded, onToggle, onRetrigger }: {
  pr: PullRequest;
  expanded: boolean;
  onToggle: () => void;
  onRetrigger: (slug: string, num: number) => void;
}) {
  const review = pr.aiReview;
  const total = review?.suggestions?.length ?? 0;
  const critCount = review?.suggestions?.filter(s => s.severity === "critical").length ?? 0;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      critCount > 0 ? "border-red-500/20 bg-red-500/[0.02]"
      : review?.status === "done" && total === 0 ? "border-emerald-500/15 bg-emerald-500/[0.02]"
      : review?.status === "pending" ? "border-indigo-500/20 bg-indigo-500/[0.03]"
      : "border-white/[0.08] bg-[#0d0d14]"
    }`}>
      {/* Card header */}
      <button
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
        onClick={onToggle}
      >
        {/* PR state dot */}
        <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
          pr.state === "merged" ? "bg-violet-400"
          : pr.state === "closed" ? "bg-red-400"
          : "bg-emerald-400"
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <Link
              href={`/dashboard/repositories/${pr.repoSlug}/pulls/${pr.number}`}
              className="text-sm font-semibold text-white/85 hover:text-indigo-300 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              {pr.title}
            </Link>
            <ReviewStatusBadge review={review} />
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-white/30">
            <Link
              href={`/dashboard/repositories/${pr.repoSlug}/pulls`}
              className="text-indigo-400/60 hover:text-indigo-300 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              {pr.repoSlug}
            </Link>
            <span className="text-white/15">·</span>
            <span>#{pr.number}</span>
            <span className="text-white/15">·</span>
            <span>{pr.authorName}</span>
            <span className="text-white/15">·</span>
            <span>{timeAgo(pr.createdAt)}</span>
            {review?.reviewedAt && (
              <>
                <span className="text-white/15">·</span>
                <span className="text-indigo-400/50">reviewed {timeAgo(review.reviewedAt)}</span>
              </>
            )}
          </div>
          {review?.summary && (
            <p className="text-xs text-white/40 mt-1.5 leading-relaxed line-clamp-2">{review.summary}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {/* Retrigger button */}
          <button
            onClick={e => { e.stopPropagation(); onRetrigger(pr.repoSlug, pr.number); }}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/25 hover:text-white/60 transition-all cursor-pointer"
            title="Re-run AI review"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <svg
            className={`w-4 h-4 text-white/20 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded suggestions */}
      {expanded && review?.suggestions && review.suggestions.length > 0 && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
          {review.suggestions.map((s, i) => (
            <SuggestionRow key={i} s={s} />
          ))}
        </div>
      )}
      {expanded && review?.status === "done" && (review.suggestions?.length ?? 0) === 0 && (
        <div className="border-t border-white/[0.06] px-4 py-4 flex items-center gap-2 text-emerald-400 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No issues found — code looks clean!
        </div>
      )}
      {expanded && review?.errorMsg && (
        <div className="border-t border-white/[0.06] px-4 py-3 text-xs text-red-400/70">{review.errorMsg}</div>
      )}
    </div>
  );
}

// ─── Stats card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium text-white/60 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AIReviewsPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "pending" | "error" | "clean">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retriggering, setRetriggering] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch repos
      const rRes = await fetch(`${API_BASE}/api/v1/repositories`, { headers: authHeaders() });
      const rJson = await rRes.json();
      const repoList: Repo[] = rJson.data?.repositories ?? [];
      setRepos(repoList);

      // Fetch all PRs across all repos (all states)
      const allPRs: PullRequest[] = [];
      await Promise.all(repoList.map(async (repo) => {
        try {
          const [openRes, mergedRes, closedRes] = await Promise.all([
            fetch(`${API_BASE}/api/v1/repositories/${repo.slug}/pulls?state=open`, { headers: authHeaders() }),
            fetch(`${API_BASE}/api/v1/repositories/${repo.slug}/pulls?state=merged`, { headers: authHeaders() }),
            fetch(`${API_BASE}/api/v1/repositories/${repo.slug}/pulls?state=closed`, { headers: authHeaders() }),
          ]);
          for (const res of [openRes, mergedRes, closedRes]) {
            const j = await res.json();
            if (j.success) allPRs.push(...(j.data?.pullRequests ?? []));
          }
        } catch { /* skip */ }
      }));

      // Sort by createdAt desc
      allPRs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPrs(allPRs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleRetrigger(repoSlug: string, prNumber: number) {
    const key = `${repoSlug}-${prNumber}`;
    setRetriggering(key);
    try {
      await fetch(`${API_BASE}/api/v1/repositories/${repoSlug}/pulls/${prNumber}/ai-review`, {
        method: "POST", headers: authHeaders(),
      });
      // Optimistically update status
      setPrs(prev => prev.map(p =>
        p.repoSlug === repoSlug && p.number === prNumber
          ? { ...p, aiReview: { status: "pending", summary: "", suggestions: [], model: "", reviewedAt: null, errorMsg: "" } }
          : p
      ));
    } catch { /* ignore */ }
    finally { setRetriggering(null); }
  }

  // ── Filtered PRs ─────────────────────────────────────────────────────────
  const filtered = prs.filter(p => {
    if (selectedRepo !== "__all__" && p.repoSlug !== selectedRepo) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return p.aiReview?.status === "pending";
    if (statusFilter === "error") return p.aiReview?.status === "error" || !p.aiReview;
    if (statusFilter === "done") return p.aiReview?.status === "done";
    if (statusFilter === "clean") return p.aiReview?.status === "done" && (p.aiReview.suggestions?.length ?? 0) === 0;
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalReviewed = prs.filter(p => p.aiReview?.status === "done").length;
  const totalPending = prs.filter(p => p.aiReview?.status === "pending").length;
  const totalIssues = prs.reduce((acc, p) => acc + (p.aiReview?.suggestions?.length ?? 0), 0);
  const totalCritical = prs.reduce((acc, p) => acc + (p.aiReview?.suggestions?.filter(s => s.severity === "critical").length ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Code Reviews</h1>
                <p className="text-white/35 text-sm">Gemini-powered analysis across all your pull requests</p>
              </div>
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-sm text-white/55 hover:text-white/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="PRs Reviewed" value={totalReviewed} sub={`of ${prs.length} total`} color="border-indigo-500/20 bg-indigo-500/[0.05]" />
            <StatCard label="Pending" value={totalPending} sub="in queue" color="border-amber-500/20 bg-amber-500/[0.04]" />
            <StatCard label="Issues Found" value={totalIssues} sub="suggestions" color="border-violet-500/20 bg-violet-500/[0.04]" />
            <StatCard label="Critical" value={totalCritical} sub="severity" color={totalCritical > 0 ? "border-red-500/25 bg-red-500/[0.06]" : "border-emerald-500/20 bg-emerald-500/[0.04]"} />
          </div>
        )}

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Repo filter */}
          <select
            value={selectedRepo}
            onChange={e => setSelectedRepo(e.target.value)}
            className="bg-[#0d0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-indigo-400/40 cursor-pointer appearance-none min-w-[180px]"
          >
            <option value="__all__">All repositories</option>
            {repos.map(r => <option key={r.id} value={r.slug}>{r.name}</option>)}
          </select>

          {/* Status filter pills */}
          <div className="flex items-center gap-1 bg-[#0d0d14] border border-white/[0.07] rounded-xl p-1">
            {(["all", "done", "pending", "error", "clean"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                  statusFilter === s ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/25"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
                }`}
              >
                {s === "clean" ? "✓ Clean" : s === "pending" ? "⏳ Pending" : s === "error" ? "✕ Error" : s === "done" ? "◆ Reviewed" : "All"}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-white/25">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* ── PR list ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border border-white/[0.07] rounded-2xl p-5 animate-pulse bg-[#0d0d14]">
                <div className="flex items-start gap-4">
                  <div className="w-2.5 h-2.5 mt-1 rounded-full bg-white/[0.08] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/[0.07] rounded w-1/2" />
                    <div className="h-3 bg-white/[0.04] rounded w-1/3" />
                    <div className="h-3 bg-white/[0.04] rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <svg className="w-8 h-8 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">No AI reviews found</p>
              <p className="text-white/25 text-xs mt-1">
                {prs.length === 0 ? "Create pull requests to see AI reviews here." : "No PRs match the current filter."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(pr => (
              <PRReviewCard
                key={`${pr.repoSlug}-${pr.id}`}
                pr={pr}
                expanded={expandedId === `${pr.repoSlug}-${pr.id}`}
                onToggle={() => setExpandedId(prev => prev === `${pr.repoSlug}-${pr.id}` ? null : `${pr.repoSlug}-${pr.id}`)}
                onRetrigger={(slug, num) => {
                  if (retriggering !== `${slug}-${num}`) handleRetrigger(slug, num);
                }}
              />
            ))}
          </div>
        )}

        {/* ── Explainer ────────────────────────────────────────────────────── */}
        {!loading && prs.length > 0 && (
          <div className="border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01]">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white/50">How AI Reviews work</p>
                <p className="text-xs text-white/30 leading-relaxed">
                  When you create a new pull request, Gemini automatically analyses the changed files and surfaces potential issues around code modularity, robustness, security, and performance.
                  Reviews focus only on meaningful improvements — cosmetic and style issues are intentionally ignored.
                  You can also manually re-run a review at any time using the re-run button.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
