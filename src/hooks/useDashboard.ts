
"use client";

import { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardUser {
  id: string;
  name: string;
  username: string;
  avatarColor: string;  // tailwind bg-* class
  plan: "free" | "pro" | "team";
  streak: number;
  level: number;
  xp: number;
  xpToNext: number;
  badges: string[];
}

export interface ActivityItem {
  id: string;
  type: "push" | "pr_opened" | "pr_merged" | "issue" | "review" | "badge";
  repo: string;
  message: string;
  time: string;
  meta?: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  delta: string;
  positive: boolean;
  icon: "repo" | "star" | "pr" | "review";
  color: string; // tailwind text-* class
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  time: string;
}

export interface UseDashboardReturn {
  user: DashboardUser;
  stats: StatCard[];
  activity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Static mock data
// ---------------------------------------------------------------------------

const MOCK_USER: DashboardUser = {
  id: "u1",
  name: "Vidip Singh",
  username: "vidipsingh",
  avatarColor: "bg-gradient-to-br from-indigo-500 to-cyan-400",
  plan: "pro",
  streak: 14,
  level: 7,
  xp: 3420,
  xpToNext: 5000,
  badges: ["🔥 Streaker", "⚡ Fast Merger", "🤖 AI Power User"],
};

const MOCK_STATS: StatCard[] = [
  { label: "Repositories",    value: 12,  delta: "+2 this month",  positive: true,  icon: "repo",   color: "text-indigo-400"  },
  { label: "Stars earned",    value: 248, delta: "+34 this week",  positive: true,  icon: "star",   color: "text-amber-400"   },
  { label: "Pull Requests",   value: 7,   delta: "3 awaiting review", positive: false, icon: "pr",  color: "text-violet-400"  },
  { label: "AI Reviews",      value: 56,  delta: "+12 this week",  positive: true,  icon: "review", color: "text-cyan-400"    },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "pr_merged",  repo: "payment-service",   message: "Merged PR #42 — Add Stripe webhook handler",          time: "2m ago",   meta: "+240 −18"   },
  { id: "a2", type: "review",     repo: "devflow-backend",   message: "AI reviewed PR #7 — Found 2 issues, 3 suggestions",   time: "18m ago",  meta: "✨ AI"       },
  { id: "a3", type: "push",       repo: "devflow-frontend",  message: "Pushed 3 commits to feat/dashboard-ui",               time: "1h ago",   meta: "3 commits"  },
  { id: "a4", type: "pr_opened",  repo: "cli-tools",         message: "Opened PR #12 — Refactor config loading",             time: "3h ago",   meta: "needs review"},
  { id: "a5", type: "issue",      repo: "payment-service",   message: "Closed issue #88 — Race condition in checkout",       time: "5h ago",   meta: "#88"        },
  { id: "a6", type: "badge",      repo: "",                  message: "Earned badge: ⚡ Fast Merger",                         time: "1d ago",   meta: "🏆"         },
  { id: "a7", type: "push",       repo: "auth-service",      message: "Pushed 7 commits to main",                           time: "1d ago",   meta: "7 commits"  },
  { id: "a8", type: "pr_merged",  repo: "devflow-backend",   message: "Merged PR #3 — Add MongoDB Atlas integration",        time: "2d ago",   meta: "+580 −42"   },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "PR #42 approved",       body: "alex_dev approved your pull request in payment-service.",    read: false, time: "5m ago"  },
  { id: "n2", title: "AI Review complete",     body: "DevFlow AI reviewed PR #7 in devflow-backend.",             read: false, time: "20m ago" },
  { id: "n3", title: "New issue assigned",     body: 'Issue #91 "Fix token expiry" was assigned to you.',        read: false, time: "1h ago"  },
  { id: "n4", title: "Streak milestone 🔥",   body: "You hit a 14-day contribution streak! Keep it up.",         read: true,  time: "2h ago"  },
  { id: "n5", title: "PR needs your review",  body: "priya_eng requested your review on PR #15 in cli-tools.",   read: true,  time: "3h ago"  },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboard(): UseDashboardReturn {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  return {
    user: MOCK_USER,
    stats: MOCK_STATS,
    activity: MOCK_ACTIVITY,
    notifications,
    unreadCount,
    markAllRead,
    markRead,
  };
}
