
"use client";

import { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RepoVisibility = "public" | "private";
export type RepoLanguage = "Go" | "TypeScript" | "Python" | "Rust" | "JavaScript" | "Other";

export interface Repository {
  id: string;
  name: string;
  description: string;
  visibility: RepoVisibility;
  language: RepoLanguage;
  languageColor: string; // tailwind bg-* class
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  lastUpdated: string;
  isForked: boolean;
  topics: string[];
  ciStatus: "passing" | "failing" | "pending" | "none";
  aiReviews: number;
}

export type SortKey = "updated" | "stars" | "name";

export interface UseRepositoryReturn {
  repositories: Repository[];
  filtered: Repository[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
  visibilityFilter: "all" | RepoVisibility;
  setVisibilityFilter: (v: "all" | RepoVisibility) => void;
  pinnedIds: string[];
  togglePin: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_REPOS: Repository[] = [
  {
    id: "r1",
    name: "devflow-backend",
    description: "Go/Gin REST API powering the DevFlow platform — MongoDB Atlas, JWT auth, AI review engine.",
    visibility: "public",
    language: "Go",
    languageColor: "bg-cyan-400",
    stars: 84,
    forks: 12,
    openIssues: 3,
    openPRs: 2,
    lastUpdated: "2m ago",
    isForked: false,
    topics: ["go", "gin", "mongodb", "api"],
    ciStatus: "passing",
    aiReviews: 18,
  },
  {
    id: "r2",
    name: "devflow-frontend",
    description: "Next.js 16 + Tailwind CSS v4 frontend — landing page, dashboard, marketplace.",
    visibility: "public",
    language: "TypeScript",
    languageColor: "bg-blue-400",
    stars: 61,
    forks: 7,
    openIssues: 5,
    openPRs: 3,
    lastUpdated: "1h ago",
    isForked: false,
    topics: ["nextjs", "tailwind", "react", "typescript"],
    ciStatus: "passing",
    aiReviews: 24,
  },
  {
    id: "r3",
    name: "payment-service",
    description: "Razorpay + Stripe payment processing microservice with webhook support.",
    visibility: "private",
    language: "Go",
    languageColor: "bg-cyan-400",
    stars: 0,
    forks: 0,
    openIssues: 1,
    openPRs: 1,
    lastUpdated: "3h ago",
    isForked: false,
    topics: ["payments", "razorpay", "stripe"],
    ciStatus: "failing",
    aiReviews: 6,
  },
  {
    id: "r4",
    name: "cli-tools",
    description: "Developer productivity CLI — scaffolding, repo templates, and AI commit messages.",
    visibility: "public",
    language: "Go",
    languageColor: "bg-cyan-400",
    stars: 32,
    forks: 4,
    openIssues: 2,
    openPRs: 1,
    lastUpdated: "1d ago",
    isForked: false,
    topics: ["cli", "go", "developer-tools"],
    ciStatus: "passing",
    aiReviews: 5,
  },
  {
    id: "r5",
    name: "react-query-starter",
    description: "Opinionated React Query v5 + Zustand starter template with auth and dark mode.",
    visibility: "public",
    language: "TypeScript",
    languageColor: "bg-blue-400",
    stars: 119,
    forks: 28,
    openIssues: 4,
    openPRs: 0,
    lastUpdated: "2d ago",
    isForked: false,
    topics: ["react", "react-query", "zustand", "template"],
    ciStatus: "passing",
    aiReviews: 3,
  },
  {
    id: "r6",
    name: "next-auth-boilerplate",
    description: "Forked from t3oss/next-auth — extended with GitHub + Google OAuth and JWT refresh.",
    visibility: "public",
    language: "TypeScript",
    languageColor: "bg-blue-400",
    stars: 8,
    forks: 2,
    openIssues: 0,
    openPRs: 0,
    lastUpdated: "5d ago",
    isForked: true,
    topics: ["nextauth", "oauth", "jwt"],
    ciStatus: "none",
    aiReviews: 0,
  },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRepository(): UseRepositoryReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | RepoVisibility>("all");
  const [pinnedIds, setPinnedIds] = useState<string[]>(["r1", "r2"]);

  const togglePin = (id: string) =>
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const filtered = useMemo(() => {
    let list = [...MOCK_REPOS];

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
      // "updated" — keep original order (already sorted by recency in mock data)
      return 0;
    });

    return list;
  }, [searchQuery, sortKey, visibilityFilter]);

  return {
    repositories: MOCK_REPOS,
    filtered,
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
