
"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyInvites, acceptInvite, declineInvite, TeamInvite } from "@/hooks/useTeams";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86_400_000);
  const hrs  = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hrs}h left`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

function avatarFallback(name: string) {
  return name?.slice(0, 2).toUpperCase() || "TM";
}

// ─── Invite Card ──────────────────────────────────────────────────────────────

interface InviteCardProps {
  invite: TeamInvite;
  acting: string | null;
  onAccept: (token: string, inviteId: string) => void;
  onDecline: (token: string, inviteId: string) => void;
}

function InviteCard({ invite, acting, onAccept, onDecline }: InviteCardProps) {
  const expired = new Date(invite.expiresAt).getTime() < Date.now();
  const isActing = acting === invite.id;
  const hasToken = !!invite.token;

  return (
    <div className={`rounded-2xl border bg-[#0d0d14] p-5 transition-all ${expired ? "border-white/[0.04] opacity-50" : "border-white/[0.08] hover:border-violet-500/20"}`}>
      <div className="flex items-start gap-4">
        {/* Team avatar */}
        <div className="w-12 h-12 rounded-xl bg-violet-600/25 flex items-center justify-center text-sm font-bold text-violet-300 flex-shrink-0 select-none">
          {avatarFallback(invite.teamName)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Team info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/dashboard/teams/${invite.teamSlug}`}
              className="font-semibold text-white hover:text-violet-300 transition-colors"
            >
              {invite.teamName}
            </Link>
            <RoleBadge role={invite.role} />
          </div>
          <p className="text-[11px] text-white/35 mt-0.5">/{invite.teamSlug}</p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-white/40">
              Invited by <span className="text-white/60">{invite.inviterName}</span>
            </span>
            <span className="text-white/15">·</span>
            <span className={`text-xs font-medium ${expired ? "text-rose-400" : "text-amber-400"}`}>
              {timeLeft(invite.expiresAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Action row */}
      {!expired && hasToken && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAccept(invite.token!, invite.id)}
            disabled={isActing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-sm font-medium transition-colors disabled:opacity-50 flex-1 justify-center"
          >
            <IconCheck />
            {isActing ? "Accepting…" : "Accept & Join"}
          </button>
          <button
            onClick={() => onDecline(invite.token!, invite.id)}
            disabled={isActing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 text-white/50 hover:text-rose-400 text-sm font-medium transition-colors disabled:opacity-50 flex-1 justify-center"
          >
            <IconX />
            Decline
          </button>
        </div>
      )}

      {!expired && !hasToken && (
        <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 text-xs text-center">
          Token unavailable — use the link from your email to accept this invite.
        </div>
      )}

      {expired && (
        <div className="mt-3 text-xs text-rose-400/70 text-center">This invite has expired</div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyInvitesPage() {
  const { invites, loading, error, reload } = useMyInvites();
  const [acting, setActing]   = useState<string | null>(null);
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);

  async function handleAccept(token: string, inviteId: string) {
    setActing(inviteId);
    setMsg(null);
    try {
      await acceptInvite(token);
      setMsg({ text: "✓ Invite accepted — you've joined the team!", ok: true });
      reload();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Failed to accept", ok: false });
    } finally {
      setActing(null);
    }
  }

  async function handleDecline(token: string, inviteId: string) {
    setActing(inviteId);
    setMsg(null);
    try {
      await declineInvite(token);
      setMsg({ text: "Invite declined.", ok: true });
      reload();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Failed to decline", ok: false });
    } finally {
      setActing(null);
    }
  }

  const pending = invites.filter(
    i => i.status === "pending" && new Date(i.expiresAt).getTime() > Date.now()
  );
  const history = invites.filter(
    i => i.status !== "pending" || new Date(i.expiresAt).getTime() <= Date.now()
  );

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <Link href="/dashboard/teams" className="inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white/60 transition-colors mb-6">
          <IconArrowLeft /> Back to Teams
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
            <IconMail />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">My Team Invites</h1>
            <p className="text-white/40 text-sm">
              {pending.length > 0
                ? `${pending.length} pending invitation${pending.length > 1 ? "s" : ""}`
                : "No pending invitations"}
            </p>
          </div>
        </div>

        {/* Feedback message */}
        {msg && (
          <div className={`mb-5 px-4 py-3 rounded-xl border text-sm flex items-center justify-between ${msg.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-rose-500/10 border-rose-500/20 text-rose-300"}`}>
            {msg.text}
            <button onClick={() => setMsg(null)} className="opacity-60 hover:opacity-100 text-lg leading-none ml-3">×</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-rose-400 text-sm text-center py-8">{error}</div>
        ) : (
          <>
            {/* Pending invites */}
            {pending.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                  Pending ({pending.length})
                </h2>
                {pending.map(inv => (
                  <InviteCard
                    key={inv.id}
                    invite={inv}
                    acting={acting}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {pending.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                  <IconMail />
                </div>
                <h3 className="text-white/60 font-semibold mb-1">No pending invites</h3>
                <p className="text-white/30 text-sm mb-5">
                  You don&apos;t have any team invitations waiting. Discover public teams to join.
                </p>
                <Link
                  href="/dashboard/teams"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:text-white/70 hover:border-white/[0.15] transition-colors"
                >
                  <IconUsers /> Discover Teams
                </Link>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="space-y-3 mt-4">
                <h2 className="text-sm font-semibold text-white/30 uppercase tracking-wide">
                  History ({history.length})
                </h2>
                <div className="rounded-2xl border border-white/[0.05] bg-[#0a0a12] divide-y divide-white/[0.04] overflow-hidden">
                  {history.map(inv => (
                    <div key={inv.id} className="flex items-center gap-4 px-4 py-3 opacity-40">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-xs font-bold text-white/40 flex-shrink-0 select-none">
                        {avatarFallback(inv.teamName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white/60">{inv.teamName}</span>
                        <span className="ml-2 text-[10px] text-white/25 capitalize">{inv.status}</span>
                      </div>
                      <span className="text-[11px] text-white/25 flex-shrink-0">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
