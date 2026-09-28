
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch, getToken } from "@/lib/apiFetch";


// Types
export interface DashboardUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  avatarColor: string;
  plan: "free" | "pro" | "team";
  streak: number;
  level: number;
  xp: number;
  xpToNext: number;
  badges: string[];
  aiReviewsUsed: number;
  aiReviewsLimit: number;
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
  // raw backend fields (kept for the notifications page)
  type?: string;
  actorName?: string;
  repoName?: string;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

export interface UseDashboardReturn {
  user: DashboardUser;
  stats: StatCard[];
  activity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAllRead: () => void;
  markRead: (id: string) => void;
}


// API types
interface MeResponse {
  userId: string;
  username: string;
  email: string;
  plan: string;
  name?: string;
  avatar?: string;
  aiUsage?: { reviewsUsed: number; reviewsLimit: number };
}

interface APIRepoStats {
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
}

interface APIRepo {
  id: string;
  name: string;
  visibility: string;
  stats: APIRepoStats;
}

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

// ─── Notification helpers ──────────────────────────────────────────────────

interface APINotification {
  id: string;
  type: string;
  actorName: string;
  repoName: string;
  meta?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

function notifTitle(n: APINotification): string {
  switch (n.type) {
    case "repo.forked":   return `${n.actorName} forked your repo`;
    case "pr.created":    return `New PR by ${n.actorName}`;
    case "pr.merged":     return `Your PR was merged`;
    case "issue.created": return `New issue by ${n.actorName}`;
    case "issue.closed":  return `Your issue was closed`;
    default:              return n.type;
  }
}

function notifBody(n: APINotification): string {
  const repo = n.repoName || "a repository";
  switch (n.type) {
    case "repo.forked":
      return `${n.actorName} forked ${repo}`;
    case "pr.created":
      return `${n.actorName} opened PR #${n.meta?.prNumber ?? ""}: ${n.meta?.prTitle ?? ""} in ${repo}`;
    case "pr.merged":
      return `${n.actorName} merged your PR #${n.meta?.prNumber ?? ""}: ${n.meta?.prTitle ?? ""} in ${repo}`;
    case "issue.created":
      return `${n.actorName} opened issue #${n.meta?.issueNumber ?? ""}: ${n.meta?.issueTitle ?? ""} in ${repo}`;
    case "issue.closed":
      return `${n.actorName} closed your issue #${n.meta?.issueNumber ?? ""}: ${n.meta?.issueTitle ?? ""} in ${repo}`;
    default:
      return repo;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapAPINotification(n: APINotification): Notification {
  return {
    id: n.id,
    title: notifTitle(n),
    body: notifBody(n),
    read: n.read,
    time: relativeTime(n.createdAt),
    type: n.type,
    actorName: n.actorName,
    repoName: n.repoName,
    meta: n.meta,
    createdAt: n.createdAt,
  };
}

const AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-indigo-500 to-cyan-400",
  "bg-gradient-to-br from-violet-500 to-pink-400",
  "bg-gradient-to-br from-emerald-500 to-teal-400",
  "bg-gradient-to-br from-amber-500 to-orange-400",
  "bg-gradient-to-br from-rose-500 to-red-400",
];

function avatarGradient(username: string): string {
  let sum = 0;
  for (let i = 0; i < username.length; i++) sum += username.charCodeAt(i);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export function useDashboard(): UseDashboardReturn {
  const [meData, setMeData] = useState<MeResponse | null>(null);
  const [repos, setRepos] = useState<APIRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError("Not authenticated");
      setIsLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch /me, /repositories, and /notifications in parallel
      const [meRes, reposRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/me`, { headers }),
        fetch(`${API_BASE}/api/v1/repositories`, { headers }),
        fetch(`${API_BASE}/api/v1/notifications?limit=20`, { headers }),
      ]);

      if (meRes.ok) {
        const j = await meRes.json();
        setMeData(j?.data ?? j);
      }

      if (reposRes.ok) {
        const j = await reposRes.json();
        setRepos(j?.data?.repositories ?? []);
      }

      if (notifRes.ok) {
        const j = await notifRes.json();
        const raw: APINotification[] = j?.data ?? [];
        setNotifications(raw.map(mapAPINotification));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  
  // Derive user object
  
  const user = useMemo<DashboardUser>(() => {
    const username = meData?.username ?? "you";
    const name = meData?.name ?? username;
    const plan = (meData?.plan ?? "free") as DashboardUser["plan"];
    return {
      id: meData?.userId ?? "",
      name,
      username,
      email: meData?.email ?? "",
      avatar: meData?.avatar ?? "",
      avatarColor: avatarGradient(username),
      plan,
      // Gamification — no backend yet, static defaults
      streak: 0,
      level: 1,
      xp: 0,
      xpToNext: 1000,
      badges: [],
      aiReviewsUsed: meData?.aiUsage?.reviewsUsed ?? 0,
      aiReviewsLimit: meData?.aiUsage?.reviewsLimit ?? 10,
    };
  }, [meData]);

    
  const stats = useMemo<StatCard[]>(() => {
    const totalRepos = repos.length;
    const totalStars = repos.reduce((acc, r) => acc + (r.stats?.stars ?? 0), 0);
    const openPRs = repos.reduce((acc, r) => acc + (r.stats?.openPRs ?? 0), 0);
    const aiReviews = user.aiReviewsUsed;

    return [
      {
        label: "Repositories",
        value: totalRepos,
        delta: totalRepos === 0 ? "No repos yet" : `${totalRepos} total`,
        positive: totalRepos > 0,
        icon: "repo",
        color: "text-indigo-400",
      },
      {
        label: "Stars earned",
        value: totalStars,
        delta: totalStars === 0 ? "Star your first repo" : `across ${totalRepos} repos`,
        positive: totalStars > 0,
        icon: "star",
        color: "text-amber-400",
      },
      {
        label: "Open Pull Requests",
        value: openPRs,
        delta: openPRs === 0 ? "All clear" : `${openPRs} awaiting review`,
        positive: openPRs === 0,
        icon: "pr",
        color: "text-violet-400",
      },
      {
        label: "AI Reviews",
        value: aiReviews,
        delta: `${user.aiReviewsLimit - aiReviews} remaining`,
        positive: user.aiReviewsLimit - aiReviews > 0,
        icon: "review",
        color: "text-cyan-400",
      },
    ];
  }, [repos, user.aiReviewsUsed, user.aiReviewsLimit]);

  
  // Notifications
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE}/api/v1/notifications/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore — optimistic update already applied */ }
  }, []);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore — optimistic update already applied */ }
  }, []);

  return {
    user,
    stats,
    activity: MOCK_ACTIVITY,
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllRead,
    markRead,
  };
}
