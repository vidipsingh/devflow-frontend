
"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePullRequests, PullRequest, PRComment, PRLabel } from "@/hooks/usePullRequests";

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
  const bg = `#${label.color.replace("#", "")}`;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}
    >
      {label.name}
    </span>
  );
}

function PRStateBadge({ state }: { state: PullRequest["state"] }) {
  if (state === "merged") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
        </svg>
        Merged
      </span>
    );
  }
  if (state === "closed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500/15 text-red-300 border border-red-500/25">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
      </svg>
      Open
    </span>
  );
}

// ─── Comment card ─────────────────────────────────────────────────────────────
function CommentCard({
  comment,
  onEdit,
  onDelete,
}: {
  comment: PRComment;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [menuOpen, setMenuOpen] = useState(false);

  function submitEdit() {
    if (!editBody.trim()) return;
    onEdit(comment.id, editBody.trim());
    setEditing(false);
  }

  return (
    <div className="bg-[#0d0d14] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {comment.authorName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="text-sm font-medium text-white/75">{comment.authorName}</span>
          {comment.filePath && (
            <span className="text-xs text-white/30 font-mono">
              {comment.filePath}{comment.lineNumber > 0 ? `:${comment.lineNumber}` : ""}
            </span>
          )}
          <span className="text-white/25 text-xs">{timeAgo(comment.createdAt)}</span>
          {comment.isEdited && (
            <span className="text-white/20 text-xs italic">edited</span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-white/[0.08] bg-[#12121a] shadow-2xl py-1 overflow-hidden">
                <button
                  onClick={() => { setEditing(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => { onDelete(comment.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/70 hover:bg-red-500/[0.06] hover:text-red-400 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              className="w-full bg-[#111117] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/80 text-sm focus:outline-none focus:border-indigo-400/40 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={submitEdit}
                disabled={!editBody.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditBody(comment.body); }}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 text-xs hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PRDetailPage({
  params,
}: {
  params: Promise<{ name: string; number: string }>;
}) {
  const { name, number } = use(params);
  const prNumber = parseInt(number, 10);
  const router = useRouter();

  const {
    fetchPR, updatePR, deletePR, mergePR,
    addComment, editComment, deleteComment,
    actionLoading, actionError, setActionError,
  } = usePullRequests(name);

  const [pr, setPR] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Edit PR state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  // Comment state
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Merge state
  const [mergeMethod, setMergeMethod] = useState<"merge" | "squash" | "rebase">("merge");
  const [mergeConfirm, setMergeConfirm] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);

  // Close/reopen confirm
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchPR(prNumber);
    if (!data) { setNotFound(true); }
    else { setPR(data); setEditTitle(data.title); setEditBody(data.body); }
    setLoading(false);
  }, [fetchPR, prNumber]);

  useEffect(() => { load(); }, [load]);

  async function handleSaveEdit() {
    if (!editTitle.trim()) return;
    const updated = await updatePR(prNumber, { title: editTitle.trim(), body: editBody.trim() });
    if (updated) { setPR(updated); setEditMode(false); }
  }

  async function handleToggleState() {
    if (!pr) return;
    const newState = pr.state === "open" ? "closed" : "open";
    const updated = await updatePR(prNumber, { state: newState });
    if (updated) { setPR(updated); setCloseConfirm(false); }
  }

  async function handleMerge() {
    setMergeLoading(true);
    const updated = await mergePR(prNumber, mergeMethod);
    if (updated) { setPR(updated); setMergeConfirm(false); }
    setMergeLoading(false);
  }

  async function handleDelete() {
    const ok = await deletePR(prNumber);
    if (ok) router.push(`/dashboard/repositories/${name}/pulls`);
  }

  async function handleAddComment() {
    if (!commentBody.trim()) return;
    setCommentSubmitting(true);
    const ok = await addComment(prNumber, commentBody.trim());
    if (ok) {
      setCommentBody("");
      await load();
    }
    setCommentSubmitting(false);
  }

  async function handleEditComment(commentId: string, body: string) {
    const ok = await editComment(prNumber, commentId, body);
    if (ok) await load();
  }

  async function handleDeleteComment(commentId: string) {
    const ok = await deleteComment(prNumber, commentId);
    if (ok) await load();
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-indigo-400 animate-spin" />
          </div>
          <p className="text-white/30 text-sm">Loading pull request…</p>
        </div>
      </div>
    );
  }

  if (notFound || !pr) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white font-semibold">Pull request not found</p>
          <Link href={`/dashboard/repositories/${name}/pulls`} className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to pull requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-white/40 flex-wrap">
          <Link href="/dashboard/repositories" className="hover:text-white transition-colors">Repositories</Link>
          <span className="text-white/20">/</span>
          <Link href={`/dashboard/repositories/${name}`} className="hover:text-white transition-colors">{name}</Link>
          <span className="text-white/20">/</span>
          <Link href={`/dashboard/repositories/${name}/pulls`} className="hover:text-white transition-colors">Pull Requests</Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70">#{pr.number}</span>
        </div>

        {/* ── PR header ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {editMode ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[#0d0d14] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-indigo-400/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading || !editTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  {actionLoading ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={() => { setEditMode(false); setEditTitle(pr.title); setEditBody(pr.body); }}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] text-white/40 text-sm hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <h1 className="text-2xl font-bold text-white flex-1 leading-tight">
                {pr.title}{" "}
                <span className="text-white/30 font-normal text-xl">#{pr.number}</span>
              </h1>
              <button
                onClick={() => setEditMode(true)}
                className="shrink-0 p-2 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors cursor-pointer mt-0.5"
                title="Edit title"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          )}

          {/* State + meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <PRStateBadge state={pr.state} />
            {pr.isDraft && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs text-white/40 bg-white/[0.06] border border-white/[0.1]">
                Draft
              </span>
            )}
            <span className="text-white/35 text-sm">
              <span className="text-white/55">{pr.authorName}</span> wants to merge
              {" "}<code className="text-emerald-300/70 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono text-xs">{pr.headBranch}</code>
              {" "}into{" "}
              <code className="text-indigo-300/70 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono text-xs">{pr.baseBranch}</code>
            </span>
            <span className="text-white/25 text-sm">· opened {timeAgo(pr.createdAt)}</span>
          </div>

          {/* Labels */}
          {(pr.labels ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(pr.labels ?? []).map((l) => <LabelPill key={l.name} label={l} />)}
            </div>
          )}
        </div>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* ── Main column ──────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Body / Description */}
            {editMode ? (
              <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.015]">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Description</span>
                </div>
                <div className="p-4">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={8}
                    placeholder="Add a description…"
                    className="w-full bg-[#111117] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/80 text-sm focus:outline-none focus:border-indigo-400/40 resize-y font-mono"
                  />
                </div>
              </div>
            ) : pr.body ? (
              <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.015]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                      {pr.authorName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm font-medium text-white/70">{pr.authorName}</span>
                    <span className="text-white/25 text-xs">{timeAgo(pr.createdAt)}</span>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{pr.body}</p>
                </div>
              </div>
            ) : null}

            {/* Changed files */}
            {pr.changedFiles && pr.changedFiles.length > 0 && (
              <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.015] flex items-center justify-between">
                  <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                    Changed files
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    {pr.additions > 0 && <span className="text-teal-400 font-mono">+{pr.additions}</span>}
                    {pr.deletions > 0 && <span className="text-rose-400 font-mono">-{pr.deletions}</span>}
                  </div>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {pr.changedFiles.map((file) => (
                    <div key={file} className="flex items-center gap-2 px-4 py-2.5">
                      <svg className="w-3.5 h-3.5 text-white/25 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <code className="text-xs text-white/55 font-mono">{file}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merge box (only for open PRs) */}
            {pr.state === "open" && (
              <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.015]">
                  <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Merge pull request</span>
                </div>
                <div className="p-4 space-y-4">
                  {pr.isDraft ? (
                    <div className="flex items-center gap-3 text-amber-400/70 text-sm">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      This is a draft pull request. Mark it ready for review before merging.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Ready to merge
                        </div>
                      </div>

                      {/* Merge method selector */}
                      <div className="flex items-center gap-2">
                        {(["merge", "squash", "rebase"] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => setMergeMethod(m)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer capitalize ${
                              mergeMethod === m
                                ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-300"
                                : "border-white/[0.08] text-white/35 hover:text-white/60"
                            }`}
                          >
                            {m === "merge" ? "Merge commit" : m === "squash" ? "Squash & merge" : "Rebase & merge"}
                          </button>
                        ))}
                      </div>

                      {!mergeConfirm ? (
                        <button
                          onClick={() => setMergeConfirm(true)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors cursor-pointer shadow-lg shadow-violet-900/30"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
                          </svg>
                          Merge pull request
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleMerge}
                            disabled={mergeLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors cursor-pointer"
                          >
                            {mergeLoading ? (
                              <>
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                Merging…
                              </>
                            ) : "Confirm merge"}
                          </button>
                          <button
                            onClick={() => setMergeConfirm(false)}
                            className="px-4 py-2 rounded-xl border border-white/[0.08] text-white/40 text-sm hover:text-white transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Merged banner */}
            {pr.state === "merged" && (
              <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl px-5 py-4">
                <svg className="w-5 h-5 text-violet-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
                </svg>
                <div>
                  <p className="text-violet-300 text-sm font-medium">
                    Pull request merged{pr.mergedAt ? ` ${timeAgo(pr.mergedAt)}` : ""}
                  </p>
                  <p className="text-violet-400/50 text-xs mt-0.5">
                    <code className="font-mono">{pr.headBranch}</code> was merged into{" "}
                    <code className="font-mono">{pr.baseBranch}</code>
                  </p>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">
                Comments{pr.commentCount > 0 ? ` · ${pr.commentCount}` : ""}
              </h2>

              {(pr.comments ?? []).length === 0 ? (
                <div className="text-center py-10 text-white/20 text-sm bg-[#0d0d14] border border-white/[0.07] rounded-2xl">
                  No comments yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {(pr.comments ?? []).map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                    />
                  ))}
                </div>
              )}

              {/* Add comment */}
              <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.015]">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Leave a comment</span>
                </div>
                <div className="p-4 space-y-3">
                  {actionError && (
                    <p className="text-red-400 text-xs">{actionError}</p>
                  )}
                  <textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Add a comment…"
                    rows={4}
                    className="w-full bg-[#111117] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-indigo-400/40 resize-none transition-colors"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={commentSubmitting || !commentBody.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      {commentSubmitting ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Posting…
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Comment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* PR meta */}
            <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Details</span>
              </div>
              <div className="divide-y divide-white/[0.05]">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-white/35">Author</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {pr.authorName?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs text-white/60">{pr.authorName}</span>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-white/35">State</span>
                  <PRStateBadge state={pr.state} />
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-white/35">Head</span>
                  <code className="text-xs text-emerald-300/70 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">{pr.headBranch}</code>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-white/35">Base</span>
                  <code className="text-xs text-indigo-300/70 bg-indigo-500/10 px-2 py-0.5 rounded font-mono">{pr.baseBranch}</code>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-white/35">Comments</span>
                  <span className="text-xs text-white/55">{pr.commentCount}</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-white/35">Opened</span>
                  <span className="text-xs text-white/45">{timeAgo(pr.createdAt)}</span>
                </div>
                {pr.mergedAt && (
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-white/35">Merged</span>
                    <span className="text-xs text-violet-400">{timeAgo(pr.mergedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Labels */}
            {(pr.labels ?? []).length > 0 && (
              <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Labels</span>
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                  {(pr.labels ?? []).map((l) => <LabelPill key={l.name} label={l} />)}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Actions</span>
              </div>
              <div className="p-3 space-y-2">
                {/* Close / Reopen */}
                {pr.state !== "merged" && (
                  <>
                    {!closeConfirm ? (
                      <button
                        onClick={() => setCloseConfirm(true)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          pr.state === "open"
                            ? "text-white/50 hover:text-white/80 hover:bg-white/[0.05] border border-white/[0.07]"
                            : "text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/[0.07] border border-white/[0.07]"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {pr.state === "open" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          )}
                        </svg>
                        {pr.state === "open" ? "Close pull request" : "Reopen pull request"}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-white/40 px-1">
                          {pr.state === "open" ? "Close this pull request?" : "Reopen this pull request?"}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleToggleState}
                            disabled={actionLoading}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                              pr.state === "open"
                                ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                                : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                            }`}
                          >
                            {actionLoading ? "…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setCloseConfirm(false)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/30 text-xs hover:text-white transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Delete */}
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.07] border border-white/[0.07] transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete pull request
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 px-1">This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {actionLoading ? "…" : "Delete"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/30 text-xs hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
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
