
import { Suspense } from "react";
import CallbackHandler from "./CallbackHandler";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <p className="text-[#71717a] text-sm">Completing sign in…</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
