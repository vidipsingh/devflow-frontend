
"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Response types mirrored from Go structs ──────────────────────────────────

export interface DailyActivity {
  date: string;   // "2026-09-30"
  count: number;
}

export interface LanguageStat {
  language: string;
  count: number;
}

export interface MonthlySeries {
  month: string;  // "2026-09"
  count: number;
}

export interface RepoOverview {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  publicRepos: number;
  privateRepos: number;
}

export interface PRStats {
  totalOpened: number;
  totalMerged: number;
  totalClosed: number;
  avgMergeHrs: number;
}

export interface IssueStats {
  totalOpened: number;
  totalClosed: number;
  avgCloseHrs: number;
}

export interface MarketplaceStats {
  totalSnippets: number;
  publishedSnippets: number;
  totalDownloads: number;
  totalPurchases: number;
  totalRevenue: number;
  creatorEarnings: number;
  avgRating: number;
}

export interface SnippetPerformance {
  id: string;
  title: string;
  downloads: number;
  purchases: number;
  revenue: number;
  rating: number;
  status: string;
}

export interface PairStats {
  totalSessions: number;
  totalMinutes: number;
  avgMinutes: number;
}

export interface AnalyticsOverview {
  activity: DailyActivity[];
  languages: LanguageStat[];
  repos: RepoOverview;
  prs: PRStats;
  issues: IssueStats;
  marketplace: MarketplaceStats;
  snippetPerformance: SnippetPerformance[];
  pairSessions: PairStats;
  monthlyCommits: MonthlySeries[];
  monthlyRevenue: MonthlySeries[];
}

// ─── New analytics types ──────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface RepoActivitySummary {
  repoId: string;
  repoName: string;
  language: string;
  commits: number;
  stars: number;
  forks: number;
}

export interface RepoAnalytics {
  repoId: string;
  repoName: string;
  commits: number;
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  language: string;
  timeSeries: TimeSeriesPoint[];
}

export interface MemberActivity {
  userId: string;
  username: string;
  commits: number;
}

export interface TeamAnalytics {
  totalMembers: number;
  totalRepos: number;
  totalCommits: number;
  totalDiscussions: number;
  memberActivity: MemberActivity[];
  timeSeries: TimeSeriesPoint[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAnalytics(days = 30, granularity = "daily") {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: AnalyticsOverview }>(
        `/api/v1/analytics/overview?days=${days}&granularity=${granularity}`
      );
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [days, granularity]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

export function useAllReposAnalytics(days = 30) {
  const [repos, setRepos] = useState<RepoActivitySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: { repos: RepoActivitySummary[]; total: number } }>(
        `/api/v1/analytics/repos?days=${days}`
      );
      setRepos(res.data.repos ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repos analytics");
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return { repos, total, isLoading, error, refetch: load };
}

export function useRepoAnalytics(repoName: string, days = 30, granularity = "daily") {
  const [data, setData] = useState<RepoAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!repoName) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: RepoAnalytics }>(
        `/api/v1/analytics/repos/${encodeURIComponent(repoName)}?days=${days}&granularity=${granularity}`
      );
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repo analytics");
    } finally {
      setIsLoading(false);
    }
  }, [repoName, days, granularity]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

export function useTeamAnalytics(slug: string, days = 30, granularity = "daily") {
  const [data, setData] = useState<TeamAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: TeamAnalytics }>(
        `/api/v1/analytics/teams/${encodeURIComponent(slug)}?days=${days}&granularity=${granularity}`
      );
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team analytics");
    } finally {
      setIsLoading(false);
    }
  }, [slug, days, granularity]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}
