
"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("devflow_token");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Request shapes ────────────────────────────────────────────────────────────

export interface CreateRepoPayload {
  name: string;
  description?: string;
  visibility: "public" | "private";
  defaultBranch?: string;
  autoInit?: boolean;
}

export interface UpdateRepoPayload {
  description?: string;
  visibility?: "public" | "private";
  topics?: string[];
}

export interface UseRepoActionsReturn {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  actionError: string | null;
  createRepo: (payload: CreateRepoPayload) => Promise<{ slug: string } | null>;
  updateRepo: (slug: string, payload: UpdateRepoPayload) => Promise<boolean>;
  deleteRepo: (slug: string) => Promise<boolean>;
  pinRepo: (slug: string, pinned: boolean) => Promise<boolean>;
  clearError: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useRepoActions(): UseRepoActionsReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const clearError = useCallback(() => setActionError(null), []);

  // Create a new repository
  const createRepo = useCallback(
    async (payload: CreateRepoPayload): Promise<{ slug: string } | null> => {
      setIsCreating(true);
      setActionError(null);
      try {
        const json = await apiFetch<{ success: boolean; data: { slug: string } }>(
          "/api/v1/repositories",
          {
            method: "POST",
            body: JSON.stringify({
              name: payload.name,
              description: payload.description ?? "",
              visibility: payload.visibility,
              defaultBranch: payload.defaultBranch ?? "main",
              autoInit: payload.autoInit ?? false,
            }),
          }
        );
        return { slug: json.data?.slug ?? payload.name.toLowerCase().replace(/\s+/g, "-") };
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Failed to create repository");
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  // Update repo metadata (description, visibility, topics)
  const updateRepo = useCallback(
    async (slug: string, payload: UpdateRepoPayload): Promise<boolean> => {
      setIsUpdating(true);
      setActionError(null);
      try {
        await apiFetch(`/api/v1/repositories/${slug}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        return true;
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Failed to update repository");
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Delete a repository
  const deleteRepo = useCallback(
    async (slug: string): Promise<boolean> => {
      setIsDeleting(true);
      setActionError(null);
      try {
        await apiFetch(`/api/v1/repositories/${slug}`, { method: "DELETE" });
        return true;
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Failed to delete repository");
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  // Toggle pin (used directly by cards)
  const pinRepo = useCallback(
    async (slug: string, pinned: boolean): Promise<boolean> => {
      try {
        await apiFetch(`/api/v1/repositories/${slug}/pin`, {
          method: "PATCH",
          body: JSON.stringify({ pinned }),
        });
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  return {
    isCreating,
    isUpdating,
    isDeleting,
    actionError,
    createRepo,
    updateRepo,
    deleteRepo,
    pinRepo,
    clearError,
  };
}
