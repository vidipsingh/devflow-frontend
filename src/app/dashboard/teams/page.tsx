
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useMyTeams, useDiscoverTeams, requestToJoin, getMyJoinRequest, Team } from "@/hooks/useTeams";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function visibilityBadge(v: string) {
  if (v === "public")  return <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"><IconGlobe />Public</span>;
  if (v === "private") return <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full"><IconLock />Private</span>;
  return <span className="text-[10px] text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">Secret</span>;
}

function joinPolicyLabel(p: string) {
  if (p === "open")        return "Open";
  if (p === "invite_only") return "Invite only";
  return "By request";
}

function avatarFallback(name: string) {
  return name?.slice(0, 2).toUpperCase() || "TM";
}

// ─── Team Card ────────────────────────────────────────────────────────────────

interface TeamCardProps {
  team: Team;
  isMember?: boolean;
  hasRequested?: boolean;
  onJoin?: (slug: string) => void;
  joining?: string | null;
}

function TeamCard({ team, isMember, hasRequested, onJoin, joining }: TeamCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d14] hover:border-violet-500/30 hover:bg-[#10101a] transition-all duration-200 flex flex-col">
      {/* Banner / gradient header */}
      <div className="h-16 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent relative overflow-hidden">
        {team.banner && (
          <img src={team.banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Avatar + title */}
        <div className="flex items-start gap-3 -mt-8">
          <div className="w-12 h-12 rounded-xl border-2 border-[#0d0d14] bg-violet-600/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            {team.avatar
              ? <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
              : avatarFallback(team.name)
            }
          </div>
          <div className="mt-5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-sm truncate">{team.name}</h3>
              {visibilityBadge(team.visibility)}
            </div>
            <p className="text-[11px] text-white/40">/{team.slug}</p>
          </div>
        </div>

        {/* Description */}
        {team.description && (
          <p className="text-[12px] text-white/50 line-clamp-2 leading-relaxed">{team.description}</p>
        )}

        {/* Tags */}
        {team.tags && team.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {team.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] text-white/35 mt-auto pt-2 border-t border-white/[0.04]">
          <span className="flex items-center gap-1"><IconUsers />{team.memberCount} members</span>
          <span className="text-white/15">·</span>
          <span>{joinPolicyLabel(team.joinPolicy)}</span>
          <span className="text-white/15">·</span>
          <span className="capitalize">{team.type}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          {isMember ? (
            <Link
              href={`/dashboard/teams/${team.slug}`}
              className="flex-1 text-center py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium transition-colors"
            >
              View Team
            </Link>
          ) : (
            <>
              {team.joinPolicy === "open" && onJoin && (
                <button
                  onClick={() => onJoin(team.slug)}
                  disabled={joining === team.slug}
                  className="flex-1 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {joining === team.slug ? "Joining…" : "Join"}
                </button>
              )}
              {team.joinPolicy === "request" && onJoin && (
                <button
                  onClick={() => !hasRequested && onJoin(team.slug)}
                  disabled={joining === team.slug || hasRequested}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    hasRequested
                      ? "border border-amber-500/20 bg-amber-500/10 text-amber-300 cursor-not-allowed"
                      : "bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 disabled:opacity-50"
                  }`}
                >
                  {joining === team.slug ? "Requesting…" : hasRequested ? "✓ Request Sent" : "Request to Join"}
                </button>
              )}
              {team.joinPolicy === "invite_only" && (
                <span className="flex-1 text-center py-2 text-white/25 text-xs">Invite only</span>
              )}
              <Link
                href={`/dashboard/teams/${team.slug}`}
                className="px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-xs font-medium transition-colors"
              >
                View
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyMyTeams() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
        <IconUsers />
      </div>
      <h3 className="text-white/70 font-semibold mb-1">No teams yet</h3>
      <p className="text-white/35 text-sm mb-6">Create your first team or discover public ones.</p>
      <Link
        href="/dashboard/teams/new"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
      >
        <IconPlus /> New Team
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const [tab, setTab] = useState<"mine" | "discover">("mine");
  const { teams: myTeams, loading: loadingMine, error: errorMine, reload: reloadMine } = useMyTeams();
  const { teams: publicTeams, search, setSearch, loading: loadingDiscover } = useDiscoverTeams();
  const [joining, setJoining] = useState<string | null>(null);
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  // Track slugs where the caller has a pending join request
  const [requestedSlugs, setRequestedSlugs] = useState<Set<string>>(new Set());

  const myTeamSlugs = new Set(myTeams.map(t => t.slug));

  // When discover teams load, check which ones already have a pending request
  useEffect(() => {
    if (!publicTeams.length) return;
    const nonMember = publicTeams.filter(t => t.joinPolicy === "request" && !myTeamSlugs.has(t.slug));
    if (!nonMember.length) return;

    Promise.all(
      nonMember.map(async (t) => {
        const req = await getMyJoinRequest(t.slug);
        return req?.status === "pending" ? t.slug : null;
      })
    ).then(results => {
      const pending = results.filter((s): s is string => s !== null);
      if (pending.length) {
        setRequestedSlugs(prev => {
          const next = new Set(prev);
          pending.forEach(s => next.add(s));
          return next;
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicTeams]);

  async function handleJoin(slug: string) {
    setJoining(slug);
    setJoinMsg(null);
    try {
      const result = await requestToJoin(slug) as { joined?: boolean; status?: string };
      if (result?.joined) {
        setJoinMsg("✓ Joined successfully!");
        reloadMine();
      } else {
        // Mark as requested immediately so button changes without needing reload
        setRequestedSlugs(prev => new Set(prev).add(slug));
        setJoinMsg("✓ Join request submitted!");
      }
    } catch (e: unknown) {
      setJoinMsg(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Teams</h1>
            <p className="text-white/40 text-sm mt-0.5">Collaborate with your organisation and community</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/teams/invites"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/70 text-sm transition-colors"
            >
              <IconMail /> Invites
            </Link>
            <Link
              href="/dashboard/teams/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              <IconPlus /> New Team
            </Link>
          </div>
        </div>

        {/* Join message */}
        {joinMsg && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            {joinMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
          {(["mine", "discover"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "mine" ? `My Teams${myTeams.length ? ` (${myTeams.length})` : ""}` : "Discover"}
            </button>
          ))}
        </div>

        {/* MY TEAMS */}
        {tab === "mine" && (
          <>
            {loadingMine ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : errorMine ? (
              <div className="text-rose-400 text-sm py-8 text-center">{errorMine}</div>
            ) : myTeams.length === 0 ? (
              <div className="grid grid-cols-1">
                <EmptyMyTeams />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTeams.map(team => (
                  <TeamCard key={team.id} team={team} isMember />
                ))}
              </div>
            )}
          </>
        )}

        {/* DISCOVER */}
        {tab === "discover" && (
          <>
            {/* Search */}
            <div className="relative mb-6 max-w-md">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                <IconSearch />
              </div>
              <input
                type="text"
                placeholder="Search teams by name, slug or tag…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>

            {loadingDiscover || loadingMine ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : publicTeams.length === 0 ? (
              <div className="text-center py-20 text-white/30 text-sm">No public teams found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicTeams.map(team => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isMember={myTeamSlugs.has(team.slug)}
                    hasRequested={requestedSlugs.has(team.slug)}
                    onJoin={myTeamSlugs.has(team.slug) ? undefined : handleJoin}
                    joining={joining}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
