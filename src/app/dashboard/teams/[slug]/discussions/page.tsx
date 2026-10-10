
"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listDiscussions,
  createDiscussion,
  deleteDiscussion,
  pinDiscussion,
  resolveDiscussion,
  getMyMembership,
  TeamDiscussion,
} from "@/hooks/useTeams";
import { useDiscussionSocket, DiscussionSocketEvent } from "@/hooks/useDiscussionSocket";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 4l-1.5 5H9.5L8 4h8zm-1 6l1 5H8l1-5h6zm-3 6v4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" />
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

function IconChat() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

// ─── New Discussion Modal ─────────────────────────────────────────────────────

function NewDiscussionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, body: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { setErr("Title and description are required"); return; }
    setSaving(true);
    setErr(null);
    try {
      await onCreate(title.trim(), body.trim());
      onClose();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Failed to create");
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
        <h2 className="text-base font-semibold text-white">New Discussion</h2>
        {err && <p className="text-rose-400 text-xs px-3 py-2 bg-rose-500/10 rounded-lg">{err}</p>}

        <div className="space-y-1.5">
          <label className="text-xs text-white/50">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What would you like to discuss?"
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/50">Description</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add more context to start the discussion…"
            rows={5}
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:text-white/70 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? "Creating…" : "Create Discussion"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Time helper ──────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps { params: Promise<{ slug: string }> }

export default function TeamDiscussionsPage({ params }: PageProps) {
  const { slug } = use(params);
  const [discussions, setDiscussions] = useState<TeamDiscussion[]>([]);
  const [loading, setLoading]         = useState(true);
  const [myRole, setMyRole]           = useState<string | null>(null);
  const [showNew, setShowNew]         = useState(false);
  const [msg, setMsg]                 = useState<string | null>(null);
  const [filter, setFilter]           = useState<"all" | "open" | "resolved">("all");

  async function load() {
    setLoading(true);
    try {
      const [membership, list] = await Promise.all([
        getMyMembership(slug),
        listDiscussions(slug, 50, 0),
      ]);
      setMyRole(membership?.role ?? null);
      setDiscussions(list ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (slug) load(); }, [slug]);

  // ── Real-time updates via WebSocket ──────────────────────────────────────
  const handleSocketEvent = useCallback((evt: DiscussionSocketEvent) => {
    switch (evt.type) {
      case "new_discussion": {
        const d = evt.payload as TeamDiscussion;
        setDiscussions(prev => {
          if (prev.some(x => x.id === d.id)) return prev; // dedupe
          return [d, ...prev];
        });
        break;
      }
      case "update_discussion": {
        const d = evt.payload as TeamDiscussion;
        setDiscussions(prev => prev.map(x => x.id === d.id ? d : x));
        break;
      }
      case "delete_discussion": {
        const { discussionId } = evt.payload as { discussionId: string };
        setDiscussions(prev => prev.filter(x => x.id !== discussionId));
        break;
      }
      case "pin_discussion": {
        const { discussionId, pinned } = evt.payload as { discussionId: string; pinned: boolean };
        setDiscussions(prev => prev.map(x => x.id === discussionId ? { ...x, pinned } : x));
        break;
      }
      case "resolve_discussion": {
        const { discussionId, resolved } = evt.payload as { discussionId: string; resolved: boolean };
        setDiscussions(prev => prev.map(x => x.id === discussionId ? { ...x, resolved } : x));
        break;
      }
      case "new_reply": {
        // bump reply count for the relevant discussion
        const r = evt.payload as { discussionId: string };
        setDiscussions(prev => prev.map(x =>
          x.id === r.discussionId ? { ...x, replyCount: x.replyCount + 1 } : x
        ));
        break;
      }
      case "delete_reply": {
        const { discussionId } = evt.payload as { discussionId: string };
        setDiscussions(prev => prev.map(x =>
          x.id === discussionId ? { ...x, replyCount: Math.max(0, x.replyCount - 1) } : x
        ));
        break;
      }
    }
  }, []);

  useDiscussionSocket(slug, handleSocketEvent);

  const isAdmin = myRole === "owner" || myRole === "admin";

  const filtered = discussions.filter(d => {
    if (filter === "open")     return !d.resolved;
    if (filter === "resolved") return d.resolved;
    return true;
  });

  async function handleCreate(title: string, body: string) {
    await createDiscussion(slug, title, body);
    // Don't optimistically add to state — the WS new_discussion event fires
    // for all clients (including the creator) and is the single source of truth.
    setMsg("Discussion created!");
    setTimeout(() => setMsg(null), 3000);
  }

  async function handlePin(d: TeamDiscussion) {
    await pinDiscussion(slug, d.id, !d.pinned);
    setDiscussions(prev => prev.map(x => x.id === d.id ? { ...x, pinned: !x.pinned } : x));
  }

  async function handleResolve(d: TeamDiscussion) {
    await resolveDiscussion(slug, d.id, !d.resolved);
    setDiscussions(prev => prev.map(x => x.id === d.id ? { ...x, resolved: !x.resolved } : x));
  }

  async function handleDelete(d: TeamDiscussion) {
    await deleteDiscussion(slug, d.id);
    setDiscussions(prev => prev.filter(x => x.id !== d.id));
    setMsg("Discussion deleted");
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {showNew && (
        <NewDiscussionModal
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/dashboard/teams/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white/60 transition-colors mb-3">
              <IconArrowLeft /> Back to Team
            </Link>
            <h1 className="text-xl font-bold text-white">Discussions</h1>
            <p className="text-white/40 text-sm mt-0.5">/{slug}</p>
          </div>
          {myRole && (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              <IconPlus /> New Discussion
            </button>
          )}
        </div>

        {/* Message */}
        {msg && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm flex items-center justify-between">
            {msg}
            <button onClick={() => setMsg(null)} className="text-violet-400/60 hover:text-violet-300 text-lg leading-none">×</button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
          {(["all", "open", "resolved"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-white/40 hover:text-white/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
              <IconChat />
            </div>
            <p className="text-white/30 text-sm">No discussions yet.</p>
            {myRole && (
              <button onClick={() => setShowNew(true)} className="mt-4 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-300 text-sm hover:bg-violet-600/30 transition-colors">
                Start the first discussion
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => (
              <div
                key={d.id}
                className={`group relative rounded-2xl border bg-[#0d0d14] hover:bg-[#10101a] transition-colors ${
                  d.pinned ? "border-violet-500/25" : "border-white/[0.07]"
                }`}
              >
                {/* Pin stripe */}
                {d.pinned && (
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-violet-500/50 rounded-full ml-px" />
                )}

                <div className="flex items-start gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {d.authorAvatar
                      ? <img src={d.authorAvatar} alt={d.authorName} className="w-full h-full rounded-full object-cover" />
                      : avatarFallback(d.authorName)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/teams/${slug}/discussions/${d.id}`}
                        className="text-sm font-semibold text-white/90 hover:text-white transition-colors line-clamp-1"
                      >
                        {d.title}
                      </Link>
                      {d.pinned && (
                        <span className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                          <IconPin /> Pinned
                        </span>
                      )}
                      {d.resolved && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                          <IconCheck /> Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/35 mt-1 line-clamp-1">{d.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-white/30">{d.authorName}</span>
                      <span className="text-white/15">·</span>
                      <span className="text-[11px] text-white/25">{timeAgo(d.createdAt)}</span>
                      <span className="text-white/15">·</span>
                      <span className="flex items-center gap-1 text-[11px] text-white/30">
                        <IconChat /> {d.replyCount} {d.replyCount === 1 ? "reply" : "replies"}
                      </span>
                    </div>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => handlePin(d)}
                        title={d.pinned ? "Unpin" : "Pin"}
                        className={`p-1.5 rounded-lg transition-colors ${d.pinned ? "text-violet-400 bg-violet-500/10" : "text-white/25 hover:text-violet-400 hover:bg-violet-500/10"}`}
                      >
                        <IconPin />
                      </button>
                      <button
                        onClick={() => handleResolve(d)}
                        title={d.resolved ? "Reopen" : "Resolve"}
                        className={`p-1.5 rounded-lg transition-colors ${d.resolved ? "text-emerald-400 bg-emerald-500/10" : "text-white/25 hover:text-emerald-400 hover:bg-emerald-500/10"}`}
                      >
                        <IconCheck />
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
