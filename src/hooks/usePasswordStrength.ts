
"use client";

import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PasswordStrength {
  /** 0–5 score */
  score: number;
  label: string;
  /** Tailwind bg-* class for the strength bar segments */
  barColor: string;
  /** Tailwind text-* class for the label */
  labelColor: string;
}

// ---------------------------------------------------------------------------
// Pure scorer (exported so it can be tested independently)
// ---------------------------------------------------------------------------

export function scorePassword(pw: string): PasswordStrength {
  if (pw.length === 0) {
    return { score: 0, label: "", barColor: "", labelColor: "" };
  }

  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;

  if (score <= 1) return { score, label: "Weak",   barColor: "bg-red-500",    labelColor: "text-red-400"    };
  if (score <= 2) return { score, label: "Fair",   barColor: "bg-amber-500",  labelColor: "text-amber-400"  };
  if (score <= 3) return { score, label: "Good",   barColor: "bg-yellow-400", labelColor: "text-yellow-400" };
                  return { score, label: "Strong", barColor: "bg-emerald-500",labelColor: "text-emerald-400" };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns a memoised `PasswordStrength` object that updates whenever
 * the supplied `password` string changes.
 */
export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => scorePassword(password), [password]);
}
