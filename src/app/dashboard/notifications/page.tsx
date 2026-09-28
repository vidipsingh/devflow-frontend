
"use client";

import { useNotifications } from "@/hooks/useNotifications";
import type { MappedNotification } from "@/hooks/useNotifications";

// ─── Icons ────────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.5a6 6 0 0 0-6 6v3L2.5 13h15l-1.5-1.5V8.5a6 6 0 0 0-6-6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 16a1.5 1.5 0 0 0 3 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckAllIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 7l4 4L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M12 2.5A5.5 5.5 0 1 1 7 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 1v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Notification type badge ───────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "repo.forked":   { bg: "bg-cyan-500/15",    text: "text-cyan-300",    label: "Fork"    },
  "pr.created":    { bg: "bg-violet-500/15",  text: "text-violet-300",  label: "PR"      },
  "pr.merged":     { bg: "bg-emerald-500/15", text: "text-emerald-300", label: "Merged"  },
  "issue.created": { bg: "bg-amber-500/15",   text: "text-amber-300",   label: "Issue"   },
  "issue.closed":  { bg: "bg-rose-500/15",    text: "text-rose-300",    label: "Closed"  },
};

function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[type] ?? { bg: "bg-white/10", text: "text-white/50", label: type };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

// ─── Single notification row ───────────────────────────────────────────────────

function NotificationRow({
  n,
  onMarkRead,
}: {
  n: MappedNotification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <li
      className={`flex items-start gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02] ${n.read ? "opacity-60" : ""}`}
    >
      {/* Unread dot */}
      <span
        className={`mt-2 flex-shrink-0 w-2 h-2 rounded-full ${
          n.read ? "bg-transparent" : "bg-indigo-400"
        }`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <TypeBadge type={n.type} />
          <p className="text-sm font-semibold text-white">{n.title}</p>
        </div>
        <p className="text-xs text-[#71717a] leading-relaxed">{n.body}</p>
        <p className="text-[11px] text-[#3f3f46] mt-1.5">{n.timeAgo}</p>
      </div>

      {/* Mark read button */}
      {!n.read && (
        <button
          onClick={() => onMarkRead(n.id)}
          title="Mark as read"
          className="flex-shrink-0 mt-1 p-1.5 rounded-lg text-[#52525b] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
        >
          <CheckAllIcon />
        </button>
      )}
    </li>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#52525b]">
        <BellIcon />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">All caught up</p>
        <p className="text-xs text-[#52525b] mt-1">No notifications yet. Activity on your repos will appear here.</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, error, markAllRead, markOneRead, refresh } =
    useNotifications();

  const unread = notifications.filter((n) => !n.read);
  const read   = notifications.filter((n) =>  n.read);

  return (
    <div className="min-h-full p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <BellIcon />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Notifications</h1>
            <p className="text-xs text-[#52525b]">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] text-xs transition-all disabled:opacity-40 cursor-pointer"
          >
            <RefreshIcon />
            Refresh
          </button>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-300 text-xs font-medium transition-all"
            >
              <CheckAllIcon />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 animate-pulse"
            >
              <div className="mt-2 w-2 h-2 rounded-full bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-white/[0.06]" />
                <div className="h-3 w-64 rounded bg-white/[0.04]" />
                <div className="h-2.5 w-16 rounded bg-white/[0.03]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && notifications.length === 0 && <EmptyState />}

      {!loading && notifications.length > 0 && (
        <div className="space-y-4">
          {/* Unread section */}
          {unread.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#3f3f46] mb-2 px-1">
                Unread · {unread.length}
              </p>
              <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
                <ul>
                  {unread.map((n) => (
                    <NotificationRow key={n.id} n={n} onMarkRead={markOneRead} />
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Read section */}
          {read.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#3f3f46] mb-2 px-1">
                Earlier
              </p>
              <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
                <ul>
                  {read.map((n) => (
                    <NotificationRow key={n.id} n={n} onMarkRead={markOneRead} />
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
