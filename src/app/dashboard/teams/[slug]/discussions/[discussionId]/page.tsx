
"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getDiscussion,
  addReply,
  deleteReply,
  updateDiscussion,
  pinDiscussion,
  resolveDiscussion,
  deleteDiscussion,
  getMyMembership,
  getMyReactions,
  reactToDiscussion,
  reactToReply,
  TeamDiscussion,
  TeamDiscussionReply,
  DiscussionReactions,
  DiscussionReactionKey,
} from "@/hooks/useTeams";
import { useRouter } from "next/navigation";
import { useDiscussionSocket, DiscussionSocketEvent } from "@/hooks/useDiscussionSocket";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3 7h5l-4 5 1.5 7L12 17l-5.5 4L8 15 4 10h5l3-8z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const REACTION_EMOJIS: { key: DiscussionReactionKey; emoji: string; label: string }[] = [
  { key: "thumbsUp", emoji: "👍", label: "Thumbs up" },
  { key: "heart",    emoji: "❤️", label: "Heart" },
  { key: "hooray",   emoji: "🎉", label: "Hooray" },
  { key: "rocket",   emoji: "🚀", label: "Rocket" },
  { key: "eyes",     emoji: "👀", label: "Eyes" },
  { key: "laugh",    emoji: "😄", label: "Laugh" },
];

// ─── Reaction Bar with popover picker ────────────────────────────────────────
// Shows only non-zero pills inline. A single "😊 +" button opens a floating
// picker with all 6 emojis. Clicking a reaction toggles it (server dedup).

function ReactionBar({
  reactions,
  myReactions,
  onReact,
  disabled,
}: {
  reactions: DiscussionReactions;
  myReactions: Set<DiscussionReactionKey>;
  onReact: (key: DiscussionReactionKey) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<DiscussionReactionKey | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function handleReact(key: DiscussionReactionKey) {
    if (pendingKey) return;
    setOpen(false);
    setPendingKey(key);
    try {
      await onReact(key);
    } finally {
      setPendingKey(null);
    }
  }

  const nonZeroEntries = REACTION_EMOJIS.filter(({ key }) => reactions[key] > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2 relative">
      {/* Existing reaction pills (non-zero counts) */}
      {nonZeroEntries.map(({ key, emoji, label }) => {
        const count = reactions[key];
        const mine = myReactions.has(key);
        const isPending = pendingKey === key;
        return (
          <button
            key={key}
            onClick={() => handleReact(key)}
            disabled={disabled || !!pendingKey}
            title={mine ? `Remove ${label}` : label}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all cursor-pointer select-none ${
              mine
                ? "bg-violet-500/25 border-violet-500/50 text-violet-200 hover:bg-violet-500/15 hover:border-violet-500/30"
                : "bg-white/[0.05] border-white/[0.10] text-white/70 hover:bg-violet-500/10 hover:border-violet-500/25 hover:text-violet-300"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span className={`tabular-nums ${isPending ? "opacity-50" : ""}`}>{count}</span>
          </button>
        );
      })}

      {/* Add-reaction trigger button */}
      {!disabled && (
        <div ref={popoverRef} className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            title="Add reaction"
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border border-dashed border-white/[0.12] text-white/30 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/08 transition-all select-none"
          >
            <span className="text-sm leading-none">😊</span>
            <span className="font-medium leading-none">+</span>
          </button>

          {/* Popover picker */}
          {open && (
            <div className="absolute bottom-full left-0 mb-2 z-30 bg-[#16161f] border border-white/[0.10] rounded-2xl shadow-2xl p-2 flex gap-1">
              {REACTION_EMOJIS.map(({ key, emoji, label }) => {
                const mine = myReactions.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleReact(key)}
                    disabled={!!pendingKey}
                    title={label}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs transition-all hover:bg-white/[0.08] ${
                      mine ? "bg-violet-500/20 ring-1 ring-violet-500/40" : ""
                    } disabled:opacity-50`}
                  >
                    <span className="text-xl leading-none">{emoji}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function avatarFallback(name: string) {
  return name?.slice(0, 2).toUpperCase() || "?";
}

function Avatar({ name, src, size = 9 }: { name: string; src?: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full bg-violet-600/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden`;
  return (
    <div className={cls}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : avatarFallback(name)}
    </div>
  );
}

// ─── Edit Discussion Modal ────────────────────────────────────────────────────

function EditModal({
  discussion,
  onClose,
  onSave,
}: {
  discussion: TeamDiscussion;
  onClose: () => void;
  onSave: (title: string, body: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(discussion.title);
  const [body, setBody]   = useState(discussion.body);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { setErr("Title and description are required"); return; }
    setSaving(true);
    try {
      await onSave(title.trim(), body.trim());
      onClose();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Failed");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0d0d14] border border-white/[0.09] rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <h2 className="text-base font-semibold text-white">Edit Discussion</h2>
        {err && <p className="text-rose-400 text-xs px-3 py-2 bg-rose-500/10 rounded-lg">{err}</p>}
        <div className="space-y-1.5">
          <label className="text-xs text-white/50">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50">Description</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:text-white/70 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string; discussionId: string }>;
}

export default function DiscussionDetailPage({ params }: PageProps) {
  const { slug, discussionId } = use(params);
  const router = useRouter();

  const [discussion, setDiscussion] = useState<TeamDiscussion | null>(null);
  const [replies, setReplies]       = useState<TeamDiscussionReply[]>([]);
  const [loading, setLoading]       = useState(true);
  const [myRole, setMyRole]         = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [replyText, setReplyText]   = useState("");
  const [sending, setSending]       = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  // Per-user reaction tracking (client-side optimistic; keys the current user has toggled on)
  const [myDiscussionReactions, setMyDiscussionReactions] = useState<Set<DiscussionReactionKey>>(new Set());
  const [myReplyReactions, setMyReplyReactions] = useState<Map<string, Set<DiscussionReactionKey>>>(new Map());

  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [membership, { discussion: d, replies: r }, myRxns] = await Promise.all([
        getMyMembership(slug),
        getDiscussion(slug, discussionId),
        getMyReactions(slug, discussionId).catch(() => ({ discussionReactions: [], replyReactions: {} })),
      ]);
      setMyRole(membership?.role ?? null);
      setMyUsername(membership?.username ?? null);
      setDiscussion(d);
      setReplies(r ?? []);
      // Hydrate which reactions the current user has already given
      setMyDiscussionReactions(
        new Set((myRxns.discussionReactions ?? []) as DiscussionReactionKey[])
      );
      const replyMap = new Map<string, Set<DiscussionReactionKey>>();
      for (const [replyId, keys] of Object.entries(myRxns.replyReactions ?? {})) {
        replyMap.set(replyId, new Set(keys as DiscussionReactionKey[]));
      }
      setMyReplyReactions(replyMap);
    } catch {
      setErr("Failed to load discussion");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (slug && discussionId) load(); }, [slug, discussionId]);

  // Scroll to bottom when replies load
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading, replies.length]);

  const isAdmin = myRole === "owner" || myRole === "admin";

  const handleSocketEvent = useCallback((evt: DiscussionSocketEvent) => {
    console.log("[ThreadPage] socket event:", evt.type, "discussionId param:", discussionId);
    switch (evt.type) {
      case "new_reply": {
        const r = evt.payload as TeamDiscussionReply;
        console.log("[ThreadPage] new_reply r.discussionId:", r.discussionId, "param:", discussionId);
        if (r.discussionId !== discussionId) return;
        setReplies(prev => prev.some(x => x.id === r.id) ? prev : [...prev, r]);
        setDiscussion(prev => prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        break;
      }
      case "delete_reply": {
        const { replyId, discussionId: dId } = evt.payload as { replyId: string; discussionId: string };
        if (dId !== discussionId) return;
        setReplies(prev => prev.filter(r => r.id !== replyId));
        setDiscussion(prev => prev ? { ...prev, replyCount: Math.max(0, prev.replyCount - 1) } : prev);
        break;
      }
      case "update_discussion": {
        const d = evt.payload as TeamDiscussion;
        if (d.id !== discussionId) return;
        setDiscussion(d);
        break;
      }
      case "pin_discussion": {
        const { discussionId: dId, pinned } = evt.payload as { discussionId: string; pinned: boolean };
        if (dId !== discussionId) return;
        setDiscussion(prev => prev ? { ...prev, pinned } : prev);
        break;
      }
      case "resolve_discussion": {
        const { discussionId: dId, resolved } = evt.payload as { discussionId: string; resolved: boolean };
        if (dId !== discussionId) return;
        setDiscussion(prev => prev ? { ...prev, resolved } : prev);
        break;
      }
      case "delete_discussion": {
        const { discussionId: dId } = evt.payload as { discussionId: string };
        if (dId !== discussionId) return;
        router.push(`/dashboard/teams/${slug}/discussions`);
        break;
      }
    }
  }, [discussionId, slug, router]);

  useDiscussionSocket(slug, handleSocketEvent);

  async function handleSendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await addReply(slug, discussionId, replyText.trim());
      // Don't optimistically add to state here — the WS new_reply event
      // will fire for all clients including the sender, so we let that
      // be the single source of truth to avoid double-rendering.
      setReplyText("");
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteReply(replyId: string) {
    await deleteReply(slug, discussionId, replyId);
    setReplies(prev => prev.filter(r => r.id !== replyId));
    setDiscussion(prev => prev ? { ...prev, replyCount: Math.max(0, prev.replyCount - 1) } : prev);
  }

  async function handlePin() {
    if (!discussion) return;
    await pinDiscussion(slug, discussion.id, !discussion.pinned);
    setDiscussion(prev => prev ? { ...prev, pinned: !prev.pinned } : prev);
  }

  async function handleResolve() {
    if (!discussion) return;
    await resolveDiscussion(slug, discussion.id, !discussion.resolved);
    setDiscussion(prev => prev ? { ...prev, resolved: !prev.resolved } : prev);
  }

  async function handleDelete() {
    if (!discussion) return;
    await deleteDiscussion(slug, discussion.id);
    router.push(`/dashboard/teams/${slug}/discussions`);
  }

  async function handleEdit(title: string, body: string) {
    if (!discussion) return;
    const updated = await updateDiscussion(slug, discussion.id, title, body);
    setDiscussion(updated);
  }

  async function handleReactToDiscussion(key: DiscussionReactionKey) {
    if (!discussion) return;
    // Optimistic: determine if currently reacted
    const wasAdded = myDiscussionReactions.has(key);
    const delta = wasAdded ? -1 : 1;
    // Optimistic UI update
    setDiscussion(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        reactions: { ...prev.reactions, [key]: Math.max(0, (prev.reactions?.[key] ?? 0) + delta) },
      };
    });
    setMyDiscussionReactions(prev => {
      const next = new Set(prev);
      wasAdded ? next.delete(key) : next.add(key);
      return next;
    });
    try {
      const added = await reactToDiscussion(slug, discussion.id, key);
      // Reconcile with server truth
      setMyDiscussionReactions(prev => {
        const next = new Set(prev);
        added ? next.add(key) : next.delete(key);
        return next;
      });
    } catch {
      // Rollback optimistic changes
      setDiscussion(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reactions: { ...prev.reactions, [key]: Math.max(0, (prev.reactions?.[key] ?? 0) - delta) },
        };
      });
      setMyDiscussionReactions(prev => {
        const next = new Set(prev);
        wasAdded ? next.add(key) : next.delete(key);
        return next;
      });
    }
  }

  async function handleReactToReply(replyId: string, key: DiscussionReactionKey) {
    const replySet = myReplyReactions.get(replyId) ?? new Set<DiscussionReactionKey>();
    const wasAdded = replySet.has(key);
    const delta = wasAdded ? -1 : 1;
    // Optimistic update
    setReplies(prev =>
      prev.map(r =>
        r.id === replyId
          ? { ...r, reactions: { ...r.reactions, [key]: Math.max(0, (r.reactions?.[key] ?? 0) + delta) } }
          : r
      )
    );
    setMyReplyReactions(prev => {
      const next = new Map(prev);
      const s = new Set(next.get(replyId) ?? []);
      wasAdded ? s.delete(key) : s.add(key);
      next.set(replyId, s);
      return next;
    });
    try {
      const added = await reactToReply(slug, discussionId, replyId, key);
      setMyReplyReactions(prev => {
        const next = new Map(prev);
        const s = new Set(next.get(replyId) ?? []);
        added ? s.add(key) : s.delete(key);
        next.set(replyId, s);
        return next;
      });
    } catch {
      // Rollback
      setReplies(prev =>
        prev.map(r =>
          r.id === replyId
            ? { ...r, reactions: { ...r.reactions, [key]: Math.max(0, (r.reactions?.[key] ?? 0) - delta) } }
            : r
        )
      );
      setMyReplyReactions(prev => {
        const next = new Map(prev);
        const s = new Set(next.get(replyId) ?? []);
        wasAdded ? s.add(key) : s.delete(key);
        next.set(replyId, s);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">
        <div className="space-y-3 w-full max-w-3xl mx-auto px-6 py-8">
          <div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">
        <p className="text-white/40">{err ?? "Discussion not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      {showEdit && (
        <EditModal
          discussion={discussion}
          onClose={() => setShowEdit(false)}
          onSave={handleEdit}
        />
      )}

      <div className="max-w-3xl w-full mx-auto px-6 py-8 flex flex-col flex-1">
        {/* Back */}
        <Link
          href={`/dashboard/teams/${slug}/discussions`}
          className="inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white/60 transition-colors mb-6"
        >
          <IconArrowLeft /> All Discussions
        </Link>

        {/* Discussion header */}
        <div className={`rounded-2xl border p-5 mb-6 ${discussion.pinned ? "border-violet-500/25 bg-[#0d0d14]" : "border-white/[0.07] bg-[#0d0d14]"}`}>
          <div className="flex items-start gap-4">
            <Avatar name={discussion.authorName} src={discussion.authorAvatar} size={10} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <h1 className="text-base font-bold text-white leading-snug">{discussion.title}</h1>
                {discussion.pinned && (
                  <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full mt-0.5">
                    <IconPin /> Pinned
                  </span>
                )}
                {discussion.resolved && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full mt-0.5">
                    <IconCheck /> Resolved
                  </span>
                )}
              </div>
              <p className="text-sm text-white/55 leading-relaxed whitespace-pre-wrap">{discussion.body}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-medium text-white/50">{discussion.authorName}</span>
                <span className="text-white/15">·</span>
                <span className="text-xs text-white/30">{timeAgo(discussion.createdAt)}</span>
                <span className="text-white/15">·</span>
                <span className="text-xs text-white/30">{discussion.replyCount} {discussion.replyCount === 1 ? "reply" : "replies"}</span>
              </div>
              {/* Reaction bar — discussion thread */}
              <ReactionBar
                reactions={discussion.reactions ?? { thumbsUp: 0, heart: 0, hooray: 0, rocket: 0, eyes: 0, laugh: 0 }}
                myReactions={myDiscussionReactions}
                onReact={handleReactToDiscussion}
                disabled={!myRole}
              />
            </div>

            {/* Author/admin actions */}
            {(isAdmin || myUsername === discussion.authorName) && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setShowEdit(true)} title="Edit" className="p-1.5 rounded-lg text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                  <IconEdit />
                </button>
                {isAdmin && (
                  <>
                    <button onClick={handlePin} title={discussion.pinned ? "Unpin" : "Pin"} className={`p-1.5 rounded-lg transition-colors ${discussion.pinned ? "text-violet-400 bg-violet-500/10" : "text-white/25 hover:text-violet-400 hover:bg-violet-500/10"}`}>
                      <IconPin />
                    </button>
                    <button onClick={handleResolve} title={discussion.resolved ? "Reopen" : "Resolve"} className={`p-1.5 rounded-lg transition-colors ${discussion.resolved ? "text-emerald-400 bg-emerald-500/10" : "text-white/25 hover:text-emerald-400 hover:bg-emerald-500/10"}`}>
                      <IconCheck />
                    </button>
                  </>
                )}
                <button onClick={handleDelete} title="Delete discussion" className="p-1.5 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <IconTrash />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        <div className="flex-1 space-y-3 mb-6">
          {replies.length === 0 ? (
            <p className="text-center text-white/25 text-sm py-8">No replies yet — be the first to reply!</p>
          ) : (
            replies.map((r, idx) => {
              const isMe = myUsername === r.authorName;
              const canDelete = isMe || isAdmin;
              return (
                <div key={r.id} className={`group flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                  <Avatar name={r.authorName} src={r.authorAvatar} size={8} />
                  <div className={`flex-1 max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-medium text-white/60">{r.authorName}</span>
                      <span className="text-[10px] text-white/25">{timeAgo(r.createdAt)}</span>
                    </div>
                    <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isMe
                        ? "bg-violet-600/25 border border-violet-500/20 text-white/90 rounded-tr-sm"
                        : "bg-white/[0.05] border border-white/[0.07] text-white/80 rounded-tl-sm"
                    }`}>
                      {r.body}
                    </div>
                    {/* Reaction bar — reply */}
                    <ReactionBar
                      reactions={r.reactions ?? { thumbsUp: 0, heart: 0, hooray: 0, rocket: 0, eyes: 0, laugh: 0 }}
                      myReactions={myReplyReactions.get(r.id) ?? new Set()}
                      onReact={(key) => handleReactToReply(r.id, key)}
                      disabled={!myRole}
                    />
                  </div>
                  {/* Delete reply */}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteReply(r.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/20 hover:text-rose-400 transition-all flex-shrink-0 mt-6"
                      title="Delete reply"
                    >
                      <IconTrash />
                    </button>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {err && (
          <p className="text-rose-400 text-xs mb-3 px-3 py-2 bg-rose-500/10 rounded-xl">{err}</p>
        )}

        {/* Reply input */}
        {myRole ? (
          <div className="sticky bottom-0 pb-2">
            <div className="flex items-center gap-3 bg-[#0d0d14] border border-white/[0.08] rounded-2xl p-3">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder="Write a reply… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none resize-none max-h-32 leading-relaxed"
                style={{ overflowY: "auto" }}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || sending}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 flex-shrink-0"
              >
                <IconSend />
              </button>
            </div>
            <p className="text-[10px] text-white/20 text-center mt-1.5">Enter to send · Shift+Enter for newline</p>
          </div>
        ) : (
          <p className="text-center text-white/25 text-sm py-4">You must be a team member to reply.</p>
        )}
      </div>
    </div>
  );
}
