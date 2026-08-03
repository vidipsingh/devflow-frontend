
"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function getToken() {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePullRequests(repoSlug: string) {
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls?${params}`,
          { headers: authHeaders() }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to fetch pull requests");
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls/${number}`,
          { headers: authHeaders() }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Not found");
        return json.data as PullRequest;
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
      baseBranch: string;
      isDraft?: boolean;
      labels?: PRLabel[];
    }): Promise<PullRequest | null> => {
      setActionLoading(true);
      setActionError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls`,
          { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to create pull request");
        return json.data as PullRequest;
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls/${number}`,
          { method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload) }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to update pull request");
        return json.data as PullRequest;
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls/${number}`,
          { method: "DELETE", headers: authHeaders() }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to delete pull request");
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls/${number}/merge`,
          { method: "POST", headers: authHeaders(), body: JSON.stringify({ mergeMethod: method }) }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to merge pull request");
        return json.data as PullRequest;
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls/${number}/comments`,
          {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ body, filePath: filePath ?? "", lineNumber: lineNumber ?? 0 }),
          }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to add comment");
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls/${number}/comments/${commentId}`,
          { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ body }) }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to edit comment");
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/pulls/${number}/comments/${commentId}`,
          { method: "DELETE", headers: authHeaders() }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to delete comment");
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
    createPR,
    updatePR,
    deletePR,
    mergePR,
    addComment,
    editComment,
    deleteComment,
    setActionError,
  };
}
