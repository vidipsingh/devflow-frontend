
"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PRLabel {
  name: string;
  color: string;
}

export interface PRComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  filePath: string;
  lineNumber: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AISuggestion {
  filePath: string;
  lineStart: number;
  lineEnd: number;
  severity: "info" | "warning" | "critical";
  category: string;
  message: string;
  suggestion: string;
}

export interface AIReview {
  status: "pending" | "done" | "error" | "skipped";
  summary: string;
  suggestions: AISuggestion[];
  model: string;
  reviewedAt: string | null;
  errorMsg: string;
}

export interface PullRequest {
  id: string;
  number: number;
  repoId: string;
  repoSlug: string;
  title: string;
  body: string;
  state: "open" | "closed" | "merged";
  headBranch: string;
  baseBranch: string;
  authorId: string;
  authorName: string;
  reviewerIds: string[];
  labels: PRLabel[];
  comments: PRComment[];
  commentCount: number;
  additions: number;
  deletions: number;
  changedFiles: string[];
  isDraft: boolean;
  isMergeable: boolean;
  aiReview: AIReview | null;
  mergedAt: string | null;
  mergedBy: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PRListResult {
  pullRequests: PullRequest[];
  total: number;
}

// ─── Diff types ───────────────────────────────────────────────────────────────

export type DiffLineType = "context" | "addition" | "deletion";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldNo: number | null;
  newNo: number | null;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface FileDiff {
  path: string;
  status: "added" | "removed" | "modified";
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  isBinary: boolean;
}

export interface PRDiff {
  files: FileDiff[];
  additions: number;
  deletions: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// Convert "owner/repo" → "owner~repo" for the API :name param.
function encodeRepoSlug(slug: string) { return slug.replace("/", "~"); }

export function usePullRequests(repoSlug: string) {
  const apiSlug = encodeRepoSlug(repoSlug);
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── List PRs ──────────────────────────────────────────────────────────────
  const fetchPRs = useCallback(
    async (state: "open" | "closed" | "merged" | "" = "open") => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (state) params.set("state", state);
        const json = await apiFetch<{ data: PRListResult }>(
          `/api/v1/repositories/${apiSlug}/pulls?${params}`
        );
        const data: PRListResult = json.data;
        setPrs(data.pullRequests ?? []);
        setTotal(data.total ?? 0);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Get single PR ─────────────────────────────────────────────────────────
  const fetchPR = useCallback(
    async (number: number): Promise<PullRequest | null> => {
      try {
        const json = await apiFetch<{ data: PullRequest }>(
          `/api/v1/repositories/${apiSlug}/pulls/${number}`
        );
        return json.data;
      } catch {
        return null;
      }
    },
    [repoSlug]
  );

  // ── Create PR ─────────────────────────────────────────────────────────────
  const createPR = useCallback(
    async (payload: {
      title: string;
      body?: string;
      headBranch: string;
      headRepoId?: string;
      baseBranch: string;
      isDraft?: boolean;
      labels?: PRLabel[];
    }): Promise<PullRequest | null> => {
      setActionLoading(true);
      setActionError(null);
      try {
        const json = await apiFetch<{ data: PullRequest }>(
          `/api/v1/repositories/${apiSlug}/pulls`,
          { method: "POST", body: JSON.stringify(payload) }
        );
        return json.data;
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Update PR ─────────────────────────────────────────────────────────────
  const updatePR = useCallback(
    async (
      number: number,
      payload: {
        title?: string;
        body?: string;
        state?: "open" | "closed";
        isDraft?: boolean;
        labels?: PRLabel[];
      }
    ): Promise<PullRequest | null> => {
      setActionLoading(true);
      setActionError(null);
      try {
        const json = await apiFetch<{ data: PullRequest }>(
          `/api/v1/repositories/${apiSlug}/pulls/${number}`,
          { method: "PATCH", body: JSON.stringify(payload) }
        );
        return json.data;
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Delete PR ─────────────────────────────────────────────────────────────
  const deletePR = useCallback(
    async (number: number): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        await apiFetch(`/api/v1/repositories/${apiSlug}/pulls/${number}`, { method: "DELETE" });
        return true;
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Unknown error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Merge PR ──────────────────────────────────────────────────────────────
  const mergePR = useCallback(
    async (number: number, method: "merge" | "squash" | "rebase" = "merge"): Promise<PullRequest | null> => {
      setActionLoading(true);
      setActionError(null);
      try {
        const json = await apiFetch<{ data: PullRequest }>(
          `/api/v1/repositories/${apiSlug}/pulls/${number}/merge`,
          { method: "POST", body: JSON.stringify({ mergeMethod: method }) }
        );
        return json.data;
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Add comment ───────────────────────────────────────────────────────────
  const addComment = useCallback(
    async (
      number: number,
      body: string,
      filePath?: string,
      lineNumber?: number
    ): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        await apiFetch(
          `/api/v1/repositories/${apiSlug}/pulls/${number}/comments`,
          {
            method: "POST",
            body: JSON.stringify({ body, filePath: filePath ?? "", lineNumber: lineNumber ?? 0 }),
          }
        );
        return true;
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Unknown error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Edit comment ──────────────────────────────────────────────────────────
  const editComment = useCallback(
    async (number: number, commentId: string, body: string): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        await apiFetch(
          `/api/v1/repositories/${apiSlug}/pulls/${number}/comments/${commentId}`,
          { method: "PATCH", body: JSON.stringify({ body }) }
        );
        return true;
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Unknown error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Delete comment ────────────────────────────────────────────────────────
  const deleteComment = useCallback(
    async (number: number, commentId: string): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        await apiFetch(
          `/api/v1/repositories/${apiSlug}/pulls/${number}/comments/${commentId}`,
          { method: "DELETE" }
        );
        return true;
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Unknown error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Fetch diff ────────────────────────────────────────────────────────────
  const fetchDiff = useCallback(
    async (number: number): Promise<PRDiff | null> => {
      try {
        const json = await apiFetch<{ data: PRDiff }>(
          `/api/v1/repositories/${apiSlug}/pulls/${number}/diff`
        );
        return json.data;
      } catch {
        return null;
      }
    },
    [repoSlug]
  );

  // ── Trigger AI Review ─────────────────────────────────────────────────────
  const triggerAIReview = useCallback(
    async (number: number): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        await apiFetch(
          `/api/v1/repositories/${apiSlug}/pulls/${number}/ai-review`,
          { method: "POST" }
        );
        return true;
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Unknown error");
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [repoSlug]
  );

  return {
    prs,
    total,
    loading,
    error,
    actionLoading,
    actionError,
    fetchPRs,
    fetchPR,
    fetchDiff,
    createPR,
    updatePR,
    deletePR,
    mergePR,
    addComment,
    editComment,
    deleteComment,
    triggerAIReview,
    setActionError,
  };
}
