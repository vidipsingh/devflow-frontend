
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CallbackHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [msg, setMsg]       = useState("");

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      const messages: Record<string, string> = {
        oauth_cancelled: "OAuth sign-in was cancelled.",
        oauth_failed:    "OAuth sign-in failed. Please try again.",
        no_token:        "Authentication failed — no token received.",
      };
      setMsg(messages[error] ?? "Authentication failed.");
      setStatus("error");
      setTimeout(() => router.replace("/login?error=" + error), 3000);
      return;
    }

    if (!token) {
      setMsg("No authentication token received.");
      setStatus("error");
      setTimeout(() => router.replace("/login?error=no_token"), 3000);
      return;
    }

    try {
      localStorage.setItem("devflow_token", token);
    } catch {
      // ignore
    }

    setTimeout(() => router.replace("/dashboard"), 500);
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-indigo-600/[0.08] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[280px] h-[280px] rounded-full bg-violet-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5 text-center max-w-sm">
        {status === "loading" ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <div>
              <p className="text-white font-semibold text-base">Completing sign in…</p>
              <p className="text-[#71717a] text-sm mt-1">Setting up your workspace</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-red-400" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-base">Sign in failed</p>
              <p className="text-red-400 text-sm mt-1">{msg}</p>
              <p className="text-[#71717a] text-xs mt-3">Redirecting back to login…</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
