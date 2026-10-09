
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { listTeamActivity, TeamActivity } from "@/hooks/useTeams";

// ─── Action label + colour map ────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; colour: string; icon: string }> = {
  member_joined:          { label: "joined the team",            colour: "emerald", icon: "👤" },
  member_left:            { label: "left the team",              colour: "white",   icon: "🚪" },
  member_removed:         { label: "was removed from the team",  colour: "rose",    icon: "✂️" },
  member_banned:          { label: "was banned",                 colour: "rose",    icon: "🚫" },
  member_unbanned:        { label: "was unbanned",               colour: "emerald", icon: "✅" },
  role_changed:           { label: "had their role updated",     colour: "amber",   icon: "🔄" },
  repo_added:             { label: "added repository",           colour: "violet",  icon: "📦" },
  repo_removed:           { label: "removed repository",         colour: "rose",    icon: "🗑️" },
  join_request_approved:  { label: "approved join request from", colour: "emerald", icon: "✓" },
  join_request_rejected:  { label: "rejected join request from", colour: "rose",    icon: "✗" },
  invite_sent:            { label: "invited",                    colour: "violet",  icon: "✉️" },
  invite_revoked:         { label: "revoked invite for",         colour: "rose",    icon: "✉️" },
  ownership_transferred:  { label: "transferred ownership to",   colour: "amber",   icon: "👑" },
  settings_updated:       { label: "updated team settings",      colour: "white",   icon: "⚙️" },
  sub_team_created:       { label: "created sub-team",           colour: "violet",  icon: "🌿" },
};

function colourClass(colour: string) {
  switch (colour) {
    case "emerald": return "text-emerald-400";
    case "rose":    return "text-rose-400";
    case "amber":   return "text-amber-400";
    case "violet":  return "text-violet-400";
    default:        return "text-white/60";
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ActivityItem({ event }: { event: TeamActivity }) {
  const meta = ACTION_META[event.action] ?? { label: event.action, colour: "white", icon: "•" };

  return (
    <div className="flex gap-3 py-3 border-b border-white/[0.04] last:border-0">
      {/* Avatar / icon */}
      <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-sm flex-shrink-0">
        {event.actorAvatar
          ? <img src={event.actorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
          : event.actorName.slice(0, 2).toUpperCase()
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="text-white font-medium">{event.actorName}</span>
          {" "}
          <span className={colourClass(meta.colour)}>{meta.label}</span>
          {event.targetName && (
            <> <span className="text-white/70 font-medium">{event.targetName}</span></>
          )}
        </p>
        <p className="text-white/25 text-xs mt-0.5">{timeAgo(event.createdAt)}</p>
      </div>
      <span className="text-base flex-shrink-0 mt-0.5">{meta.icon}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamActivityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [events, setEvents] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  const load = useCallback(async (reset = false) => {
    if (!slug) return;
    const currentSkip = reset ? 0 : skip;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const data = await listTeamActivity(slug, LIMIT, currentSkip);
      if (reset) {
        setEvents(data);
        setSkip(LIMIT);
      } else {
        setEvents(prev => [...prev, ...data]);
        setSkip(s => s + LIMIT);
      }
      setHasMore(data.length === LIMIT);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load activity");
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => { load(true); }, [slug]);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/dashboard/teams/${slug}`}
            className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Activity Feed</h1>
            <p className="text-white/40 text-sm">/{slug}</p>
          </div>
          <button
            onClick={() => load(true)}
            className="ml-auto p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.52 9.1" />
            </svg>
          </button>
        </div>

        {err && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            {err}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 text-white/30 text-sm">
            No activity recorded yet. Events will appear here as team members take actions.
          </div>
        ) : (
          <div className="bg-[#0d0d14] border border-white/[0.06] rounded-2xl px-4 divide-y divide-white/[0.04]">
            {events.map(ev => (
              <ActivityItem key={ev.id} event={ev} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-4 text-center">
            <button
              onClick={() => load(false)}
              disabled={loadingMore}
              className="px-5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white/50 hover:text-white/80 text-sm transition-colors disabled:opacity-40"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
