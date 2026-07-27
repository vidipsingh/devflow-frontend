
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

export function useIssues(repoSlug: string) {
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues?${params}`,
          { headers: authHeaders() }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to fetch issues");
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues/${number}`,
          { headers: authHeaders() }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Not found");
        return json.data as Issue;
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues`,
          { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to create issue");
        return json.data as Issue;
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues/${number}`,
          { method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload) }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to update issue");
        return json.data as Issue;
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues/${number}`,
          { method: "DELETE", headers: authHeaders() }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to delete issue");
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues/${number}/comments`,
          { method: "POST", headers: authHeaders(), body: JSON.stringify({ body }) }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to add comment");
        return json.data as IssueComment;
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
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues/${number}/comments/${commentId}`,
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

  // ── Delete comment ───────────────────────────────────────────────────────
  const deleteComment = useCallback(
    async (number: number, commentId: string): Promise<boolean> => {
      setActionLoading(true);
      setActionError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues/${number}/comments/${commentId}`,
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

  // ── React to issue ───────────────────────────────────────────────────────
  const reactToIssue = useCallback(
    async (
      number: number,
      reaction: "thumbsUp" | "thumbsDown" | "laugh" | "hooray" | "confused" | "heart" | "rocket" | "eyes",
      add: boolean
    ): Promise<IssueReactions | null> => {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/repositories/${repoSlug}/issues/${number}/reactions`,
          { method: "POST", headers: authHeaders(), body: JSON.stringify({ reaction, add }) }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to react");
        return json.data as IssueReactions;
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
