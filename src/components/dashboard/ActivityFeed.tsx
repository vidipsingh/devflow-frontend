
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type ActivityType = "push" | "pr_opened" | "pr_merged" | "issue" | "review" | "badge";

interface ActivityItem {
  id: string;
  type: ActivityType;
  repo: string;
  message: string;
  time: string;       // relative e.g. "2m ago"
  timestamp: number;  // unix ms for sorting
  meta?: string;
  additions?: number;
  deletions?: number;
  hash?: string;
}

// ─── Relative time helper ─────────────────────────────────────────────────────
function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Activity icon & colour map ───────────────────────────────────────────────
const META: Record<ActivityType, { iconBg: string; icon: React.ReactNode }> = {
  push: {
    iconBg: "bg-indigo-500/15 text-indigo-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 10V3M3.5 6L6.5 3l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  pr_opened: {
    iconBg: "bg-violet-500/15 text-violet-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="3.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="3.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="9.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3.5 5v3M9.5 5v1a2.5 2.5 0 0 1-2.5 2.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  pr_merged: {
    iconBg: "bg-teal-500/15 text-teal-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M3.5 5v3M3.5 9.5v.5M3.5 3v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="3.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="3.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M9.5 3.5L6.5 6.5l-1.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  issue: {
    iconBg: "bg-rose-500/15 text-rose-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6.5 4v3M6.5 9h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  review: {
    iconBg: "bg-cyan-500/15 text-cyan-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1.5l.9 1.8L10 3.8l-1.88 1.83.44 2.57L6.5 7.2 4.44 8.2l.44-2.57L3 3.8l2.6-.5L6.5 1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    ),
  },
  badge: {
    iconBg: "bg-amber-500/15 text-amber-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 2l1 2 2.2.32-1.6 1.56.38 2.2-1.98-1.04-1.98 1.04.38-2.2L3.3 4.32 5.5 4l1-2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M4.5 9l-1.5 2M8.5 9l1.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
};

const TYPE_LABELS: Record<ActivityType, string> = {
  push: "pushed to",
  pr_opened: "opened PR in",
  pr_merged: "merged PR in",
  issue: "closed issue in",
  review: "AI reviewed",
  badge: "earned badge",
};

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function getToken(): string | null {
  try { return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null; }
  catch { return null; }
}

// ─── Single row ───────────────────────────────────────────────────────────────
function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = META[item.type];
  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.iconBg}`}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          <span className="text-white font-medium">{TYPE_LABELS[item.type]}</span>
          {item.repo && (
            <>
              {" "}
              <Link
                href={`/dashboard/repositories/${item.repo}`}
                className="text-indigo-400 font-medium hover:text-indigo-300 hover:underline transition-colors"
              >
                {item.repo}
              </Link>
            </>
          )}
        </p>
        <p className="text-xs text-[#71717a] mt-0.5 leading-relaxed line-clamp-1">
          {item.message}
        </p>
        {/* Additions/deletions for push events */}
        {item.type === "push" && (item.additions != null || item.deletions != null) && (
          <div className="flex items-center gap-2 mt-1">
            {(item.additions ?? 0) > 0 && (
              <span className="text-[10px] text-teal-400 font-mono">+{item.additions}</span>
            )}
            {(item.deletions ?? 0) > 0 && (
              <span className="text-[10px] text-rose-400 font-mono">-{item.deletions}</span>
            )}
            {item.hash && (
              <code className="text-[10px] text-white/20 font-mono bg-white/[0.04] px-1.5 py-px rounded">
                {item.hash}
              </code>
            )}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className="text-[10px] text-[#52525b]">{item.time}</span>
        {item.meta && (
          <span className="text-[10px] text-[#3f3f46] bg-white/[0.04] px-1.5 py-0.5 rounded-md">
            {item.meta}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-7 h-7 rounded-lg bg-white/[0.04] animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-2/3 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-2.5 w-1/2 rounded bg-white/[0.03] animate-pulse" />
      </div>
      <div className="h-2.5 w-8 rounded bg-white/[0.03] animate-pulse" />
    </div>
  );
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────
export default function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetch_ = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    try {
      // 1. Get repos
      const reposRes = await fetch(`${API_BASE}/api/v1/repositories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reposRes.ok) { setLoading(false); return; }
      const reposJson = await reposRes.json();
      const repos: { name: string }[] = reposJson?.data?.repositories ?? [];

      // 2. Fetch commits for up to 8 repos in parallel
      const allItems: ActivityItem[] = [];

      await Promise.allSettled(
        repos.slice(0, 8).map(async (repo) => {
          try {
            const res = await fetch(
              `${API_BASE}/api/v1/repositories/${repo.name}/commits?ref=main&limit=20`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return;
            const j = await res.json();
            const commits: {
              id: string;
              message: string;
              createdAt: string;
              shortHash: string;
              additions: number;
              deletions: number;
              filePaths: string[];
            }[] = j?.data?.commits ?? [];

            commits.forEach((c) => {
              allItems.push({
                id: c.id,
                type: "push",
                repo: repo.name,
                message: c.message,
                time: relativeTime(c.createdAt),
                timestamp: new Date(c.createdAt).getTime(),
                additions: c.additions,
                deletions: c.deletions,
                hash: c.shortHash,
                meta: c.filePaths.length > 0
                  ? `${c.filePaths.length} file${c.filePaths.length > 1 ? "s" : ""}`
                  : undefined,
              });
            });
          } catch { /* skip */ }
        })
      );

      // 3. Sort by newest first
      allItems.sort((a, b) => b.timestamp - a.timestamp);
      setItems(allItems);
    } catch { /* silently degrade */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const displayed = showAll ? items : items.slice(0, 8);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        {!loading && (
          <span className="text-[11px] text-[#52525b]">
            {items.length} event{items.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="px-4 divide-y divide-white/[0.04]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-[#52525b] text-xs">
            No activity yet — upload a file to create your first commit.
          </div>
        ) : (
          displayed.map((item) => <ActivityRow key={item.id} item={item} />)
        )}
      </div>

      {/* Footer */}
      {!loading && items.length > 8 && (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {showAll ? "Show less ↑" : `View all ${items.length} events →`}
          </button>
        </div>
      )}
    </div>
  );
}
