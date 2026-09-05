
"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  usePullRequests,
  PullRequest,
  PRComment,
  FileDiff,
  DiffHunk,
  DiffLine,
  PRDiff,
} from "@/hooks/usePullRequests";

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

function fileExt(path: string) {
  const parts = path.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

// ─── State badge ─────────────────────────────────────────────────────────────

function StateBadge({ state }: { state: PullRequest["state"] }) {
  if (state === "merged") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
        </svg>
        Merged
      </span>
    );
  }
  if (state === "closed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
      </svg>
      Open
    </span>
  );
}

// ─── Diff additions/deletions bar ─────────────────────────────────────────────

function DiffStatBar({ additions, deletions }: { additions: number; deletions: number }) {
  const total = additions + deletions;
  if (total === 0) return null;
  const addPct = Math.round((additions / total) * 100);
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono">
      <span className="text-emerald-400">+{additions}</span>
      <span className="text-rose-400">-{deletions}</span>
      <div className="flex w-16 h-1.5 rounded-full overflow-hidden bg-white/10">
        <div className="bg-emerald-500 h-full" style={{ width: `${addPct}%` }} />
        <div className="bg-rose-500 h-full" style={{ width: `${100 - addPct}%` }} />
      </div>
    </div>
  );
}

// ─── File status badge ────────────────────────────────────────────────────────

function FileStatusBadge({ status }: { status: FileDiff["status"] }) {
  if (status === "added") return (
    <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">A</span>
  );
  if (status === "removed") return (
    <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/20">D</span>
  );
  return (
    <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20">M</span>
  );
}

// ─── Hunk renderer ────────────────────────────────────────────────────────────

function DiffHunkBlock({ hunk }: { hunk: DiffHunk }) {
  return (
    <div className="font-mono text-xs">
      {/* Hunk header */}
      <div className="flex items-center bg-indigo-500/10 border-y border-indigo-500/20 px-3 py-1 text-indigo-300/70 select-none">
        <span className="text-indigo-400 font-semibold">{hunk.header}</span>
      </div>
      {/* Lines */}
      {hunk.lines.map((line: DiffLine, idx: number) => {
        const isAdd = line.type === "addition";
        const isDel = line.type === "deletion";
        const rowBg = isAdd
          ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.13]"
          : isDel
          ? "bg-rose-500/[0.08] hover:bg-rose-500/[0.13]"
          : "hover:bg-white/[0.02]";
        const gutterBg = isAdd
          ? "bg-emerald-500/[0.12]"
          : isDel
          ? "bg-rose-500/[0.12]"
          : "bg-transparent";
        const contentColor = isAdd
          ? "text-emerald-200"
          : isDel
          ? "text-rose-200"
          : "text-white/70";
        const lineNumColor = isAdd
          ? "text-emerald-500/60"
          : isDel
          ? "text-rose-500/60"
          : "text-white/20";
        const prefix = isAdd ? "+" : isDel ? "−" : " ";
        const prefixColor = isAdd ? "text-emerald-400" : isDel ? "text-rose-400" : "text-white/20";

        return (
          <div key={idx} className={`flex group ${rowBg} transition-colors`}>
            {/* Old line number */}
            <div className={`w-12 text-right pr-2 py-[3px] select-none shrink-0 ${gutterBg} ${lineNumColor} border-r border-white/[0.05]`}>
              {line.oldNo ?? ""}
            </div>
            {/* New line number */}
            <div className={`w-12 text-right pr-2 py-[3px] select-none shrink-0 ${gutterBg} ${lineNumColor} border-r border-white/[0.05]`}>
              {line.newNo ?? ""}
            </div>
            {/* Prefix */}
            <div className={`w-6 text-center py-[3px] select-none shrink-0 ${prefixColor} font-bold`}>
              {prefix}
            </div>
            {/* Content */}
            <div className={`flex-1 py-[3px] pr-4 whitespace-pre ${contentColor} overflow-x-auto`}>
              {line.content.substring(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Single file diff card ────────────────────────────────────────────────────

function FileDiffCard({ file }: { file: FileDiff }) {
  const [collapsed, setCollapsed] = useState(file.hunks.length === 0);
  const ext = fileExt(file.path);

  return (
    <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0d0d14]">
      {/* File header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-colors select-none"
        onClick={() => setCollapsed((p) => !p)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <FileStatusBadge status={file.status} />
          <span className="text-sm font-mono text-white/80 truncate">{file.path}</span>
          {ext && (
            <span className="hidden sm:inline text-[10px] text-white/25 bg-white/[0.05] px-1.5 py-0.5 rounded font-mono">
              .{ext}
            </span>
          )}
        </div>
        <DiffStatBar additions={file.additions} deletions={file.deletions} />
      </div>

      {/* Diff body */}
      {!collapsed && (
        file.isBinary ? (
          <div className="px-4 py-6 text-center text-white/30 text-sm">
            Binary file — no preview available
          </div>
        ) : file.hunks.length === 0 ? (
          <div className="px-4 py-6 text-center text-white/30 text-sm">
            No changes
          </div>
        ) : (
          <div className="overflow-x-auto">
            {file.hunks.map((hunk, i) => (
              <DiffHunkBlock key={i} hunk={hunk} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── Changes tab ─────────────────────────────────────────────────────────────

function ChangesTab({
  repoName,
  pr,
  fetchDiff,
}: {
  repoName: string;
  pr: PullRequest;
  fetchDiff: (n: number) => Promise<PRDiff | null>;
}) {
  const [diff, setDiff] = useState<PRDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDiff(pr.number).then((d) => {
      if (!d) setErr("Failed to load changes");
      else setDiff(d);
      setLoading(false);
    });
  }, [pr.number, fetchDiff]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-white/[0.08] rounded-xl overflow-hidden animate-pulse">
            <div className="h-10 bg-white/[0.04]" />
            <div className="h-40 bg-white/[0.02]" />
          </div>
        ))}
      </div>
    );
  }

  if (err) {
    return (
      <div className="flex items-center gap-2 text-rose-400 text-sm py-8 justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {err}
      </div>
    );
  }

  if (!diff || diff.files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-white/40 text-sm">No file changes found for this pull request</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-white/40 text-sm">
          <span className="text-white/70 font-medium">{diff.files.length}</span> file{diff.files.length !== 1 ? "s" : ""} changed
        </span>
        <DiffStatBar additions={diff.additions} deletions={diff.deletions} />
      </div>

      {/* File jump list */}
      <div className="flex flex-wrap gap-1.5 px-1">
        {diff.files.map((f) => (
          <a
            key={f.path}
            href={`#file-${f.path.replace(/\//g, "-").replace(/\./g, "_")}`}
            className="inline-flex items-center gap-1 text-xs font-mono text-indigo-300/70 hover:text-indigo-200 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] px-2 py-0.5 rounded transition-colors"
          >
            <FileStatusBadge status={f.status} />
            <span className="max-w-[160px] truncate">{f.path}</span>
          </a>
        ))}
      </div>

      {/* File diffs */}
      <div className="space-y-4 mt-2">
        {diff.files.map((f) => (
          <div
            key={f.path}
            id={`file-${f.path.replace(/\//g, "-").replace(/\./g, "_")}`}
          >
            <FileDiffCard file={f} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Conversation tab ─────────────────────────────────────────────────────────

function ConversationTab({
  pr,
  repoName,
  onMerge,
  onClose,
  onAddComment,
  mergeLoading,
}: {
  pr: PullRequest;
  repoName: string;
  onMerge: (method: "merge" | "squash" | "rebase") => void;
  onClose: () => void;
  onAddComment: (body: string) => void;
  mergeLoading: boolean;
}) {
  const [commentBody, setCommentBody] = useState("");
  const [mergeMenu, setMergeMenu] = useState(false);

  function handleComment() {
    if (!commentBody.trim()) return;
    onAddComment(commentBody);
    setCommentBody("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
      {/* Main column */}
      <div className="space-y-4">
        {/* Body */}
        {pr.body && (
          <div className="border border-white/[0.08] rounded-xl bg-[#0d0d14] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
                {pr.authorName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white/70">{pr.authorName}</span>
              <span className="text-white/25 text-xs">opened {timeAgo(pr.createdAt)}</span>
            </div>
            <div className="px-4 py-4 text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
              {pr.body}
            </div>
          </div>
        )}

        {/* Comments */}
        {(pr.comments ?? []).map((c: PRComment) => (
          <div key={c.id} className="border border-white/[0.08] rounded-xl bg-[#0d0d14] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
                {c.authorName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white/70">{c.authorName}</span>
              <span className="text-white/25 text-xs">{timeAgo(c.createdAt)}</span>
              {c.isEdited && <span className="text-white/20 text-xs">· edited</span>}
              {c.filePath && (
                <span className="ml-auto text-white/25 text-xs font-mono">
                  {c.filePath}{c.lineNumber ? `:${c.lineNumber}` : ""}
                </span>
              )}
            </div>
            <div className="px-4 py-3 text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
              {c.body}
            </div>
          </div>
        ))}

        {/* Merge status */}
        {pr.state === "open" && (
          <div className={`border rounded-xl p-4 flex items-start gap-3 ${
            pr.isMergeable
              ? "border-emerald-500/20 bg-emerald-500/[0.05]"
              : "border-amber-500/20 bg-amber-500/[0.05]"
          }`}>
            {pr.isMergeable ? (
              <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${pr.isMergeable ? "text-emerald-300" : "text-amber-300"}`}>
                {pr.isMergeable ? "This branch has no conflicts with the base branch" : "This branch has conflicts"}
              </p>
              <p className={`text-xs mt-0.5 ${pr.isMergeable ? "text-emerald-400/60" : "text-amber-400/60"}`}>
                {pr.isMergeable
                  ? `Merging ${pr.headBranch} into ${pr.baseBranch}`
                  : "Resolve conflicts before merging"}
              </p>
            </div>
            {pr.isMergeable && (
              <div className="relative flex-shrink-0">
                <div className="flex rounded-lg overflow-hidden border border-indigo-500/30">
                  <button
                    disabled={mergeLoading}
                    onClick={() => onMerge("merge")}
                    className="px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {mergeLoading ? "Merging…" : "Merge"}
                  </button>
                  <button
                    onClick={() => setMergeMenu((p) => !p)}
                    className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-l border-indigo-400/30 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {mergeMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#16161a] border border-white/[0.12] rounded-lg shadow-xl z-10 overflow-hidden">
                    {(["merge", "squash", "rebase"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => { onMerge(m); setMergeMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors capitalize cursor-pointer"
                      >
                        {m === "merge" ? "Create a merge commit" : m === "squash" ? "Squash and merge" : "Rebase and merge"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* State banners */}
        {pr.state === "merged" && (
          <div className="border border-violet-500/20 bg-violet-500/[0.06] rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-violet-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005L5 3.25Z" />
            </svg>
            <p className="text-sm text-violet-300">
              Merged {pr.mergedAt ? timeAgo(pr.mergedAt) : ""} into <span className="font-mono text-violet-200">{pr.baseBranch}</span>
            </p>
          </div>
        )}
        {pr.state === "closed" && (
          <div className="border border-rose-500/20 bg-rose-500/[0.05] rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-rose-300">
              Closed {pr.closedAt ? timeAgo(pr.closedAt) : ""}
            </p>
          </div>
        )}

        {/* Add comment */}
        <div className="border border-white/[0.08] rounded-xl bg-[#0d0d14] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] text-sm text-white/40 bg-white/[0.02]">
            Leave a comment
          </div>
          <div className="p-3">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment…"
              rows={4}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/25 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleComment}
                disabled={!commentBody.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Details */}
        <div className="border border-white/[0.08] rounded-xl bg-[#0d0d14] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06] text-xs font-semibold text-white/40 uppercase tracking-wider">
            Details
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs text-white/30 mb-1">Branches</p>
              <div className="flex items-center gap-1 text-xs font-mono">
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/60 border border-white/[0.08]">{pr.headBranch}</span>
                <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/60 border border-white/[0.08]">{pr.baseBranch}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-1">Author</p>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                  {pr.authorName[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-white/60">{pr.authorName}</span>
              </div>
            </div>
            {(pr.labels ?? []).length > 0 && (
              <div>
                <p className="text-xs text-white/30 mb-1.5">Labels</p>
                <div className="flex flex-wrap gap-1">
                  {(pr.labels ?? []).map((l) => {
                    const bg = l.color ? `#${l.color.replace("#", "")}` : "#6366f1";
                    return (
                      <span
                        key={l.name}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}
                      >
                        {l.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {pr.state === "open" && (
              <div className="pt-1">
                <button
                  onClick={onClose}
                  className="w-full text-center py-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 rounded-lg transition-colors cursor-pointer"
                >
                  Close pull request
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Changed files summary */}
        {(pr.changedFiles ?? []).length > 0 && (
          <div className="border border-white/[0.08] rounded-xl bg-[#0d0d14] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06] text-xs font-semibold text-white/40 uppercase tracking-wider">
              Files changed ({(pr.changedFiles ?? []).length})
            </div>
            <div className="p-2 space-y-0.5 max-h-60 overflow-y-auto">
              {(pr.changedFiles ?? []).map((f) => (
                <div key={f} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.04] transition-colors">
                  <svg className="w-3 h-3 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-mono text-white/40 truncate">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Commits tab ─────────────────────────────────────────────────────────────

function CommitsTab({ pr }: { pr: PullRequest }) {
  return (
    <div className="border border-white/[0.08] rounded-xl bg-[#0d0d14] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
          </svg>
          Changes from <span className="font-mono text-white/70 mx-1">{pr.headBranch}</span> into <span className="font-mono text-white/70 mx-1">{pr.baseBranch}</span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <svg className="w-5 h-5 text-white/20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
          </svg>
        </div>
        <div>
          <p className="text-white/40 text-sm font-medium">Commit history</p>
          <p className="text-white/20 text-xs mt-1">
            {(pr.changedFiles ?? []).length} file{(pr.changedFiles ?? []).length !== 1 ? "s" : ""} changed · +{pr.additions} −{pr.deletions}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "conversation" | "changes" | "commits";

export default function PRDetailPage({
  params,
}: {
  params: Promise<{ name: string; number: string }>;
}) {
  const { name, number: numStr } = use(params);
  const num = parseInt(numStr, 10);

  const { fetchPR, fetchDiff, mergePR, updatePR, addComment, actionLoading } =
    usePullRequests(name);

  const [pr, setPr] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("conversation");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchPR(num);
    setPr(data);
    setLoading(false);
  }, [fetchPR, num]);

  useEffect(() => { load(); }, [load]);

  async function handleMerge(method: "merge" | "squash" | "rebase") {
    const updated = await mergePR(num, method);
    if (updated) setPr(updated);
  }

  async function handleClose() {
    const updated = await updatePR(num, { state: "closed" });
    if (updated) setPr(updated);
  }

  async function handleComment(body: string) {
    const ok = await addComment(num, body);
    if (ok) load();
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-4 bg-white/[0.06] rounded w-64" />
          <div className="h-8 bg-white/[0.06] rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 bg-white/[0.06] rounded-full w-16" />
            <div className="h-6 bg-white/[0.04] rounded w-48" />
          </div>
          <div className="h-40 bg-white/[0.04] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white/40 text-sm">Pull request #{num} not found</p>
          <Link href={`/dashboard/repositories/${name}/pulls`} className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            ← Back to pull requests
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "conversation", label: "Conversation", count: pr.commentCount },
    {
      id: "changes",
      label: "Changes",
      count: pr.changedFiles?.length ?? 0,
    },
    { id: "commits", label: "Commits" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

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
          <Link href={`/dashboard/repositories/${name}/pulls`} className="hover:text-white transition-colors">
            Pull Requests
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70">#{pr.number}</span>
        </div>

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white leading-tight flex-1 min-w-0">
              {pr.title}
              <span className="ml-2 text-white/30 font-normal">#{pr.number}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <StateBadge state={pr.state} />
            {pr.isDraft && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-white/40 bg-white/[0.06] border border-white/[0.08]">
                Draft
              </span>
            )}
            <span className="text-white/35 text-sm">
              {pr.authorName} wants to merge changes from{" "}
              <span className="font-mono text-white/60">{pr.headBranch}</span> into{" "}
              <span className="font-mono text-white/60">{pr.baseBranch}</span>
              {" · "}{timeAgo(pr.createdAt)}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 pt-1">
            {(pr.additions > 0 || pr.deletions > 0) && (
              <DiffStatBar additions={pr.additions} deletions={pr.deletions} />
            )}
            {pr.changedFiles && pr.changedFiles.length > 0 && (
              <span className="text-xs text-white/30">
                {pr.changedFiles.length} file{pr.changedFiles.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 border-b border-white/[0.08]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                tab === t.id
                  ? "border-indigo-400 text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t.id === "conversation" && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
              {t.id === "changes" && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {t.id === "commits" && (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
                </svg>
              )}
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.08] text-white/50 font-mono">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ────────────────────────────────────────────────── */}
        <div>
          {tab === "conversation" && (
            <ConversationTab
              pr={pr}
              repoName={name}
              onMerge={handleMerge}
              onClose={handleClose}
              onAddComment={handleComment}
              mergeLoading={actionLoading}
            />
          )}
          {tab === "changes" && (
            <ChangesTab
              repoName={name}
              pr={pr}
              fetchDiff={fetchDiff}
            />
          )}
          {tab === "commits" && <CommitsTab pr={pr} />}
        </div>
      </div>
    </div>
  );
}
