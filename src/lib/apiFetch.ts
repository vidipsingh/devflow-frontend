
/**
 * Centralised fetch wrapper for all authenticated API calls.
 *
 * Behaviour:
 *   • Attaches "Authorization: Bearer <token>" from localStorage automatically.
 *   • On HTTP 401 (token missing / expired) → clears the stored token and
 *     redirects the browser to /login so the user is never stuck on a stale
 *     dashboard session.
 *   • Throws on any non-2xx response (callers never see a 401 Error because
 *     the page navigates away before the throw propagates).
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("devflow_token");
  } catch {
    return null;
  }
}

function clearTokenAndRedirect(): never {
  try {
    localStorage.removeItem("devflow_token");
  } catch { /* ignore */ }
  // replace() keeps the history stack clean — the login page replaces the
  // current entry so pressing Back doesn't bounce the user back to a broken page.
  window.location.replace("/login");
  // Throw so TypeScript knows this path never returns a value.
  throw new Error("Session expired — redirecting to login");
}

/**
 * Drop-in replacement for `fetch` that:
 *  1. Prefixes paths with NEXT_PUBLIC_BACKEND_URL
 *  2. Injects the Bearer token
 *  3. Handles 401 by clearing the token + redirecting to /login
 *  4. Throws on any other non-ok status with the server's error message
 */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearTokenAndRedirect();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
