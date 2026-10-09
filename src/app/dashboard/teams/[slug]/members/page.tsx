
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  getMyMembership,
  listTeamMembers,
  listPendingInvites,
  listJoinRequests,
  updateMemberRole,
  removeMember,
  banMember,
  inviteMember,
  revokeInvite,
  reviewJoinRequest,
  TeamMember,
  TeamInvite,
  TeamJoinRequest,
} from "@/hooks/useTeams";

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

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconBan() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
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

function IconX() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = ["admin", "maintainer", "developer", "viewer", "guest"];

const ROLE_STYLES: Record<string, string> = {
  owner:      "text-amber-400 bg-amber-500/10 border-amber-500/20",
  admin:      "text-violet-400 bg-violet-500/10 border-violet-500/20",
  maintainer: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  developer:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  viewer:     "text-white/50 bg-white/[0.05] border-white/10",
  guest:      "text-white/30 bg-white/[0.03] border-white/[0.06]",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_STYLES[role] ?? ROLE_STYLES.guest;
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${cls}`}>{role}</span>
  );
}

function avatarFallback(name: string) {
  return name?.slice(0, 2).toUpperCase() || "?";
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

interface InviteModalProps {
  slug: string;
  onClose: () => void;
  onSuccess: () => void;
}

function InviteModal({ slug, onClose, onSuccess }: InviteModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState("developer");
  const [sending, setSending]   = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() && !email.trim()) { setErr("Provide username or email"); return; }
    setSending(true);
    setErr(null);
    try {
      await inviteMember(slug, username.trim(), email.trim(), role);
      onSuccess();
      onClose();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Failed");
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#0d0d14] border border-white/[0.09] rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <h2 className="text-base font-semibold text-white">Invite Member</h2>

        {err && <p className="text-rose-400 text-sm px-3 py-2 bg-rose-500/10 rounded-lg">{err}</p>}

        <div className="space-y-2">
          <label className="text-xs text-white/50">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="devflow_user"
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40"
          />
        </div>

        <div className="text-center text-xs text-white/25">— or —</div>

        <div className="space-y-2">
          <label className="text-xs text-white/50">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-white/50">Role to assign</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/40"
          >
            {ROLES.map(r => <option key={r} value={r} className="bg-[#0d0d14] capitalize">{r}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:text-white/70 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={sending} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {sending ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, message, confirmLabel, danger = true, loading = false, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0d0d14] border border-white/[0.09] rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-start gap-3">
          {danger && (
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-white/45 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:text-white/70 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 ${
              danger ? "bg-rose-600 hover:bg-rose-500" : "bg-violet-600 hover:bg-violet-500"
            }`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

type Tab = "members" | "invites" | "requests";

export default function TeamMembersPage({ params }: PageProps) {
  const { slug } = use(params);
  const [tab, setTab]           = useState<Tab>("members");
  const [members, setMembers]   = useState<TeamMember[]>([]);
  const [invites, setInvites]   = useState<TeamInvite[]>([]);
  const [requests, setRequests] = useState<TeamJoinRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  // Server-confirmed role — no localStorage matching
  const [myRole, setMyRole]     = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "remove" | "ban" | "unban";
    username: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [meRes, ms, invs, reqs] = await Promise.allSettled([
        getMyMembership(slug),
        listTeamMembers(slug, "", 100, 0),
        listPendingInvites(slug),
        listJoinRequests(slug),
      ]);
      if (meRes.status === "fulfilled")   setMyRole(meRes.value?.role ?? null);
      if (ms.status === "fulfilled")      setMembers(ms.value);
      if (invs.status === "fulfilled")    setInvites(invs.value);
      if (reqs.status === "fulfilled")    setRequests(reqs.value);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (slug) loadAll(); }, [slug]);

  const isAdmin = myRole === "owner" || myRole === "admin";

  // count only pending requests for the badge
  const pendingRequests = requests.filter(r => r.status === "pending" || !r.status || r.status === "");

  async function handleRoleChange(username: string, role: string) {
    try {
      await updateMemberRole(slug, username, role);
      setMsg("Role updated");
      loadAll();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  function handleRemove(username: string) {
    setConfirmAction({ type: "remove", username });
  }

  function handleBan(username: string, ban: boolean) {
    setConfirmAction({ type: ban ? "ban" : "unban", username });
  }

  async function executeConfirmAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === "remove") {
        await removeMember(slug, confirmAction.username);
        setMsg(`${confirmAction.username} removed`);
      } else if (confirmAction.type === "ban") {
        await banMember(slug, confirmAction.username, true);
        setMsg(`${confirmAction.username} banned`);
      } else {
        await banMember(slug, confirmAction.username, false);
        setMsg(`${confirmAction.username} unbanned`);
      }
      loadAll();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  async function handleRevoke(inviteId: string) {
    try {
      await revokeInvite(slug, inviteId);
      setMsg("Invite revoked");
      loadAll();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleReview(requestId: string, action: "approve" | "reject") {
    try {
      await reviewJoinRequest(slug, requestId, action);
      setMsg(action === "approve" ? "Request approved" : "Request rejected");
      loadAll();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  const confirmModalProps = confirmAction
    ? confirmAction.type === "remove"
      ? {
          title: "Remove member",
          message: `Remove ${confirmAction.username} from this team? They can rejoin if the team is public.`,
          confirmLabel: "Remove",
          danger: true as const,
        }
      : confirmAction.type === "ban"
      ? {
          title: "Ban member",
          message: `Ban ${confirmAction.username}? They will not be able to rejoin this team.`,
          confirmLabel: "Ban",
          danger: true as const,
        }
      : {
          title: "Unban member",
          message: `Unban ${confirmAction.username}? They will be able to rejoin this team.`,
          confirmLabel: "Unban",
          danger: false as const,
        }
    : null;

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {confirmAction && confirmModalProps && (
        <ConfirmModal
          {...confirmModalProps}
          loading={actionLoading}
          onConfirm={executeConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {showInvite && (
        <InviteModal
          slug={slug}
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setMsg("Invite sent!"); loadAll(); }}
        />
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/dashboard/teams/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white/60 transition-colors mb-3">
              <IconArrowLeft /> Back to Team
            </Link>
            <h1 className="text-xl font-bold text-white">Members & Invites</h1>
            <p className="text-white/40 text-sm mt-0.5">/{slug}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              <IconPlus /> Invite
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
          <button
            onClick={() => setTab("members")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "members" ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-white/40 hover:text-white/70"
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => setTab("invites")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "invites" ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-white/40 hover:text-white/70"
            }`}
          >
            Pending Invites ({invites.length})
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "requests" ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-white/40 hover:text-white/70"
            }`}
          >
            Join Requests ({requests.length})
            {pendingRequests.length > 0 && tab !== "requests" && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── MEMBERS ── */}
            {tab === "members" && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] overflow-hidden">
                {members.length === 0 ? (
                  <div className="py-16 text-center text-white/30 text-sm">No members found</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {members.map(m => (
                      <div key={m.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors ${m.isBanned ? "opacity-40" : ""}`}>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden">
                          {m.avatar ? <img src={m.avatar} alt={m.username} className="w-full h-full object-cover" /> : avatarFallback(m.username)}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white/85">{m.username}</span>
                            <RoleBadge role={m.role} />
                            {m.isBanned && <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Banned</span>}
                          </div>
                          <p className="text-[11px] text-white/30 mt-0.5">Joined {timeAgo(m.joinedAt)}</p>
                        </div>

                        {/* Actions */}
                        {isAdmin && m.role !== "owner" && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <select
                              value={m.role}
                              onChange={e => handleRoleChange(m.username, e.target.value)}
                              className="px-2 py-1 bg-white/[0.04] border border-white/[0.07] rounded-lg text-xs text-white/60 focus:outline-none focus:border-violet-500/40"
                            >
                              {ROLES.map(r => <option key={r} value={r} className="bg-[#0d0d14]">{r}</option>)}
                            </select>
                            <button
                              onClick={() => handleBan(m.username, !m.isBanned)}
                              title={m.isBanned ? "Unban" : "Ban"}
                              className={`p-1.5 rounded-lg transition-colors ${m.isBanned ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/[0.04] text-white/40 hover:text-amber-400 hover:bg-amber-500/10"}`}
                            >
                              <IconBan />
                            </button>
                            <button
                              onClick={() => handleRemove(m.username)}
                              title="Remove"
                              className="p-1.5 rounded-lg bg-white/[0.04] text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── INVITES ── */}
            {tab === "invites" && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] overflow-hidden">
                {invites.length === 0 ? (
                  <div className="py-16 text-center text-white/30 text-sm">No pending invites</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {invites.map(inv => (
                      <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/80">
                              {inv.inviteeEmail || (inv.inviteeId ? `User #${inv.inviteeId.slice(-6)}` : "—")}
                            </span>
                            <RoleBadge role={inv.role} />
                          </div>
                          <p className="text-[11px] text-white/30 mt-0.5">
                            Invited by {inv.inviterName} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs transition-colors"
                          >
                            <IconX /> Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── JOIN REQUESTS ── */}
            {tab === "requests" && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] overflow-hidden">
                {requests.length === 0 ? (
                  <div className="py-16 text-center text-white/30 text-sm">No pending join requests</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden">
                          {req.avatar ? <img src={req.avatar} alt={req.username} className="w-full h-full object-cover" /> : avatarFallback(req.username)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-white/85">{req.username}</span>
                          {req.message && (
                            <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">"{req.message}"</p>
                          )}
                          <p className="text-[11px] text-white/25">{timeAgo(req.createdAt)}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleReview(req.id, "approve")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 text-xs transition-colors"
                            >
                              <IconCheck /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(req.id, "reject")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs transition-colors"
                            >
                              <IconX /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
