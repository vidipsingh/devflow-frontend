
"use client";

import type { ActivityItem } from "@/hooks/useDashboard";


// Activity type metadata


type ActivityMeta = {
  label: string;
  dotColor: string;
  iconBg: string;
  icon: React.ReactNode;
};

const ACTIVITY_META: Record<ActivityItem["type"], ActivityMeta> = {
  push: {
    label: "pushed to",
    dotColor: "bg-indigo-400",
    iconBg: "bg-indigo-500/15 text-indigo-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 10V3M3.5 6L6.5 3l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  pr_opened: {
    label: "opened PR in",
    dotColor: "bg-violet-400",
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
    label: "merged PR in",
    dotColor: "bg-emerald-400",
    iconBg: "bg-emerald-500/15 text-emerald-400",
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
    label: "closed issue in",
    dotColor: "bg-rose-400",
    iconBg: "bg-rose-500/15 text-rose-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6.5 4v3M6.5 9h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  review: {
    label: "AI reviewed",
    dotColor: "bg-cyan-400",
    iconBg: "bg-cyan-500/15 text-cyan-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1.5l.9 1.8L10 3.8l-1.88 1.83.44 2.57L6.5 7.2 4.44 8.2l.44-2.57L3 3.8l2.6-.5L6.5 1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    ),
  },
  badge: {
    label: "earned badge",
    dotColor: "bg-amber-400",
    iconBg: "bg-amber-500/15 text-amber-400",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 2l1 2 2.2.32-1.6 1.56.38 2.2-1.98-1.04-1.98 1.04.38-2.2L3.3 4.32 5.5 4l1-2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M4.5 9l-1.5 2M8.5 9l1.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
};


// Single activity row


function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = ACTIVITY_META[item.type];

  return (
    <div className="flex items-start gap-3 py-3 group">
      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.iconBg}`}>
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          <span className="text-white font-medium">{meta.label}</span>
          {item.repo && (
            <>
              {" "}
              <span className="text-indigo-400 font-medium hover:underline cursor-pointer">
                {item.repo}
              </span>
            </>
          )}
        </p>
        <p className="text-xs text-[#71717a] mt-0.5 leading-relaxed line-clamp-1">
          {item.message}
        </p>
      </div>

      {/* Right meta */}
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


// ActivityFeed


export default function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        <span className="text-[11px] text-[#52525b]">{activity.length} events</span>
      </div>

      {/* Feed */}
      <div className="px-4 divide-y divide-white/[0.04]">
        {activity.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          View full activity log →
        </button>
      </div>
    </div>
  );
}
