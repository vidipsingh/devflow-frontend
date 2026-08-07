
"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePullRequests, PullRequest, PRComment, AIReview, AISuggestion } from "@/hooks/usePullRequests";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function getToken() {
  try { return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null; }
  catch { return null; }
}
function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { "Content-Type": "application/json", Authorization: `Bearer ${t}` } : { "Content-Type": "application/json" };
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

function MarkdownRenderer({ content }: { content: string }) {
  if (!content?.trim()) return <p className="text-white/30 text-sm italic">No description provided.</p>;
  return (
    <div className="space-y-1.5 text-sm text-white/70 leading-relaxed">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold text-white mt-3 mb-1">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold text-white mt-2 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-base font-medium text-white mt-2">{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        if (line.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-indigo-400/50 pl-3 text-white/45 italic">{line.slice(2)}</blockquote>;
        if (line.trim() === "") return <div key={i} className="h-1.5" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ─── Severity badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: AISuggestion["severity"] }) {
  const map = {
    critical: "bg-red-500/15 text-red-400 border-red-500/25",
    warning:  "bg-amber-500/15 text-amber-400 border-amber-500/25",
    info:     "bg-sky-500/15 text-sky-400 border-sky-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[severity] ?? map.info}`}>
      {severity === "critical" && "⚠"}
      {severity === "warning" && "◆"}
      {severity === "info" && "ℹ"}
      {severity}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] text-white/40 border border-white/[0.08]">
      {category}
    </span>
  );
}

// ─── AI Suggestion card ───────────────────────────────────────────────────────
function SuggestionCard({ s, index }: { s: AISuggestion; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-xl border transition-all ${
      s.severity === "critical" ? "border-red-500/20 bg-red-500/[0.04]"
      : s.severity === "warning" ? "border-amber-500/20 bg-amber-500/[0.04]"
      : "border-sky-500/15 bg-sky-500/[0.03]"
    }`}>
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-white/20 text-xs font-mono mt-0.5 shrink-0">#{index + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <SeverityBadge severity={s.severity} />
            <CategoryBadge category={s.category} />
            <span className="text-white/30 text-xs font-mono">{s.filePath}{s.lineStart ? `:${s.lineStart}` : ""}{s.lineEnd && s.lineEnd !== s.lineStart ? `–${s.lineEnd}` : ""}</span>
          </div>
          <p className="text-sm text-white/75 font-medium leading-snug">{s.message}</p>
        </div>
        <svg
          className={`w-4 h-4 text-white/25 shrink-0 mt-0.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06] mt-0">
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs text-white/35 font-medium uppercase tracking-wide mb-1.5">Suggested fix</p>
              <div className="bg-[#0a0a0f] rounded-lg border border-white/[0.06] px-3 py-2.5">
                <p className="text-sm text-emerald-300/80 font-mono leading-relaxed whitespace-pre-wrap">{s.suggestion}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── File suggestions (grouped) ──────────────────────────────────────────────
function FileSuggestionGroup({ filePath, suggestions }: { filePath: string; suggestions: AISuggestion[] }) {
  const [open, setOpen] = useState(true);
  const critCount = suggestions.filter(s => s.severity === "critical").length;
  const warnCount = suggestions.filter(s => s.severity === "warning").length;
  return (
    <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d0d14]">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="flex-1 text-sm font-mono text-white/60 text-left">{filePath}</span>
        <div className="flex items-center gap-1.5">
          {critCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">{critCount} critical</span>}
          {warnCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold">{warnCount} warning</span>}
          {suggestions.length - critCount - warnCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-semibold">{suggestions.length - critCount - warnCount} info</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-white/20 transition-transform shrink-0 ml-1 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-white/[0.06] px-3 py-3 space-y-2">
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} s={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Review Panel ──────────────────────────────────────────────────────────
function AIReviewPanel({
  review, repoName, prNumber, onRetrigger, retriggering,
}: {
  review: AIReview | null;
  repoName: string;
  prNumber: number;
  onRetrigger: () => void;
  retriggering: boolean;
}) {
  // Group suggestions by file
  const grouped: Record<string, AISuggestion[]> = {};
  if (review?.suggestions) {
    for (const s of review.suggestions) {
      if (!grouped[s.filePath]) grouped[s.filePath] = [];
      grouped[s.filePath].push(s);
    }
  }
  const fileList = Object.keys(grouped);

  const totalSugg = review?.suggestions?.length ?? 0;
  const critCount = review?.suggestions?.filter(s => s.severity === "critical").length ?? 0;
  const warnCount = review?.suggestions?.filter(s => s.severity === "warning").length ?? 0;

  // pending state
  if (!review || review.status === "pending") {
    return (
      <div className="border border-indigo-500/20 rounded-2xl bg-indigo-500/[0.04] p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">AI Review in progress…</p>
            <p className="text-xs text-white/35 mt-0.5">Gemini is analysing the changed files. This usually takes 10–30s.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="h-2 flex-1 rounded-full bg-white/[0.05] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500/60 to-violet-500/60 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // error / skipped
  if (review.status === "error" || review.status === "skipped") {
    return (
      <div className={`border rounded-2xl p-5 ${review.status === "error" ? "border-red-500/20 bg-red-500/[0.04]" : "border-white/[0.08] bg-white/[0.02]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${review.status === "error" ? "bg-red-500/15 border border-red-500/20" : "bg-white/[0.06] border border-white/[0.08]"}`}>
              {review.status === "error" ? (
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80">
                {review.status === "error" ? "AI Review failed" : "AI Review skipped"}
              </p>
              {review.errorMsg && <p className="text-xs text-red-400/70 mt-0.5">{review.errorMsg}</p>}
              {review.summary && <p className="text-xs text-white/40 mt-0.5">{review.summary}</p>}
            </div>
          </div>
          <button
            onClick={onRetrigger}
            disabled={retriggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white/60 hover:text-white/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3 h-3 ${retriggering ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {retriggering ? "Triggering…" : "Re-run"}
          </button>
        </div>
      </div>
    );
  }

  // done
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="border border-indigo-500/20 rounded-2xl bg-indigo-500/[0.04] p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white/85">AI Code Review</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">Done</span>
                {review.model && <span className="text-xs text-white/25 font-mono">{review.model}</span>}
              </div>
              {review.summary && <p className="text-sm text-white/55 mt-1.5 leading-relaxed">{review.summary}</p>}
              {review.reviewedAt && <p className="text-xs text-white/25 mt-1">{timeAgo(review.reviewedAt)}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Stats */}
            <div className="flex items-center gap-2 text-xs">
              {critCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                  <span>⚠</span>{critCount} critical
                </span>
              )}
              {warnCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  <span>◆</span>{warnCount} warning
                </span>
              )}
              {totalSugg === 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  ✓ No issues
                </span>
              )}
            </div>
            <button
              onClick={onRetrigger}
              disabled={retriggering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-white/50 hover:text-white/70 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className={`w-3 h-3 ${retriggering ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {retriggering ? "Triggering…" : "Re-run"}
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions grouped by file */}
      {fileList.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-white/30 uppercase tracking-wider px-0.5">
            {totalSugg} suggestion{totalSugg !== 1 ? "s" : ""} across {fileList.length} file{fileList.length !== 1 ? "s" : ""}
          </p>
          {fileList.map((fp) => (
            <FileSuggestionGroup key={fp} filePath={fp} suggestions={grouped[fp]} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Comment bubble ───────────────────────────────────────────────────────────
function CommentBubble({
  comment, currentUser, onEdit, onDelete,
}: {
  comment: PRComment;
  currentUser: string;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const isOwn = comment.authorName === currentUser;

  function submit() {
    if (draft.trim() === "" || draft === comment.body) { setEditing(false); return; }
    onEdit(comment.id, draft.trim());
    setEditing(false);
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/[0.08] flex items-center justify-center text-white/60 text-xs font-semibold shrink-0">
        {comment.authorName?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white/75">{comment.authorName}</span>
          {comment.filePath && (
            <span className="text-xs font-mono text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">
              {comment.filePath}{comment.lineNumber ? `:${comment.lineNumber}` : ""}
            </span>
          )}
          <span className="text-xs text-white/25">{timeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-[10px] text-white/20 italic">edited</span>}
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-indigo-400/30 rounded-lg px-3 py-2 text-sm text-white/80 resize-none focus:outline-none focus:border-indigo-400/50 min-h-[80px]"
            />
            <div className="flex gap-2">
              <button onClick={submit} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer transition-colors">Save</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.10] text-white/50 cursor-pointer transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 group relative">
            <MarkdownRenderer content={comment.body} />
            {isOwn && (
              <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
                <button onClick={() => { setDraft(comment.body); setEditing(true); }} className="p-1 rounded hover:bg-white/[0.08] text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(comment.id)} className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PRDetailPage({ params }: { params: Promise<{ name: string; number: string }> }) {
  const { name, number } = use(params);
  const num = parseInt(number, 10);
  const { fetchPR, addComment, editComment, deleteComment, mergePR, triggerAIReview, actionLoading } = usePullRequests(name);

  const [pr, setPr] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "files" | "comments">("overview");
  const [commentBody, setCommentBody] = useState("");
  const [commentFile, setCommentFile] = useState("");
  const [commentLine, setCommentLine] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [retriggering, setRetriggering] = useState(false);
  const [mergeMethod, setMergeMethod] = useState<"merge" | "squash" | "rebase">("merge");
  const [merging, setMerging] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUser = typeof window !== "undefined" ? (localStorage.getItem("devflow_username") ?? "") : "";

  const load = useCallback(async () => {
    const data = await fetchPR(num);
    if (data) setPr(data);
    setLoading(false);
  }, [fetchPR, num]);

  useEffect(() => { load(); }, [load]);

  // Poll every 5s while AI review is pending
  useEffect(() => {
    if (pr?.aiReview?.status === "pending") {
      pollRef.current = setInterval(async () => {
        const data = await fetchPR(num);
        if (data) {
          setPr(data);
          if (data.aiReview?.status !== "pending") {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      }, 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pr?.aiReview?.status, fetchPR, num]);

  async function handleAddComment() {
    if (!pr || !commentBody.trim()) return;
    setSubmitting(true);
    const ok = await addComment(num, commentBody.trim(), commentFile || undefined, commentLine ? parseInt(commentLine) : undefined);
    if (ok) {
      setCommentBody("");
      setCommentFile("");
      setCommentLine("");
      await load();
    }
    setSubmitting(false);
  }

  async function handleEditComment(commentId: string, body: string) {
    if (!pr) return;
    await editComment(num, commentId, body);
    await load();
  }

  async function handleDeleteComment(commentId: string) {
    if (!pr) return;
    await deleteComment(num, commentId);
    await load();
  }

  async function handleMerge() {
    if (!pr) return;
    setMerging(true);
    const updated = await mergePR(num, mergeMethod);
    if (updated) setPr(updated);
    setMerging(false);
  }

  async function handleRetrigger() {
    if (!pr) return;
    setRetriggering(true);
    // Optimistically mark as pending
    setPr(prev => prev ? { ...prev, aiReview: { status: "pending", summary: "", suggestions: [], model: "", reviewedAt: null, errorMsg: "" } } : prev);
    await triggerAIReview(num);
    setRetriggering(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/30">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm">Loading pull request…</span>
        </div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-sm">Pull request not found.</p>
          <Link href={`/dashboard/repositories/${name}/pulls`} className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">← Back to pull requests</Link>
        </div>
      </div>
    );
  }

  const stateColor = pr.state === "merged" ? "bg-violet-500/15 text-violet-300 border-violet-500/25"
    : pr.state === "closed" ? "bg-red-500/15 text-red-300 border-red-500/25"
    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";

  const lineComments = (pr.comments ?? []).filter(c => c.filePath && c.lineNumber > 0);
  const generalComments = (pr.comments ?? []).filter(c => !c.filePath || c.lineNumber === 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-white/35">
          <Link href="/dashboard/repositories" className="hover:text-white transition-colors">Repositories</Link>
          <span className="text-white/15">/</span>
          <Link href={`/dashboard/repositories/${name}`} className="hover:text-white transition-colors">{name}</Link>
          <span className="text-white/15">/</span>
          <Link href={`/dashboard/repositories/${name}/pulls`} className="hover:text-white transition-colors">Pull Requests</Link>
          <span className="text-white/15">/</span>
          <span className="text-white/60">#{pr.number}</span>
        </div>

        {/* ── PR Header ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white flex-1">{pr.title}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${stateColor} shrink-0`}>
              {pr.state === "merged" && <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z"/></svg>}
              {pr.state === "open" && <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/></svg>}
              {pr.state}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm text-white/35">
            <span className="text-white/50 font-medium">{pr.authorName}</span>
            <span className="text-white/15">·</span>
            <span>{pr.state === "merged" && pr.mergedAt ? `merged ${timeAgo(pr.mergedAt)}` : pr.state === "closed" && pr.closedAt ? `closed ${timeAgo(pr.closedAt)}` : `opened ${timeAgo(pr.createdAt)}`}</span>
            <span className="text-white/15">·</span>
            <span className="font-mono text-white/40">{pr.headBranch} → {pr.baseBranch}</span>
            {pr.isDraft && <span className="px-2 py-0.5 rounded text-xs bg-white/[0.06] border border-white/[0.09] text-white/35">Draft</span>}
          </div>

          {/* Labels */}
          {(pr.labels ?? []).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {(pr.labels ?? []).map((l) => {
                const bg = l.color ? (l.color.startsWith("#") ? l.color : "#" + l.color) : "#6366f1";
                return (
                  <span key={l.name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}>
                    {l.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-white/[0.07]">
          {(["overview", "files", "comments"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                activeTab === t ? "border-indigo-400 text-white" : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t === "comments" ? `Comments (${(pr.comments ?? []).length})` : t === "files" ? `Files (${(pr.changedFiles ?? []).length})` : t}
              {t === "overview" && pr.aiReview && (
                <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  pr.aiReview.status === "pending" ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/20"
                  : pr.aiReview.status === "done" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                }`}>
                  {pr.aiReview.status === "pending" ? "AI…" : pr.aiReview.status === "done" ? `AI ${pr.aiReview.suggestions?.length ?? 0}` : "AI!"}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

          {/* Main column */}
          <div className="space-y-6 min-w-0">

            {activeTab === "overview" && (
              <>
                {/* Description */}
                <div className="border border-white/[0.08] rounded-2xl bg-[#0d0d14] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/[0.08] flex items-center justify-center text-white/50 text-xs font-semibold">
                      {pr.authorName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm font-medium text-white/70">{pr.authorName}</span>
                    <span className="text-xs text-white/25 ml-auto">{timeAgo(pr.createdAt)}</span>
                  </div>
                  <div className="px-5 py-4">
                    <MarkdownRenderer content={pr.body} />
                  </div>
                </div>

                {/* AI Review Panel */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Gemini AI Review</h2>
                  </div>
                  <AIReviewPanel
                    review={pr.aiReview}
                    repoName={name}
                    prNumber={num}
                    onRetrigger={handleRetrigger}
                    retriggering={retriggering}
                  />
                </div>

                {/* General comments */}
                {generalComments.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">General Comments</h2>
                    {generalComments.map((c) => (
                      <CommentBubble key={c.id} comment={c} currentUser={currentUser} onEdit={handleEditComment} onDelete={handleDeleteComment} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "files" && (
              <div className="space-y-3">
                {(pr.changedFiles ?? []).length === 0 ? (
                  <div className="text-center py-16 text-white/30 text-sm">No changed files recorded.</div>
                ) : (
                  <>
                    {/* Changed files list with AI annotations */}
                    {(pr.changedFiles ?? []).map((fp) => {
                      const fileSugg = pr.aiReview?.suggestions?.filter(s => s.filePath === fp) ?? [];
                      const lineCommsForFile = lineComments.filter(c => c.filePath === fp);
                      return (
                        <div key={fp} className="border border-white/[0.08] rounded-xl bg-[#0d0d14] overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
                            <svg className="w-4 h-4 text-white/25 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="flex-1 text-sm font-mono text-white/65">{fp}</span>
                            <div className="flex items-center gap-1.5">
                              {fileSugg.filter(s => s.severity === "critical").length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">⚠ {fileSugg.filter(s => s.severity === "critical").length}</span>
                              )}
                              {fileSugg.filter(s => s.severity === "warning").length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold">◆ {fileSugg.filter(s => s.severity === "warning").length}</span>
                              )}
                              {lineCommsForFile.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/[0.07] text-white/35 font-medium">{lineCommsForFile.length} comment{lineCommsForFile.length !== 1 ? "s" : ""}</span>
                              )}
                            </div>
                          </div>
                          {/* Inline AI suggestions for this file */}
                          {fileSugg.length > 0 && (
                            <div className="px-3 py-3 space-y-2 border-b border-white/[0.05]">
                              {fileSugg.map((s, i) => (
                                <SuggestionCard key={i} s={s} index={i} />
                              ))}
                            </div>
                          )}
                          {/* Inline review comments */}
                          {lineCommsForFile.length > 0 && (
                            <div className="px-4 py-3 space-y-3">
                              {lineCommsForFile.map((c) => (
                                <CommentBubble key={c.id} comment={c} currentUser={currentUser} onEdit={handleEditComment} onDelete={handleDeleteComment} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-4">
                {(pr.comments ?? []).length === 0 ? (
                  <div className="text-center py-10 text-white/30 text-sm">No comments yet.</div>
                ) : (
                  <div className="space-y-4">
                    {(pr.comments ?? []).map((c) => (
                      <CommentBubble key={c.id} comment={c} currentUser={currentUser} onEdit={handleEditComment} onDelete={handleDeleteComment} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add Comment box (always visible) */}
            <div className="border border-white/[0.08] rounded-2xl bg-[#0d0d14] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-white/50">Add a comment</p>
              </div>
              <div className="p-4 space-y-3">
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="Leave a comment…"
                  className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-indigo-400/40 min-h-[100px] transition-colors"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    value={commentFile}
                    onChange={e => setCommentFile(e.target.value)}
                    placeholder="File path (optional)"
                    list="file-paths"
                    className="flex-1 bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/60 placeholder-white/20 focus:outline-none focus:border-indigo-400/30 min-w-[140px] transition-colors"
                  />
                  <datalist id="file-paths">
                    {(pr.changedFiles ?? []).map(f => <option key={f} value={f} />)}
                  </datalist>
                  <input
                    value={commentLine}
                    onChange={e => setCommentLine(e.target.value)}
                    placeholder="Line # (optional)"
                    type="number"
                    className="w-32 bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/60 placeholder-white/20 focus:outline-none focus:border-indigo-400/30 transition-colors"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !commentBody.trim()}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Posting…" : "Comment"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Merge section */}
            {pr.state === "open" && (
              <div className="border border-white/[0.08] rounded-2xl bg-[#0d0d14] p-4 space-y-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Merge pull request</p>
                <select
                  value={mergeMethod}
                  onChange={e => setMergeMethod(e.target.value as typeof mergeMethod)}
                  className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/60 focus:outline-none cursor-pointer"
                >
                  <option value="merge">Create a merge commit</option>
                  <option value="squash">Squash and merge</option>
                  <option value="rebase">Rebase and merge</option>
                </select>
                <button
                  onClick={handleMerge}
                  disabled={merging || actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z"/>
                  </svg>
                  {merging ? "Merging…" : "Merge pull request"}
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="border border-white/[0.08] rounded-2xl bg-[#0d0d14] p-4 space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Stats</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Additions</span>
                  <span className="text-teal-400 font-mono font-semibold">+{pr.additions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Deletions</span>
                  <span className="text-rose-400 font-mono font-semibold">-{pr.deletions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Files changed</span>
                  <span className="text-white/60 font-semibold">{(pr.changedFiles ?? []).length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Comments</span>
                  <span className="text-white/60 font-semibold">{pr.commentCount}</span>
                </div>
              </div>
            </div>

            {/* AI Review summary */}
            <div className="border border-white/[0.08] rounded-2xl bg-[#0d0d14] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">AI Review</p>
                {!pr.aiReview || pr.aiReview.status === "error" || pr.aiReview.status === "skipped" ? (
                  <button
                    onClick={handleRetrigger}
                    disabled={retriggering}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {retriggering ? "Triggering…" : "Run now"}
                  </button>
                ) : null}
              </div>
              {!pr.aiReview ? (
                <p className="text-xs text-white/30">Not yet run.</p>
              ) : pr.aiReview.status === "pending" ? (
                <div className="flex items-center gap-2 text-xs text-indigo-400">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analysing…
                </div>
              ) : pr.aiReview.status === "done" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">Done</span>
                    {pr.aiReview.model && <span className="text-xs text-white/20 font-mono">{pr.aiReview.model}</span>}
                  </div>
                  {(pr.aiReview.suggestions?.length ?? 0) === 0 ? (
                    <p className="text-xs text-emerald-400/70">✓ No issues found</p>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pr.aiReview.suggestions?.filter(s => s.severity === "critical").length > 0 && (
                        <span className="text-xs text-red-400 font-semibold">⚠ {pr.aiReview.suggestions.filter(s => s.severity === "critical").length} critical</span>
                      )}
                      {pr.aiReview.suggestions?.filter(s => s.severity === "warning").length > 0 && (
                        <span className="text-xs text-amber-400 font-semibold">◆ {pr.aiReview.suggestions.filter(s => s.severity === "warning").length} warning</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-red-400/70">{pr.aiReview.errorMsg || "Failed"}</p>
              )}
            </div>

            {/* Changed files list */}
            {(pr.changedFiles ?? []).length > 0 && (
              <div className="border border-white/[0.08] rounded-2xl bg-[#0d0d14] p-4 space-y-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Changed Files</p>
                {(pr.changedFiles ?? []).map((f) => {
                  const hasCrit = pr.aiReview?.suggestions?.some(s => s.filePath === f && s.severity === "critical");
                  const hasWarn = pr.aiReview?.suggestions?.some(s => s.filePath === f && s.severity === "warning");
                  return (
                    <div key={f} className="flex items-center gap-2">
                      {hasCrit ? <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        : hasWarn ? <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        : <span className="w-2 h-2 rounded-full bg-white/10 shrink-0" />}
                      <button
                        className="text-xs font-mono text-white/45 hover:text-white/70 transition-colors cursor-pointer text-left truncate"
                        onClick={() => setActiveTab("files")}
                      >
                        {f}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
