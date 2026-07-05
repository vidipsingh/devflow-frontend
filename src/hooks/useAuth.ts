
"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthProvider = "github" | "google";
export type AuthLoadingState = AuthProvider | "email" | null;

export interface LoginFields {
  email: string;
  password: string;
}

export interface RegisterFields {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface UseAuthReturn {
  loading: AuthLoadingState;
  error: string | null;
  success: boolean;
  clearError: () => void;
  loginWithOAuth: (provider: AuthProvider) => void;
  loginWithEmail: (fields: LoginFields) => Promise<void>;
  registerWithEmail: (fields: RegisterFields) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function saveToken(token: string) {
  try {
    localStorage.setItem("devflow_token", token);
  } catch {
    // localStorage may be unavailable in some SSR edge cases
  }
}

async function postJSON<T>(path: string, body: T): Promise<{ ok: boolean; data: Record<string, unknown>; error?: string }> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const json = await res.json();
  return { ok: res.ok, data: json.data ?? {}, error: json.error };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const [loading, setLoading] = useState<AuthLoadingState>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const clearError = () => setError(null);

  // ── OAuth ──────────────────────────────────────────────────────────────────
  const loginWithOAuth = (provider: AuthProvider) => {
    setLoading(provider);
    setError(null);
    window.location.href = `${BACKEND}/api/v1/auth/${provider}`;
  };

  // ── Email login ─────────────────────────────────────────────────────────────
  const loginWithEmail = async ({ email, password }: LoginFields) => {
    setLoading("email");
    setError(null);
    try {
      const { ok, data, error: apiErr } = await postJSON("/api/v1/auth/login", { email, password });
      if (!ok) {
        setError(apiErr ?? "Invalid email or password.");
        return;
      }
      if (typeof data.token === "string") saveToken(data.token);
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  // ── Email registration ──────────────────────────────────────────────────────
  const registerWithEmail = async ({ name, username, email, password }: RegisterFields) => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading("email");
    setError(null);
    try {
      const { ok, data, error: apiErr } = await postJSON("/api/v1/auth/register", {
        name,
        username,
        email,
        password,
      });
      if (!ok) {
        setError(apiErr ?? "Registration failed. Please try again.");
        return;
      }
      if (typeof data.token === "string") saveToken(data.token);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return {
    loading,
    error,
    success,
    clearError,
    loginWithOAuth,
    loginWithEmail,
    registerWithEmail,
  };
}
