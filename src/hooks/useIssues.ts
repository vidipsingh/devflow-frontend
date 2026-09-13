
"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IssueLabel {
  name: string;
  color: string;
}

export interface IssueReactions {
  thumbsUp: number;
  thumbsDown: number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

export interface IssueComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  number: number;
  repoId: string;
  repoSlug: string;
  title: string;
  body: string;
  state: "open" | "closed";
  authorId: string;
  authorName: string;
  assignees: string[];
  labels: IssueLabel[];
  milestone: string;
  comments: IssueComment[];
  commentCount: number;
  reactions: IssueReactions;
  isPinned: boolean;
  isLocked: boolean;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueListResult {
  issues: Issue[];
  total: number;
  page: number;
  limit: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// Convert "owner/repo" → "owner~repo" for the API :name param.
function encodeRepoSlug(slug: string) { return slug.replace("/", "~"); }

export function useIssues(repoSlug: string) {
  const apiSlug = encodeRepoSlug(repoSlug);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── List issues ──────────────────────────────────────────────────────────
  const fetchIssues = useCallback(
    async (state: "open" | "closed" | "" = "open", page = 1, limit = 20) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (state) params.set("state", state);
        const json = await apiFetch<{ data: IssueListResult }>(
          `/api/v1/repositories/${apiSlug}/issues?${params}`
        );
        const data: IssueListResult = json.data;
        setIssues(data.issues ?? []);
        setTotal(data.total ?? 0);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [repoSlug]
  );

  // ── Get single issue ─────────────────────────────────────────────────────
  const fetchIssue = useCallback(
    async (number: number): Promise<Issue | null> => {
      try {
        const json = await apiFetch<{ data: Issue }>(
          `/api/v1/repositories/${apiSlug}/issues/${number}`
        );
        return json.data;
      } catch {
        return null;
      }
    },
    [repoSlug]
  );

  // ── Create issue ─────────────────────────────────────────────────────────
  const createIssue = useCallback(
    async (payload: {
      title: string;
      body?: string;
      labels?: IssueLabel[];
      assignees?: string[];
      milestone?: string;
    }): Promise<Issue | null> => {
      setActionLoading(true);
      setActionError(null);
      try {
        const json = await apiFetch<{ data: Issue }>(
          `/api/v1/repositories/${apiSlug}/issues`,
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

  // ── Update issue ─────────────────────────────────────────────────────────
  const updateIssue = useCallback(
    async (
      number: number,
      payload: {
        title?: string;
        body?: string;
        state?: "open" | "closed";
        labels?: IssueLabel[];
        assignees?: string[];
        milestone?: string;
        isPinned?: boolean;
        isLocked?: boolean;
      }
    ): Promise<Issue | null> => {
      setActionLoading(true);
      setActionError(null);
      try {
        const json = await apiFetch<{ data: Issue }>(
          `/api/v1/repositories/${repoSlug}/issues/${number}`,
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

  // ── Delete issue ─────────────────────────────────────────────────────────
  const deleteIssue = useCallback(
    async (number: number): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        await apiFetch(`/api/v1/repositories/${repoSlug}/issues/${number}`, { method: "DELETE" });
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

  // ── Add comment ──────────────────────────────────────────────────────────
  const addComment = useCallback(
    async (number: number, body: string): Promise<IssueComment | null> => {
      setActionLoading(true);
      setActionError(null);
      try {
        const json = await apiFetch<{ data: IssueComment }>(
          `/api/v1/repositories/${repoSlug}/issues/${number}/comments`,
          { method: "POST", body: JSON.stringify({ body }) }
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

  // ── Edit comment ─────────────────────────────────────────────────────────
  const editComment = useCallback(
    async (number: number, commentId: string, body: string): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        await apiFetch(
          `/api/v1/repositories/${repoSlug}/issues/${number}/comments/${commentId}`,
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

  // ── Delete comment ───────────────────────────────────────────────────────
  const deleteComment = useCallback(
    async (number: number, commentId: string): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        await apiFetch(
          `/api/v1/repositories/${repoSlug}/issues/${number}/comments/${commentId}`,
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

  // ── React to issue ───────────────────────────────────────────────────────
  const reactToIssue = useCallback(
    async (
      number: number,
      reaction: "thumbsUp" | "thumbsDown" | "laugh" | "hooray" | "confused" | "heart" | "rocket" | "eyes",
      add: boolean
    ): Promise<IssueReactions | null> => {
      try {
        const json = await apiFetch<{ data: IssueReactions }>(
          `/api/v1/repositories/${repoSlug}/issues/${number}/reactions`,
          { method: "POST", body: JSON.stringify({ reaction, add }) }
        );
        return json.data;
      } catch {
        return null;
      }
    },
    [repoSlug]
  );

  return {
    issues,
    total,
    loading,
    error,
    actionLoading,
    actionError,
    fetchIssues,
    fetchIssue,
    createIssue,
    updateIssue,
    deleteIssue,
    addComment,
    editComment,
    deleteComment,
    reactToIssue,
    setActionError,
  };
}
