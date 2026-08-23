
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePairSessions } from "@/hooks/usePairProgramming";
import type { PairSession } from "@/hooks/usePairProgramming";

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: PairSession["status"] }) {
  const map = {
    waiting:  { label: "Waiting",  cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    active:   { label: "Active",   cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    ended:    { label: "Ended",    cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {status === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      )}
      {label}
    </span>
  );
}

function SessionCard({ session, onEnd }: { session: PairSession; onEnd: (id: string) => void }) {
  const canJoin = session.status !== "ended";
  return (
    <div className="group relative bg-[#111113] border border-white/[0.07] rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-[#111118] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={session.status} />
            <span className="text-[10px] text-[#52525b] font-mono">
              {session.id.slice(-8).toUpperCase()}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white truncate">
            {session.filePath || "Untitled file"}
          </h3>
          <p className="text-xs text-[#71717a] mt-0.5 truncate">
            repo: {session.repoId || "—"}
          </p>
        </div>
        {/* Participants */}
        <div className="flex -space-x-1.5 flex-shrink-0">
          {(session.participants ?? []).slice(0, 5).map((p, i) => (
            <div
              key={p.userId}
              title={p.username}
              className="w-6 h-6 rounded-full border-2 border-[#111113] flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: p.color, zIndex: i }}
            >
              {p.username[0]?.toUpperCase()}
            </div>
          ))}
          {(session.participants ?? []).length > 5 && (
            <div className="w-6 h-6 rounded-full border-2 border-[#111113] bg-zinc-700 flex items-center justify-center text-[9px] text-zinc-300">
              +{session.participants.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Document preview */}
      {session.document && (
        <pre className="text-[10px] text-[#52525b] bg-black/30 rounded-lg px-3 py-2 mb-4 overflow-hidden max-h-14 font-mono leading-relaxed">
          {session.document.slice(0, 120)}{session.document.length > 120 ? "…" : ""}
        </pre>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-[#52525b]">
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M1 13c0-2.76 2.24-5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="11.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M9 13c0-1.66 1.12-3 2.5-3S14 11.34 14 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {session.participants?.length ?? 0} participant{session.participants?.length !== 1 ? "s" : ""}
          </span>
          <span>v{session.version}</span>
          <span>{formatDate(session.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {session.status !== "ended" && (
            <button
              onClick={() => onEnd(session.id)}
              className="text-[11px] text-[#71717a] hover:text-red-400 transition-colors cursor-pointer px-2 py-1"
            >
              End
            </button>
          )}
          {canJoin ? (
            <Link
              href={`/dashboard/pair/${session.id}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 rounded-lg px-3 py-1.5 hover:bg-indigo-500/25 transition-all"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {session.status === "waiting" ? "Open" : "Rejoin"}
            </Link>
          ) : (
            <span className="text-[11px] text-[#3f3f46] px-3 py-1.5">Session ended</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateSessionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (repoId: string, filePath: string, document: string) => Promise<void>;
}) {
  const [repoId, setRepoId] = useState("");
  const [filePath, setFilePath] = useState("");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoId.trim()) return;
    setLoading(true);
    await onCreate(repoId.trim(), filePath.trim(), document);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111113] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="text-base font-semibold text-white">New Pair Session</h2>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-white transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
              Repository ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={repoId}
              onChange={(e) => setRepoId(e.target.value)}
              placeholder="e.g. my-repo or MongoDB ObjectID"
              required
              className="w-full bg-[#0d0d0f] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
              File Path
            </label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="e.g. src/main.go"
              className="w-full bg-[#0d0d0f] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
              Initial Content
            </label>
            <textarea
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="Paste or type starting code here…"
              rows={5}
              className="w-full bg-[#0d0d0f] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-indigo-500/50 transition-colors resize-none font-mono"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[#71717a] border border-white/[0.07] hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !repoId.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? "Creating…" : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinByIdModal({ onClose, onJoin }: { onClose: () => void; onJoin: (id: string) => void }) {
  const [id, setId] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#111113] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="text-base font-semibold text-white">Join Session</h2>
          <button onClick={onClose} className="text-[#71717a] hover:text-white transition-colors cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Session ID</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Paste the session ID here…"
              className="w-full bg-[#0d0d0f] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[#71717a] border border-white/[0.07] hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => id.trim() && onJoin(id.trim())}
              disabled={!id.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PairProgrammingPage() {
  const { sessions, loading, error, createSession, joinSession, endSession } = usePairSessions();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "waiting" | "ended">("all");

  const filtered = sessions.filter((s) => filter === "all" || s.status === filter);

  const handleCreate = async (repoId: string, filePath: string, document: string) => {
    const sess = await createSession(repoId, filePath, document);
    if (sess) {
      setShowCreate(false);
      window.location.href = `/dashboard/pair/${sess.id}`;
    }
  };

  const handleJoin = async (sessionId: string) => {
    const sess = await joinSession(sessionId);
    if (sess) {
      setShowJoin(false);
      window.location.href = `/dashboard/pair/${sessionId}`;
    }
  };

  const handleEnd = async (sessionId: string) => {
    await endSession(sessionId);
  };

  const activeSessions = sessions.filter((s) => s.status === "active");
  const waitingSessions = sessions.filter((s) => s.status === "waiting");

  return (
    <div className="min-h-full bg-[#0d0d0f] px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Pair Programming</h1>
            <p className="text-sm text-[#71717a]">
              Real-time collaborative code editing with Operational Transform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.08] text-[#a1a1aa] hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Join by ID
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New Session
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active Sessions", value: activeSessions.length, color: "text-emerald-400", dot: true },
            { label: "Waiting",         value: waitingSessions.length, color: "text-amber-400",   dot: false },
            { label: "Total Sessions",  value: sessions.length,       color: "text-indigo-400",  dot: false },
          ].map(({ label, value, color, dot }) => (
            <div
              key={label}
              className="bg-[#111113] border border-white/[0.07] rounded-2xl px-5 py-4 flex items-center gap-3"
            >
              {dot && value > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              )}
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-[#52525b] mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[#111113] border border-white/[0.07] rounded-xl p-1 w-fit">
          {(["all", "active", "waiting", "ended"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === f
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/25"
                  : "text-[#71717a] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="5" width="22" height="16" rx="3" stroke="#6366f1" strokeWidth="1.5" />
                <path d="M10 10l-3 3 3 3M18 10l3 3-3 3M15 9l-2 8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">No sessions yet</h3>
            <p className="text-sm text-[#71717a] max-w-xs mb-6">
              Start a new pair programming session or join one with a session ID.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Start Your First Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((session) => (
              <SessionCard key={session.id} session={session} onEnd={handleEnd} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateSessionModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
      {showJoin && (
        <JoinByIdModal onClose={() => setShowJoin(false)} onJoin={handleJoin} />
      )}
    </div>
  );
}
