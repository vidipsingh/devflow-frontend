
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  useTeam,
  getMyMembership,
  getMyJoinRequest,
  listTeamMembers,
  listSubTeams,
  requestToJoin,
  leaveTeam,
  TeamMember,
  Team,
} from "@/hooks/useTeams";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSettings() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
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

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconGitBranch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
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
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${cls}`}>
      {role}
    </span>
  );
}

function avatarFallback(name: string) {
  return name?.slice(0, 2).toUpperCase() || "?";
}

// ─── Member avatar strip ──────────────────────────────────────────────────────

function MemberStrip({ members, total, slug }: { members: TeamMember[]; total: number; slug: string }) {
  const shown = members.slice(0, 8);
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {shown.map(m => (
          <div
            key={m.id}
            title={m.username}
            className="w-8 h-8 rounded-full border-2 border-[#0d0d14] bg-violet-600/30 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden flex-shrink-0"
          >
            {m.avatar
              ? <img src={m.avatar} alt={m.username} className="w-full h-full object-cover" />
              : avatarFallback(m.username)
            }
          </div>
        ))}
        {total > shown.length && (
          <div className="w-8 h-8 rounded-full border-2 border-[#0d0d14] bg-white/[0.08] flex items-center justify-center text-[10px] text-white/50 flex-shrink-0">
            +{total - shown.length}
          </div>
        )}
      </div>
      <Link
        href={`/dashboard/teams/${slug}/members`}
        className="text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        View all {total} members →
      </Link>
    </div>
  );
}

// ─── Sub-team card ─────────────────────────────────────────────────────────────

function SubTeamCard({ team }: { team: Team }) {
  return (
    <Link
      href={`/dashboard/teams/${team.slug}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-violet-500/25 hover:bg-white/[0.04] transition-all group"
    >
      <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
        {team.avatar
          ? <img src={team.avatar} alt={team.name} className="w-full h-full rounded-lg object-cover" />
          : avatarFallback(team.name)
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 truncate">{team.name}</p>
        <p className="text-[11px] text-white/35">{team.memberCount} members</p>
      </div>
      <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TeamOverviewPage({ params }: PageProps) {
  const { slug } = use(params);
  const { team, loading, error } = useTeam(slug);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [subTeams, setSubTeams] = useState<Team[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [membersLoaded, setMembersLoaded] = useState(false);
  // "requested" = user clicked Request-to-Join in this session
  const [hasRequested, setHasRequested] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  // ── Load membership & members from server (no localStorage matching) ─────
  useEffect(() => {
    if (!slug) return;
    setMembersLoaded(false);
    setHasRequested(false);
    // Run all checks in parallel
    Promise.all([
      getMyMembership(slug),
      getMyJoinRequest(slug),
      listTeamMembers(slug, "", 100, 0).catch(() => [] as TeamMember[]),
      listSubTeams(slug).catch(() => [] as Team[]),
    ]).then(([me, myReq, ms, subs]) => {
      setMyRole(me?.role ?? null);          // null = not a member (server confirmed)
      // If there's already a pending request, show the "pending" badge on load
      if (myReq && myReq.status === "pending") {
        setHasRequested(true);
      }
      setMembers(ms);
      setSubTeams(subs);
    }).catch(() => {
      setMyRole(null);
    }).finally(() => {
      setMembersLoaded(true);
    });
  }, [slug]);

  async function handleJoin() {
    setActing(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const r = await requestToJoin(slug) as { joined?: boolean };
      if (r?.joined) {
        // Open team: joined instantly — re-fetch membership from server
        const me = await getMyMembership(slug);
        setMyRole(me?.role ?? "developer");
        const ms = await listTeamMembers(slug, "", 100, 0).catch(() => [] as TeamMember[]);
        setMembers(ms);
        setActionMsg("✓ You have joined the team!");
      } else {
        setHasRequested(true);
        setActionMsg("✓ Join request submitted! An admin will review it.");
      }
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to send request");
    } finally {
      setActing(false);
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this team?")) return;
    setActing(true);
    setActionMsg(null);
    setActionError(null);
    try {
      await leaveTeam(slug);
      setActionMsg("You have left the team.");
      setMyRole(null);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to leave team");
    } finally {
      setActing(false);
    }
  }

  // ── Derived booleans (only after members are loaded) ─────────────────────
  // isMember: caller appears in the member list
  const isMember = membersLoaded && myRole !== null;
  const isAdmin  = isMember && (myRole === "owner" || myRole === "admin");
  const isOwner  = isMember && myRole === "owner";

  // Non-member join area: shown whenever members are loaded and caller is not a member
  const showJoinArea = membersLoaded && !isMember;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center gap-4">
        <p className="text-rose-400">{error ?? "Team not found"}</p>
        <Link href="/dashboard/teams" className="text-sm text-white/40 hover:text-white/70">← Back to Teams</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">

      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-br from-violet-600/25 via-indigo-600/15 to-transparent overflow-hidden">
        {team.banner && (
          <img src={team.banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080810] to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Back */}
        <div className="pt-4 mb-6">
          <Link
            href="/dashboard/teams"
            className="inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white/60 transition-colors"
          >
            <IconArrowLeft /> All Teams
          </Link>
        </div>

        {/* Header row */}
        <div className="flex items-end gap-5 -mt-6 mb-6 flex-wrap">
          <div className="w-20 h-20 rounded-2xl border-4 border-[#080810] bg-violet-600/30 flex items-center justify-center text-xl font-bold text-white flex-shrink-0 overflow-hidden">
            {team.avatar
              ? <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
              : avatarFallback(team.name)
            }
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{team.name}</h1>
              {myRole && <RoleBadge role={myRole} />}
              <span className="text-[11px] text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full capitalize">{team.type}</span>
            </div>
            <p className="text-white/40 text-sm mt-0.5">/{team.slug}</p>
          </div>
          <div className="flex gap-2 flex-wrap pb-1">
            {/* Admin controls — only shown once membership is confirmed */}
            {isAdmin && (
              <>
                <Link
                  href={`/dashboard/teams/${slug}/members`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/60 text-xs font-medium transition-colors"
                >
                  <IconUsers /> Members
                </Link>
                <Link
                  href={`/dashboard/teams/${slug}/settings`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15 text-violet-300 text-xs font-medium transition-colors"
                >
                  <IconSettings /> Settings
                </Link>
                <Link
                  href={`/dashboard/teams/${slug}/members`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 text-xs font-medium transition-colors"
                >
                  + Invite
                </Link>
              </>
            )}

            {/* Leave button — visible to any non-owner member */}
            {isMember && !isOwner && (
              <button
                onClick={handleLeave}
                disabled={acting}
                className="px-3.5 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Leave Team
              </button>
            )}

            {/* Join / Request — only for confirmed non-members */}
            {showJoinArea && team.joinPolicy === "invite_only" && (
              <span className="px-4 py-2 rounded-xl border border-white/[0.06] text-white/25 text-xs">
                Invite only
              </span>
            )}
            {showJoinArea && team.joinPolicy === "request" && (
              <button
                onClick={handleJoin}
                disabled={acting || hasRequested}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                  hasRequested
                    ? "border border-amber-500/20 bg-amber-500/10 text-amber-300 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                }`}
              >
                {acting ? "…" : hasRequested ? "✓ Request Sent" : "Request to Join"}
              </button>
            )}
            {showJoinArea && team.joinPolicy === "open" && (
              <button
                onClick={handleJoin}
                disabled={acting}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {acting ? "…" : "Join Team"}
              </button>
            )}
          </div>
        </div>

        {/* Action messages */}
        {actionMsg && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            {actionMsg}
          </div>
        )}
        {actionError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">

          {/* Left — bio & main info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Description */}
            {team.description && (
              <p className="text-white/60 text-sm leading-relaxed">{team.description}</p>
            )}

            {/* Bio / README */}
            {team.bio ? (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-5">
                <h2 className="text-sm font-semibold text-white/70 mb-3">README</h2>
                <div className="text-sm text-white/55 leading-relaxed whitespace-pre-wrap">{team.bio}</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/[0.07] bg-[#0d0d14] p-6 text-center">
                <p className="text-white/25 text-sm">No bio yet.</p>
                {isAdmin && (
                  <Link href={`/dashboard/teams/${slug}/settings`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors mt-1 inline-block">
                    Add a bio in Settings →
                  </Link>
                )}
              </div>
            )}

            {/* Members strip */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <IconUsers /> Members ({team.memberCount})
                </h2>
                {isAdmin && (
                  <Link
                    href={`/dashboard/teams/${slug}/members`}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Manage →
                  </Link>
                )}
              </div>
              <MemberStrip members={members} total={team.memberCount} slug={slug} />
            </div>

            {/* Sub-teams */}
            {subTeams.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-5">
                <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-4">
                  <IconGitBranch /> Sub-teams ({subTeams.length})
                </h2>
                <div className="space-y-2">
                  {subTeams.map(st => <SubTeamCard key={st.id} team={st} />)}
                </div>
              </div>
            )}
          </div>

          {/* Right — sidebar */}
          <div className="space-y-4">

            {/* About card */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white/70 mb-1">About</h2>

              <div className="space-y-2.5 text-[12px] text-white/45">
                <div className="flex justify-between">
                  <span>Visibility</span>
                  <span className="capitalize text-white/70">{team.visibility}</span>
                </div>
                <div className="flex justify-between">
                  <span>Join policy</span>
                  <span className="capitalize text-white/70">
                    {team.joinPolicy === "invite_only" ? "Invite only" : team.joinPolicy === "open" ? "Open" : "By request"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="capitalize text-white/70">{team.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Members</span>
                  <span className="text-white/70">{team.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Repositories</span>
                  <span className="text-white/70">{team.repoCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="text-white/70">{new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {team.tags && team.tags.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-4">
                <h2 className="text-xs font-semibold text-white/50 flex items-center gap-1.5 mb-3">
                  <IconTag /> Tags
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {team.tags.map(tag => (
                    <span key={tag} className="text-[11px] text-violet-300 bg-violet-500/10 border border-violet-500/15 px-2.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick nav for admins */}
            {isAdmin && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-4 space-y-1.5">
                <h2 className="text-xs font-semibold text-white/50 mb-2">Admin</h2>
                <Link href={`/dashboard/teams/${slug}/members`} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.04] text-white/50 hover:text-white/70 text-xs transition-colors">
                  <IconUsers /> Manage Members
                </Link>
                <Link href={`/dashboard/teams/${slug}/settings`} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.04] text-white/50 hover:text-white/70 text-xs transition-colors">
                  <IconSettings /> Team Settings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
