
"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useIssues, Issue, IssueComment, IssueLabel, IssueReactions } from "@/hooks/useIssues";

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
  const bg = label.color
    ? label.color.startsWith("#") ? label.color : "#" + label.color
    : "#6366f1";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}
    >
      {label.name}
    </span>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  if (!content.trim())
    return <p className="text-white/30 text-sm italic">No description provided.</p>;
  return (
    <div className="space-y-1.5">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("# "))
          return <h1 key={i} className="text-2xl font-bold text-white mt-4 mb-2">{line.slice(2)}</h1>;
        if (line.startsWith("## "))
          return <h2 key={i} className="text-xl font-semibold text-white mt-3 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith("### "))
          return <h3 key={i} className="text-lg font-medium text-white mt-2 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return <li key={i} className="text-white/65 text-sm ml-4 list-disc leading-relaxed">{line.slice(2)}</li>;
        if (line.startsWith("> "))
          return (
            <blockquote key={i} className="border-l-2 border-indigo-400/50 pl-3 text-white/50 text-sm italic">
              {line.slice(2)}
            </blockquote>
          );
        if (line.startsWith("```"))
          return <div key={i} className="font-mono text-white/30 text-xs">{line}</div>;
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-white/70 text-sm leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

// ─── Reactions bar ────────────────────────────────────────────────────────────
// Only renders reactions that have count > 0, plus a small "+ Add" picker
const REACTION_META: { key: keyof IssueReactions; emoji: string; label: string }[] = [
  { key: "thumbsUp",   emoji: "👍", label: "+1"       },
  { key: "thumbsDown", emoji: "👎", label: "-1"       },
  { key: "laugh",      emoji: "😄", label: "laugh"    },
  { key: "hooray",     emoji: "🎉", label: "hooray"   },
  { key: "confused",   emoji: "😕", label: "confused" },
  { key: "heart",      emoji: "❤️", label: "heart"    },
  { key: "rocket",     emoji: "🚀", label: "rocket"   },
  { key: "eyes",       emoji: "👀", label: "eyes"     },
];

function ReactionsBar({
  reactions,
  onReact,
}: {
  reactions: IssueReactions;
  onReact: (key: keyof IssueReactions) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const hasAny = REACTION_META.some(({ key }) => reactions[key] > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 pt-2">
      {/* Only render reactions that have a positive count */}
      {REACTION_META.map(({ key, emoji, label }) => {
        const count = reactions[key];
        if (count === 0) return null;
        return (
          <button
            key={key}
            onClick={() => onReact(key)}
            title={`${label} · ${count}`}
            className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-colors text-white/70 hover:text-white"
          >
            <span>{emoji}</span>
            <span className="font-medium">{count}</span>
          </button>
        );
      })}

      {/* Add reaction picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          title="Add reaction"
          className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.07] hover:border-white/[0.14] transition-colors text-white/35 hover:text-white/60"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>React</span>
        </button>
        {pickerOpen && (
          <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-0.5 p-2 bg-[#16162a] border border-white/[0.10] rounded-xl shadow-2xl z-20 w-48">
            {REACTION_META.map(({ key, emoji, label }) => (
              <button
                key={key}
                onClick={() => { onReact(key); setPickerOpen(false); }}
                title={label}
                className="cursor-pointer flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/[0.08] transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasAny && (
        <span className="text-white/20 text-xs">No reactions yet</span>
      )}
    </div>
  );
}

// ─── Inline comment editor ────────────────────────────────────────────────────
function CommentEditor({
  initial,
  onSave,
  onCancel,
  loading,
  placeholder,
}: {
  initial: string;
  onSave: (body: string) => void;
  onCancel?: () => void;
  loading: boolean;
  placeholder?: string;
}) {
  const [body, setBody] = useState(initial);
  const [preview, setPreview] = useState(false);

  return (
    <div className="border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="flex border-b border-white/[0.08] bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors ${
            !preview ? "text-white border-b-2 border-indigo-400" : "text-white/40 hover:text-white/70"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors ${
            preview ? "text-white border-b-2 border-indigo-400" : "text-white/40 hover:text-white/70"
          }`}
        >
          Preview
        </button>
      </div>
      {preview ? (
        <div className="p-4 min-h-[100px] bg-[#0d0d14]">
          <MarkdownRenderer content={body} />
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder ?? "Leave a comment…"}
          rows={5}
          className="w-full bg-[#0d0d14] px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-y focus:outline-none"
        />
      )}
      <div className="flex items-center justify-end gap-2 px-3 py-2 bg-white/[0.01] border-t border-white/[0.06]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => { if (body.trim()) onSave(body.trim()); }}
          disabled={loading || !body.trim()}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
        >
          {loading && (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {initial ? "Update comment" : "Comment"}
        </button>
      </div>
    </div>
  );
}

// ─── Single comment ───────────────────────────────────────────────────────────
function CommentBlock({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  actionLoading,
}: {
  comment: IssueComment;
  currentUserId: string | null;
  onEdit: (commentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  actionLoading: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwn = currentUserId && comment.authorId === currentUserId;

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-500/35 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
            {comment.authorName[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="text-sm font-medium text-white/80 truncate">{comment.authorName}</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/35 text-xs whitespace-nowrap">{timeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-white/20 text-xs italic">(edited)</span>}
        </div>
        {isOwn && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => { setEditing(!editing); setConfirmDelete(false); }}
              className="cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition-colors"
              title="Edit comment"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => { setConfirmDelete(!confirmDelete); setEditing(false); }}
              className="cursor-pointer p-1.5 rounded-lg hover:bg-red-500/10 text-white/25 hover:text-red-400 transition-colors"
              title="Delete comment"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 bg-[#0d0d14]">
        {editing ? (
          <CommentEditor
            initial={comment.body}
            onSave={async (body) => { await onEdit(comment.id, body); setEditing(false); }}
            onCancel={() => setEditing(false)}
            loading={actionLoading}
          />
        ) : (
          <MarkdownRenderer content={comment.body} />
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-red-500/5 border-t border-red-500/20">
          <p className="text-red-400 text-xs">Delete this comment permanently?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="cursor-pointer text-xs text-white/40 hover:text-white/70 px-2 py-1 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => { await onDelete(comment.id); setConfirmDelete(false); }}
              disabled={actionLoading}
              className="cursor-pointer text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 transition-colors disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ name: string; number: string }>;
}) {
  const { name, number } = use(params);
  const issueNumber = parseInt(number, 10);

  const {
    fetchIssue,
    updateIssue,
    deleteIssue,
    addComment,
    editComment,
    deleteComment,
    reactToIssue,
    actionLoading,
    actionError,
    setActionError,
  } = useIssues(name);

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loadingIssue, setLoadingIssue] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editingBody, setEditingBody] = useState(false);
  const [editBody, setEditBody] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("devflow_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.userId ?? payload.sub ?? null);
        setCurrentUsername(payload.username ?? null);
      }
    } catch {/* ignore */}
  }, []);

  const reload = useCallback(async () => {
    setLoadingIssue(true);
    setFetchError(null);
    const data = await fetchIssue(issueNumber);
    if (!data) setFetchError("Issue not found or failed to load.");
    setIssue(data);
    setLoadingIssue(false);
  }, [fetchIssue, issueNumber]);

  useEffect(() => { reload(); }, [reload]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveTitle = async () => {
    if (!editTitle.trim() || !issue) return;
    const updated = await updateIssue(issueNumber, { title: editTitle.trim() });
    if (updated) { setIssue(updated); setEditingTitle(false); }
  };

  const handleSaveBody = async (body: string) => {
    const updated = await updateIssue(issueNumber, { body });
    if (updated) { setIssue(updated); setEditingBody(false); }
  };

  const handleToggleState = async () => {
    if (!issue) return;
    const updated = await updateIssue(issueNumber, { state: issue.state === "open" ? "closed" : "open" });
    if (updated) setIssue(updated);
  };

  const handleToggleLock = async () => {
    if (!issue) return;
    const updated = await updateIssue(issueNumber, { isLocked: !issue.isLocked });
    if (updated) setIssue(updated);
  };

  const handleAddComment = async (body: string) => {
    const comment = await addComment(issueNumber, body);
    if (comment && issue) {
      setIssue({ ...issue, comments: [...issue.comments, comment], commentCount: issue.commentCount + 1 });
    }
  };

  const handleEditComment = async (commentId: string, body: string) => {
    const ok = await editComment(issueNumber, commentId, body);
    if (ok && issue) {
      setIssue({
        ...issue,
        comments: issue.comments.map((c) =>
          c.id === commentId ? { ...c, body, isEdited: true } : c
        ),
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const ok = await deleteComment(issueNumber, commentId);
    if (ok && issue) {
      setIssue({
        ...issue,
        comments: issue.comments.filter((c) => c.id !== commentId),
        commentCount: issue.commentCount - 1,
      });
    }
  };

  const handleReact = async (key: keyof IssueReactions) => {
    const updated = await reactToIssue(issueNumber, key, true);
    if (updated && issue) setIssue({ ...issue, reactions: updated });
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    const ok = await deleteIssue(issueNumber);
    if (ok) window.location.href = `/dashboard/repositories/${name}/issues`;
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingIssue) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-white/40 text-sm">Loading issue…</p>
        </div>
      </div>
    );
  }

  if (fetchError || !issue) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{fetchError ?? "Issue not found"}</p>
          <Link
            href={`/dashboard/repositories/${name}/issues`}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            ← Back to issues
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = !!(currentUserId && issue.authorId === currentUserId);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Breadcrumb ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/dashboard/repositories" className="hover:text-white transition-colors">Repositories</Link>
          <span className="text-white/20">/</span>
          <Link href={`/dashboard/repositories/${name}`} className="hover:text-white transition-colors">{name}</Link>
          <span className="text-white/20">/</span>
          <Link href={`/dashboard/repositories/${name}/issues`} className="hover:text-white/70 transition-colors">Issues</Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70">#{issue.number}</span>
        </div>

        {/* ── Title row ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 bg-[#0d0d14] border border-indigo-400/40 rounded-xl px-4 py-2.5 text-lg font-bold text-white focus:outline-none focus:border-indigo-400"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                disabled={actionLoading || !editTitle.trim()}
                className="cursor-pointer px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTitle(false)}
                className="cursor-pointer px-4 py-2.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <h1 className="text-2xl font-bold text-white leading-tight flex-1">
                {issue.title}
                <span className="ml-2 text-white/25 font-normal text-xl">#{issue.number}</span>
              </h1>
              {isAuthor && (
                <button
                  onClick={() => { setEditTitle(issue.title); setEditingTitle(true); }}
                  className="cursor-pointer mt-1 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition-colors shrink-0"
                  title="Edit title"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Status + meta */}
          <div className="flex items-center flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              issue.state === "open"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                : "bg-purple-500/15 text-purple-400 border border-purple-500/25"
            }`}>
              {issue.state === "open" ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {issue.state === "open" ? "Open" : "Closed"}
            </span>
            {issue.isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20">
                🔒 Locked
              </span>
            )}
            <span className="text-white/35 text-sm">
              Opened by{" "}
              <span className="text-white/60 font-medium">{issue.authorName}</span>{" "}
              {timeAgo(issue.createdAt)}
              {issue.state === "closed" && issue.closedAt && (
                <> · closed {timeAgo(issue.closedAt)}</>
              )}
            </span>
          </div>

          {/* Labels + milestone */}
          {(issue.labels.length > 0 || issue.milestone) && (
            <div className="flex items-center flex-wrap gap-2">
              {issue.labels.map((l) => <LabelPill key={l.name} label={l} />)}
              {issue.milestone && (
                <span className="inline-flex items-center gap-1 text-violet-400 text-xs font-medium bg-violet-400/10 border border-violet-400/20 px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  {issue.milestone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Main layout ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">

          {/* ── Left column ──────────────────────────────────────────── */}
          <div className="space-y-4 min-w-0">

            {/* Issue body card */}
            <div className="border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-500/35 flex items-center justify-center text-xs font-semibold text-indigo-300">
                    {issue.authorName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-sm font-medium text-white/80">{issue.authorName}</span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/35 text-xs">{timeAgo(issue.createdAt)}</span>
                  <span className="text-white/20 text-xs border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px]">Author</span>
                </div>
                {isAuthor && !editingBody && (
                  <button
                    onClick={() => { setEditBody(issue.body); setEditingBody(true); }}
                    className="cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition-colors"
                    title="Edit description"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="p-4 bg-[#0d0d14]">
                {editingBody ? (
                  <CommentEditor
                    initial={editBody}
                    onSave={handleSaveBody}
                    onCancel={() => setEditingBody(false)}
                    loading={actionLoading}
                    placeholder="Describe the issue…"
                  />
                ) : (
                  <MarkdownRenderer content={issue.body} />
                )}
              </div>

              {/* Reactions */}
              <ReactionsBar reactions={issue.reactions} onReact={handleReact} />
            </div>

            {/* ── Comment thread ──────────────────────────────────────── */}
            {issue.comments.length > 0 && (
              <div className="space-y-3">
                <p className="text-white/30 text-xs font-medium uppercase tracking-wider px-1">
                  {issue.commentCount} comment{issue.commentCount !== 1 ? "s" : ""}
                </p>
                {issue.comments.map((comment) => (
                  <CommentBlock
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}

            {/* ── New comment / locked notice ─────────────────────────── */}
            {!issue.isLocked ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-500/35 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
                    {currentUsername ? currentUsername[0].toUpperCase() : "?"}
                  </div>
                  <span className="text-sm text-white/40">Add a comment</span>
                </div>
                <CommentEditor
                  initial=""
                  onSave={handleAddComment}
                  loading={actionLoading}
                  placeholder="Leave a comment… Markdown is supported."
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-400/20 bg-red-400/5 text-red-400 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                This issue is locked. New comments are disabled.
              </div>
            )}

            {/* ── Action error ────────────────────────────────────────── */}
            {actionError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1">{actionError}</span>
                <button onClick={() => setActionError(null)} className="cursor-pointer text-white/40 hover:text-white/60 text-lg leading-none">×</button>
              </div>
            )}
          </div>

          {/* ── Right sidebar ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Author controls */}
            {isAuthor && (
              <div className="border border-white/[0.08] rounded-xl p-4 bg-[#0d0d14] space-y-2">
                <p className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-3">Actions</p>

                {/* Open ↔ Close */}
                <button
                  onClick={handleToggleState}
                  disabled={actionLoading}
                  className={`cursor-pointer w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
                    issue.state === "open"
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/25 hover:bg-purple-500/25"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25"
                  }`}
                >
                  {issue.state === "open" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Close issue
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reopen issue
                    </>
                  )}
                </button>

                {/* Lock ↔ Unlock */}
                <button
                  onClick={handleToggleLock}
                  disabled={actionLoading}
                  className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 bg-white/[0.04] text-white/55 border border-white/[0.08] hover:bg-white/[0.07] hover:text-white/75"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {issue.isLocked ? "Unlock conversation" : "Lock conversation"}
                </button>

                {/* Delete */}
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete issue
                  </button>
                ) : (
                  <div className="space-y-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <p className="text-red-400 text-xs leading-relaxed">
                      This will permanently delete the issue and all its comments.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="cursor-pointer flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="cursor-pointer flex-1 py-1.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Issue info */}
            <div className="border border-white/[0.08] rounded-xl p-4 bg-[#0d0d14] space-y-3">
              <p className="text-white/35 text-xs font-semibold uppercase tracking-wider">Details</p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Comments</span>
                <span className="text-white/65 font-medium">{issue.commentCount}</span>
              </div>

              <div className="border-t border-white/[0.06] pt-3 space-y-1.5 text-xs text-white/35">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="text-white/55">{new Date(issue.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span className="text-white/55">{new Date(issue.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                {issue.closedAt && (
                  <div className="flex justify-between">
                    <span>Closed</span>
                    <span className="text-white/55">{new Date(issue.closedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
