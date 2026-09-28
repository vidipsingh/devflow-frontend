
"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, getToken } from "@/lib/apiFetch";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackendNotification {
  id: string;
  type: string;
  actorName: string;
  repoName: string;
  meta?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface MappedNotification extends BackendNotification {
  title: string;
  body: string;
  timeAgo: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notifTitle(n: BackendNotification): string {
  switch (n.type) {
    case "repo.forked":   return `${n.actorName} forked your repo`;
    case "pr.created":    return `New PR opened by ${n.actorName}`;
    case "pr.merged":     return `Your PR was merged`;
    case "issue.created": return `New issue opened by ${n.actorName}`;
    case "issue.closed":  return `Your issue was closed`;
    default:              return n.type;
  }
}

function notifBody(n: BackendNotification): string {
  const repo = n.repoName || "a repository";
  switch (n.type) {
    case "repo.forked":
      return `${n.actorName} forked ${repo}`;
    case "pr.created":
      return `${n.actorName} opened PR #${n.meta?.prNumber ?? ""}: "${n.meta?.prTitle ?? ""}" in ${repo}`;
    case "pr.merged":
      return `${n.actorName} merged PR #${n.meta?.prNumber ?? ""}: "${n.meta?.prTitle ?? ""}" in ${repo}`;
    case "issue.created":
      return `${n.actorName} opened issue #${n.meta?.issueNumber ?? ""}: "${n.meta?.issueTitle ?? ""}" in ${repo}`;
    case "issue.closed":
      return `${n.actorName} closed issue #${n.meta?.issueNumber ?? ""}: "${n.meta?.issueTitle ?? ""}" in ${repo}`;
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

function mapNotification(n: BackendNotification): MappedNotification {
  return {
    ...n,
    title: notifTitle(n),
    body: notifBody(n),
    timeAgo: relativeTime(n.createdAt),
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export interface UseNotificationsReturn {
  notifications: MappedNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAllRead: () => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
  refresh: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<MappedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ data: BackendNotification[] }>(
        "/api/v1/notifications?limit=50"
      );
      setNotifications((data.data ?? []).map(mapNotification));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(async () => {
    // Optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE}/api/v1/notifications/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore */ }
  }, []);

  const markOneRead = useCallback(async (id: string) => {
    // Optimistic
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
    } catch { /* ignore */ }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAllRead,
    markOneRead,
    refresh: fetch_,
  };
}
