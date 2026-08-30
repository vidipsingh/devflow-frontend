
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { ReviewSessionProvider, useActiveReviewSession } from "@/contexts/ReviewSessionContext";
import type { RemotePeer } from "@/contexts/ReviewSessionContext";

// ─── Floating PiP miniplayer (renders while session is active + navigated away) ─

function MiniVideoTile({
  stream, label, color, muted, videoMuted,
}: {
  stream: MediaStream | null; label: string; color: string;
  muted?: boolean; videoMuted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (stream && !videoMuted) { if (el.srcObject !== stream) el.srcObject = stream; }
    else el.srcObject = null;
  }, [stream, videoMuted]);

  const initials = label.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-[#0d0d16] flex items-center justify-center">
      {!videoMuted && stream
        ? <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
        : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>{initials}</div>
      }
      <div className="absolute bottom-1 left-1.5 text-[9px] text-white/60 bg-black/50 px-1.5 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[80%]">
        {label}
      </div>
    </div>
  );
}

function FloatingMiniplayer() {
  const {
    meta, leave,
    localDisplay, peers,
    audioMuted, videoMuted, screenSharing,
    toggleAudio, toggleVideo, toggleScreenShare,
    connected,
    myUserName,
  } = useActiveReviewSession();

  const router    = useRouter();
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Don't show the miniplayer when we're already on the full review page
  if (!meta) return null;
  if (pathname?.startsWith("/dashboard/review/")) return null;

  const peerList: RemotePeer[] = Array.from(peers.values());

  // Open the full session page
  const handleExpand = () => {
    router.push(
      `/dashboard/review/${meta.sessionId}?repoId=${meta.repoId}&prId=${meta.prId}&prNum=${meta.prNum}&repoName=${meta.repoName}&ownerId=${meta.ownerId}`
    );
  };

  if (collapsed) {
    return (
      <div
        className="fixed bottom-5 right-5 z-[9999] cursor-pointer"
        onClick={() => setCollapsed(false)}
        title="Expand session"
      >
        <div className="w-12 h-12 rounded-full bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center shadow-2xl animate-pulse">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M15 10l4.55-2.56A1 1 0 0121 8.38v7.24a1 1 0 01-1.45.88L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] w-72 bg-[#0a0a14]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.04] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
          <span className="text-white/60 text-xs font-medium truncate max-w-[140px]">
            {meta.repoName ? `${meta.repoName} #${meta.prNum}` : "Review Session"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExpand}
            title="Open full session"
            className="w-6 h-6 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M10 2h4v4M14 2L8 8M6 14H2v-4M2 14l6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => setCollapsed(true)}
            title="Minimise"
            className="w-6 h-6 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 8h10" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={leave}
            title="Leave session"
            className="w-6 h-6 flex items-center justify-center rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.12] transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Video grid: local + up to 2 peers */}
      <div className="p-2 grid grid-cols-2 gap-1.5" style={{ aspectRatio: "2/1" }}>
        <MiniVideoTile
          stream={localDisplay}
          label={myUserName || "You"}
          color="#6366f1"
          muted={true}
          videoMuted={!screenSharing && videoMuted}
        />
        {peerList.length === 0 ? (
          <div className="rounded-lg bg-[#0d0d16] border border-white/[0.05] flex items-center justify-center">
            <span className="text-white/20 text-[10px] text-center px-2">Waiting for others…</span>
          </div>
        ) : (
          <MiniVideoTile
            stream={peerList[0].stream}
            label={peerList[0].userName}
            color={peerList[0].color}
            muted={false}
            videoMuted={peerList[0].videoMuted}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-white/[0.06]">
        {/* Mic */}
        <button
          onClick={toggleAudio}
          title={audioMuted ? "Unmute" : "Mute"}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all border ${audioMuted ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/[0.08] border-white/15 text-white/70"}`}
        >
          {audioMuted
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" strokeLinecap="round"/></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeLinecap="round"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3" strokeLinecap="round"/></svg>
          }
        </button>

        {/* Camera */}
        <button
          onClick={toggleVideo}
          title={videoMuted ? "Enable camera" : "Disable camera"}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all border ${videoMuted ? "bg-white/[0.04] border-white/10 text-white/30" : "bg-white/[0.08] border-white/15 text-white/70"}`}
        >
          {videoMuted
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="2" y1="2" x2="22" y2="22"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 10l4.55-2.56A1 1 0 0121 8.38v7.24a1 1 0 01-1.45.88L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
        </button>

        {/* Screen share */}
        <button
          onClick={toggleScreenShare}
          title={screenSharing ? "Stop sharing" : "Share screen"}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all border ${screenSharing ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-white/[0.04] border-white/10 text-white/30 hover:text-white/60"}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" strokeLinecap="round"/></svg>
        </button>

        {/* Leave */}
        <button
          onClick={leave}
          title="Leave session"
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all ml-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Inner layout (uses context) ──────────────────────────────────────────────

function DashboardInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let token: string | null = null;
    try { token = localStorage.getItem("devflow_token"); } catch { /**/ }
    if (!token) router.replace("/login");
    else setIsChecking(false);
  }, [router]);

  const { user, stats, notifications, unreadCount, markAllRead, markRead } = useDashboard();
  const openPRs = (stats.find((s) => s.icon === "pr")?.value as number) ?? 0;

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-[#71717a] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0d0d0f] overflow-hidden">
      <Sidebar user={user} openPRs={openPRs} openIssues={0} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAll={markAllRead}
          onMarkRead={markRead}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      {/* Floating PiP miniplayer — rendered outside main scroll area */}
      <FloatingMiniplayer />
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReviewSessionProvider>
      <DashboardInner>{children}</DashboardInner>
    </ReviewSessionProvider>
  );
}
