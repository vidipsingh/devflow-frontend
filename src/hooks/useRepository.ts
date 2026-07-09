
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RepoVisibility = "public" | "private";
export type RepoLanguage = "Go" | "TypeScript" | "Python" | "Rust" | "JavaScript" | "Other";

export interface Repository {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: RepoVisibility;
  language: RepoLanguage;
  languageColor: string;
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  lastUpdated: string;
  isForked: boolean;
  isPinned: boolean;
  topics: string[];
  ciStatus: "passing" | "failing" | "pending" | "none";
  aiReviews: number;
}

export type SortKey = "updated" | "stars" | "name";

export interface UseRepositoryReturn {
  repositories: Repository[];
  filtered: Repository[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
  visibilityFilter: "all" | RepoVisibility;
  setVisibilityFilter: (v: "all" | RepoVisibility) => void;
  pinnedIds: string[];
  togglePin: (id: string) => Promise<void>;
}
interface APIRepoStats {
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
}

interface APIRepository {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: string;
  language: string;
  topics: string[];
  isFork: boolean;
  isPinned: boolean;
  stats: APIRepoStats;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LANGUAGE_COLOR_MAP: Record<string, string> = {
  Go: "bg-cyan-400",
  TypeScript: "bg-blue-400",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-400",
  Rust: "bg-orange-400",
  "C++": "bg-rose-400",
  Java: "bg-red-400",
  Ruby: "bg-pink-400",
};

function languageColor(lang: string): string {
  return LANGUAGE_COLOR_MAP[lang] ?? "bg-white/40";
}

function toRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function mapAPIRepo(r: APIRepository): Repository {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug ?? r.name.toLowerCase().replace(/\s+/g, "-"),
    description: r.description ?? "",
    visibility: (r.visibility === "private" ? "private" : "public") as RepoVisibility,
    language: (r.language || "Other") as RepoLanguage,
    languageColor: languageColor(r.language),
    stars: r.stats?.stars ?? 0,
    forks: r.stats?.forks ?? 0,
    openIssues: r.stats?.openIssues ?? 0,
    openPRs: r.stats?.openPRs ?? 0,
    lastUpdated: toRelativeTime(r.updatedAt),
    isForked: r.isFork ?? false,
    isPinned: r.isPinned ?? false,
    topics: r.topics ?? [],
    // ciStatus and aiReviews are not yet in backend — default for now
    ciStatus: "none",
    aiReviews: 0,
  };
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRepository(): UseRepositoryReturn {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | RepoVisibility>("all");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const fetchRepos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("devflow_token")
        : null;

      if (!token) {
        setError("Not authenticated");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/v1/repositories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const json = await res.json();
      const raw: APIRepository[] = json?.data?.repositories ?? [];
      const mapped = raw.map(mapAPIRepo);
      setRepositories(mapped);

      // Seed pinnedIds from the isPinned flag returned by the DB
      setPinnedIds(mapped.filter((r) => r.isPinned).map((r) => r.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  // togglePin — optimistically updates local state, then persists to backend
  const togglePin = useCallback(async (id: string) => {
    const repo = repositories.find((r) => r.id === id);
    if (!repo) return;

    const willBePinned = !pinnedIds.includes(id);

    // Optimistic update
    setPinnedIds((prev) =>
      willBePinned ? [...prev, id] : prev.filter((p) => p !== id)
    );

    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("devflow_token")
        : null;
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/v1/repositories/${repo.slug}/pin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pinned: willBePinned }),
      });

      if (!res.ok) {
        // Rollback on failure
        setPinnedIds((prev) =>
          willBePinned ? prev.filter((p) => p !== id) : [...prev, id]
        );
      } else {
        // Update local repository list to reflect new isPinned value
        setRepositories((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isPinned: willBePinned } : r))
        );
      }
    } catch {
      // Rollback on network error
      setPinnedIds((prev) =>
        willBePinned ? prev.filter((p) => p !== id) : [...prev, id]
      );
    }
  }, [repositories, pinnedIds]);

  const filtered = useMemo(() => {
    let list = [...repositories];

    if (visibilityFilter !== "all") {
      list = list.filter((r) => r.visibility === visibilityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortKey === "stars") return b.stars - a.stars;
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return 0; // "updated" — server already returns sorted by updatedAt desc
    });

    return list;
  }, [repositories, searchQuery, sortKey, visibilityFilter]);

  return {
    repositories,
    filtered,
    isLoading,
    error,
    refetch: fetchRepos,
    searchQuery,
    setSearchQuery,
    sortKey,
    setSortKey,
    visibilityFilter,
    setVisibilityFilter,
    pinnedIds,
    togglePin,
  };
}
