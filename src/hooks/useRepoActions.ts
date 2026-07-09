
"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

function getToken(): string | null {
  try {
    return typeof window !== "undefined"
      ? localStorage.getItem("devflow_token")
      : null;
  } catch {
    return null;
  }
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateRepoPayload {
  name: string;
  description: string;
  visibility: "public" | "private";
  defaultBranch: string;
  autoInit: boolean;
}

export interface UpdateRepoPayload {
  description?: string;
  visibility?: "public" | "private";
  topics?: string[];
}

export interface UseRepoActionsReturn {
  isSubmitting: boolean;
  createRepo: (payload: CreateRepoPayload) => Promise<{ ok: boolean; error?: string }>;
  updateRepo: (slug: string, payload: UpdateRepoPayload) => Promise<{ ok: boolean; error?: string }>;
  deleteRepo: (slug: string) => Promise<{ ok: boolean; error?: string }>;
  pinRepo: (slug: string, pinned: boolean) => Promise<{ ok: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRepoActions(): UseRepoActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRepo = async (payload: CreateRepoPayload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/repositories`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, error: json?.error ?? "Failed to create repository" };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRepo = async (slug: string, payload: UpdateRepoPayload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/repositories/${slug}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, error: json?.error ?? "Failed to update repository" };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRepo = async (slug: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/repositories/${slug}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, error: json?.error ?? "Failed to delete repository" };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    } finally {
      setIsSubmitting(false);
    }
  };

  const pinRepo = async (slug: string, pinned: boolean) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/repositories/${slug}/pin`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ pinned }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, error: json?.error ?? "Failed to update pin state" };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, createRepo, updateRepo, deleteRepo, pinRepo };
}
