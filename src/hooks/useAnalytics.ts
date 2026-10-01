
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalytics(days = 30) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: AnalyticsOverview }>(
        `/api/v1/analytics/overview?days=${days}`
      );
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}
