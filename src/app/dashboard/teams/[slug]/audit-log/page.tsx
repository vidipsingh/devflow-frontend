
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { listTeamAuditLog, getMyPermissions, TeamAuditLog, TeamPermissions } from "@/hooks/useTeams";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function fullDate(iso: string) {
  return new Date(iso).toLocaleString();
}

const ACTION_COLOUR: Record<string, string> = {
  member_joined:         "emerald",
  member_left:           "white",
  member_removed:        "rose",
  member_banned:         "rose",
  member_unbanned:       "emerald",
  role_changed:          "amber",
  repo_added:            "violet",
  repo_removed:          "rose",
  join_request_approved: "emerald",
  join_request_rejected: "rose",
  invite_sent:           "violet",
  invite_revoked:        "rose",
  ownership_transferred: "amber",
  settings_updated:      "white",
  sub_team_created:      "violet",
};

function badgeColour(action: string) {
  switch (ACTION_COLOUR[action] ?? "white") {
    case "emerald": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "rose":    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "amber":   return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "violet":  return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    default:        return "bg-white/5 text-white/50 border-white/10";
  }
}

function actionLabel(action: string) {
  return action.replace(/_/g, " ");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
      <span className="text-white/30">{label}:</span>
      <span className="text-white/60">{value}</span>
    </span>
  );
}

function AuditRow({ entry }: { entry: TeamAuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasMeta = entry.meta && Object.keys(entry.meta).length > 0;

  return (
    <div className="py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-start gap-3">
        {/* Actor avatar */}
        <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
          {entry.actorUsername.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{entry.actorUsername}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeColour(entry.action)}`}>
              {actionLabel(entry.action)}
            </span>
            {entry.targetUsername && (
              <span className="text-sm text-white/50">→ <span className="text-white/70">{entry.targetUsername}</span></span>
            )}
            {entry.targetRole && (
              <MetaChip label="role" value={entry.targetRole} />
            )}
          </div>

          {/* Meta chips */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-white/25" title={fullDate(entry.createdAt)}>
              {timeAgo(entry.createdAt)}
            </span>
            {hasMeta && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-xs text-violet-400/70 hover:text-violet-400 transition-colors underline underline-offset-2"
              >
                {expanded ? "hide details" : "show details"}
              </button>
            )}
          </div>

          {/* Meta details */}
          {expanded && hasMeta && (
            <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono space-y-1">
              {Object.entries(entry.meta!).map(([key, val]) => (
                <div key={key}>
                  <span className="text-white/40">{key}:</span>{" "}
                  <span className="text-white/60">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────

const ACTION_GROUPS = [
  { label: "All",      value: "" },
  { label: "Members",  value: "member" },
  { label: "Repos",    value: "repo" },
  { label: "Requests", value: "join_request" },
  { label: "Invites",  value: "invite" },
  { label: "Settings", value: "settings" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamAuditLogPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [perms, setPerms]           = useState<TeamPermissions | null>(null);
  const [permsLoading, setPermsLoading] = useState(true);

  const [entries, setEntries]       = useState<TeamAuditLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  const [skip, setSkip]             = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const [filter, setFilter]         = useState("");
  const LIMIT = 40;

  /* ── Check permissions first ── */
  useEffect(() => {
    if (!slug) return;
    getMyPermissions(slug)
      .then((p) => {
        if (!p) { router.replace(`/dashboard/teams/${slug}`); return; }
        setPerms(p);
        const isPrivileged =
          p.role === "owner" ||
          p.role === "admin" ||
          p.permissions.includes("manage_settings") ||
          p.permissions.includes("manage_members");
        if (!isPrivileged) {
          router.replace(`/dashboard/teams/${slug}`);
        }
      })
      .catch(() => router.replace(`/dashboard/teams/${slug}`))
      .finally(() => setPermsLoading(false));
  }, [slug, router]);

  const load = useCallback(async (reset = false) => {
    if (!slug) return;
    const currentSkip = reset ? 0 : skip;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const data = await listTeamAuditLog(slug, LIMIT, currentSkip);
      if (reset) {
        setEntries(data);
        setSkip(LIMIT);
      } else {
        setEntries(prev => [...prev, ...data]);
        setSkip(s => s + LIMIT);
      }
      setHasMore(data.length === LIMIT);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!permsLoading && perms) load(true);
  }, [permsLoading, perms]);

  /* ── Derived: client-side filter ── */
  const filtered = filter
    ? entries.filter(e => e.action.startsWith(filter))
    : entries;

  if (permsLoading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Audit Log</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                Admin
              </span>
            </div>
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

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mb-5">
          {ACTION_GROUPS.map(g => (
            <button
              key={g.value}
              onClick={() => setFilter(g.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${filter === g.value
                  ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"
                }`}
            >
              {g.label}
            </button>
          ))}
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-white/30 text-sm">
            {filter ? "No audit entries match this filter." : "No audit entries recorded yet."}
          </div>
        ) : (
          <div className="bg-[#0d0d14] border border-white/[0.06] rounded-2xl px-4">
            {filtered.map(entry => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {hasMore && !loading && !filter && (
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

        {/* Info note */}
        <p className="mt-6 text-center text-white/20 text-xs">
          Audit logs capture all administrative actions taken by team members. Visible to owners and admins only.
        </p>
      </div>
    </div>
  );
}
