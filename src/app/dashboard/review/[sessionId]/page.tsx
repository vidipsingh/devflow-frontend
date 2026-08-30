
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useActiveReviewSession } from "@/contexts/ReviewSessionContext";
import type { RemotePeer } from "@/contexts/ReviewSessionContext";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";

// ─── Video tile ───────────────────────────────────────────────────────────────

function VideoTile({
  stream,
  cameraStream = null,
  label,
  color,
  avatar,
  muted        = false,
  audioMuted   = false,
  videoMuted   = false,
  screenActive = false,
  isLocal      = false,
  large        = false,
  onClick,
}: {
  stream:        MediaStream | null;
  /** Raw camera stream for the PiP overlay when screen sharing (local only) */
  cameraStream?: MediaStream | null;
  label:         string;
  color:         string;
  /** Optional profile photo URL — shown in place of initials when provided */
  avatar?:       string;
  muted?:        boolean;
  audioMuted?:   boolean;
  videoMuted?:   boolean;
  screenActive?: boolean;
  isLocal?:      boolean;
  large?:        boolean;
  onClick?:      () => void;
}) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const cameraRef  = useRef<HTMLVideoElement>(null);

  const showVideo = (!videoMuted || screenActive) && !!stream;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (showVideo) { if (el.srcObject !== stream) el.srcObject = stream; }
    else            el.srcObject = null;
  }, [stream, showVideo]);

  // Wire camera PiP video element to the raw camera stream
  useEffect(() => {
    const el = cameraRef.current;
    if (!el) return;
    if (cameraStream && !videoMuted) { if (el.srcObject !== cameraStream) el.srcObject = cameraStream; }
    else el.srcObject = null;
  }, [cameraStream, videoMuted]);

  const initials = label.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  /** Renders a profile circle — avatar photo if available, otherwise coloured initials */
  function Avatar({ size }: { size: "large" | "small" | "pip" }) {
    const dims = size === "large" ? "w-24 h-24 text-3xl" : size === "small" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
    if (avatar) {
      return (
        <img
          src={avatar}
          alt={label}
          className={`${dims} rounded-full object-cover flex-shrink-0 shadow-lg`}
        />
      );
    }
    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 ${dims}`}
        style={{ background: color }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden bg-[#111118] border border-white/[0.07] aspect-video flex items-center justify-center ${onClick ? "cursor-pointer hover:border-white/20 transition-all" : ""}`}
    >
      {showVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      ) : (
        <Avatar size={large ? "large" : "small"} />
      )}

      {/* GMeet-style camera PiP when screen sharing — always visible (avatar fallback when camera off) */}
      {screenActive && large && (
        <div className="absolute bottom-12 right-3 w-24 h-14 rounded-lg overflow-hidden border-2 border-white/20 shadow-xl bg-[#0d0d16] flex items-center justify-center">
          {!videoMuted && cameraStream ? (
            <video ref={cameraRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <Avatar size="pip" />
          )}
          <div className="absolute bottom-0.5 left-1 text-[8px] text-white/60 truncate">You</div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="text-xs text-white/80 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {isLocal ? (screenActive ? "Your screen" : "You") : label}
        </span>
        {audioMuted && (
          <span className="bg-red-500/80 text-white rounded-full px-1 py-0.5 backdrop-blur-sm flex items-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </div>

      {isLocal && !screenActive && (
        <div className="absolute top-2 right-2 text-[10px] bg-indigo-500/70 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
          You
        </div>
      )}
    </div>
  );
}

// ─── Control button ───────────────────────────────────────────────────────────

function CtrlBtn({ active, danger, onClick, title, children }: {
  active?: boolean; danger?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  const base  = "w-11 h-11 rounded-full flex items-center justify-center text-sm transition-all cursor-pointer border";
  const style = danger
    ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
    : active
    ? "bg-white/[0.12] border-white/20 text-white hover:bg-white/[0.18]"
    : "bg-white/[0.04] border-white/10 text-white/40 hover:bg-white/[0.08] hover:text-white/70";
  return <button className={`${base} ${style}`} onClick={onClick} title={title}>{children}</button>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const MicOnIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeLinecap="round"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 23h8" strokeLinecap="round"/></svg>;
const MicOffIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" strokeLinecap="round"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8" strokeLinecap="round"/></svg>;
const CamOnIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 10l4.55-2.56A1 1 0 0121 8.38v7.24a1 1 0 01-1.45.88L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CamOffIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 16l4.55 2.56A1 1 0 0022 17.62v-7.24a1 1 0 00-1.45-.88L16 12" strokeLinecap="round"/><rect x="2" y="6" width="14" height="12" rx="2"/><line x1="2" y1="2" x2="22" y2="22"/></svg>;
const ScreenIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" strokeLinecap="round"/><path d="M9 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const LeaveIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const searchParams  = useSearchParams();
  const router        = useRouter();

  const repoId   = searchParams.get("repoId")   ?? "";
  const prId     = searchParams.get("prId")     ?? "";
  const prNum    = searchParams.get("prNum")    ?? "";
  const repoName = searchParams.get("repoName") ?? "";

  // Whether the user has clicked "Join" on this page
  const [hasJoined,  setHasJoined]  = useState(false);
  const [ending,     setEnding]     = useState(false);
  const [pinnedIdx,  setPinnedIdx]  = useState<number>(-1);

  const session = useActiveReviewSession();
  const {
    meta, join, leave, endSession, isOwner,
    localDisplay, localStream,
    peers,
    connected,
    audioMuted, videoMuted, screenSharing,
    error,
    toggleAudio, toggleVideo, toggleScreenShare,
    myUserName, myUserId,
  } = session;
  const { user: dashUser } = useDashboard();

  // If this page is the active session, hasJoined = true (handles back-navigation case)
  useEffect(() => {
    if (meta?.sessionId === sessionId) setHasJoined(true);
  }, [meta, sessionId]);

  const peerList: RemotePeer[] = Array.from(peers.values());

  // ── Warn before page unload ──────────────────────────────────────────────────
  useEffect(() => {
    if (!hasJoined) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You are in an active review session. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasJoined]);

  // ownerId comes from the search param (set when the session is created on the PR page)
  const ownerId = searchParams.get("ownerId") ?? myUserId;

  const handleJoin = useCallback(() => {
    join({ sessionId, prId, repoId, prNum, repoName, ownerId });
    setHasJoined(true);
  }, [join, sessionId, prId, repoId, prNum, repoName, ownerId]);

  const handleLeave = useCallback(() => {
    leave();
    setHasJoined(false);
    router.push(
      prNum && repoName
        ? `/dashboard/repositories/${repoName}/pulls/${prNum}`
        : "/dashboard"
    );
  }, [leave, router, prNum, repoName]);

  const handleEndSession = useCallback(async () => {
    setEnding(true);
    await endSession();
    setHasJoined(false);
    setEnding(false);
    router.push(
      prNum && repoName
        ? `/dashboard/repositories/${repoName}/pulls/${prNum}`
        : "/dashboard"
    );
  }, [endSession, router, prNum, repoName]);

  // When a remote "session-ended" message arrives, meta becomes null → navigate away
  useEffect(() => {
    if (hasJoined && !meta) {
      setHasJoined(false);
      router.push(
        prNum && repoName
          ? `/dashboard/repositories/${repoName}/pulls/${prNum}`
          : "/dashboard"
      );
    }
  }, [meta, hasJoined, router, prNum, repoName]);

  // "View PR": keep call alive — just navigate; floating PiP takes over
  const handleViewPR = useCallback(() => {
    const prUrl = `/dashboard/repositories/${repoName}/pulls/${prNum}`;
    router.push(prUrl);
  }, [router, prNum, repoName]);

  // Build tiles
  type Tile = { id: string; label: string; color: string; avatar?: string; stream: MediaStream | null; isLocal: boolean; audioMuted: boolean; videoMuted: boolean; };
  const tiles: Tile[] = [
    { id: "local", label: myUserName || "You", color: "#6366f1", avatar: dashUser?.avatar || undefined, stream: localDisplay, isLocal: true, audioMuted, videoMuted },
    ...peerList.map(p => ({ id: p.userId, label: p.userName, color: p.color, stream: p.stream, isLocal: false, audioMuted: p.audioMuted, videoMuted: p.videoMuted })),
  ];

  const effectiveMain = pinnedIdx >= 0 && pinnedIdx < tiles.length ? pinnedIdx : (tiles.length > 1 ? 1 : 0);
  const mainTile      = tiles[effectiveMain];
  const stripTiles    = tiles.filter((_, i) => i !== effectiveMain);

  // ── Lobby ────────────────────────────────────────────────────────────────────
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {prNum && repoName && (
            <Link
              href={`/dashboard/repositories/${repoName}/pulls/${prNum}`}
              className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to PR
            </Link>
          )}

          <div className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5">
                <path d="M15 10l4.55-2.56A1 1 0 0121 8.38v7.24a1 1 0 01-1.45.88L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div>
              <h1 className="text-xl font-semibold text-white mb-2">PR Review Session</h1>
              <p className="text-white/45 text-sm leading-relaxed">
                Join a live video review session. Share your screen and collaborate in real time.
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/35">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Mic &amp; camera start <strong className="text-white/55">muted</strong> — enable after joining
              </div>
              {prNum && repoName && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  <span className="text-white/40 text-xs">PR</span>
                  <span className="text-white/70 text-xs font-mono">#{prNum}</span>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-white/50 text-xs">{repoName}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 text-amber-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleJoin}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors cursor-pointer"
              >
                Join Session
              </button>
              {prNum && repoName && (
                <Link
                  href={`/dashboard/repositories/${repoName}/pulls/${prNum}`}
                  className="block w-full py-2.5 bg-white/5 hover:bg-white/[0.08] text-white/60 rounded-xl text-sm transition-colors text-center cursor-pointer border border-white/[0.08]"
                >
                  Cancel
                </Link>
              )}
            </div>

            <p className="text-white/20 text-xs font-mono">{sessionId?.slice(0, 8)}…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Active conference ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080810] flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.05] bg-[#0a0a12] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
              <path d="M15 10l4.55-2.56A1 1 0 0121 8.38v7.24a1 1 0 01-1.45.88L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm font-medium">PR Review</span>
              {prNum && <span className="text-white/30 text-xs font-mono">#{prNum}</span>}
              {repoName && <span className="text-white/25 text-xs">· {repoName}</span>}
              {screenSharing && (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sharing screen
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-white/20"}`} />
              <span className="text-white/30 text-[11px]">
                {connected ? `${tiles.length} participant${tiles.length !== 1 ? "s" : ""}` : "Connecting…"}
              </span>
            </div>
          </div>
        </div>

        {/* View PR — session stays alive via the floating miniplayer */}
        {prNum && repoName && (
          <button
            onClick={handleViewPR}
            title="Navigate to PR — session stays alive in the miniplayer"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-all cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="4.5" cy="4.5" r="1.5" strokeWidth="1.2"/><circle cx="4.5" cy="11.5" r="1.5" strokeWidth="1.2"/><circle cx="11.5" cy="4.5" r="1.5" strokeWidth="1.2"/>
              <path d="M4.5 6v4M11.5 6v1a3 3 0 01-3 3H7" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            View PR #{prNum}
          </button>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Main tile */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
          {error && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 text-amber-400 text-sm">
              {error}
            </div>
          )}
          <div className="w-full max-w-4xl">
            <VideoTile
              stream={mainTile.stream}
              cameraStream={mainTile.isLocal ? localStream : null}
              label={mainTile.label}
              color={mainTile.color}
              avatar={mainTile.avatar}
              muted={mainTile.isLocal}
              audioMuted={mainTile.audioMuted}
              videoMuted={mainTile.videoMuted}
              screenActive={mainTile.isLocal && screenSharing}
              isLocal={mainTile.isLocal}
              large={true}
            />
          </div>
        </div>

        {/* Strip */}
        {stripTiles.length > 0 && (
          <div className="flex-shrink-0 px-4 pb-3">
            <div className="flex items-center gap-2 justify-center flex-wrap">
              {stripTiles.map((tile) => {
                const origIdx = tiles.findIndex(t => t.id === tile.id);
                return (
                  <div key={tile.id} className="w-36 flex-shrink-0" onClick={() => setPinnedIdx(origIdx)}>
                    <VideoTile
                      stream={tile.stream}
                      label={tile.label}
                      color={tile.color}
                      muted={tile.isLocal}
                      audioMuted={tile.audioMuted}
                      videoMuted={tile.videoMuted}
                      screenActive={tile.isLocal && screenSharing}
                      isLocal={tile.isLocal}
                      large={false}
                      onClick={() => setPinnedIdx(origIdx)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Waiting */}
        {peerList.length === 0 && (
          <div className="flex-shrink-0 flex items-center justify-center py-3 gap-2 text-white/20 text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" strokeLinecap="round"/>
            </svg>
            Waiting for others to join…
          </div>
        )}

        {/* Controls */}
        <div className="flex-shrink-0 flex items-center justify-center gap-3 px-5 py-4 border-t border-white/[0.05] bg-[#0a0a12]">
          <CtrlBtn active={!audioMuted} onClick={toggleAudio} title={audioMuted ? "Unmute mic" : "Mute mic"}>
            {audioMuted ? <MicOffIcon /> : <MicOnIcon />}
          </CtrlBtn>
          <CtrlBtn active={!videoMuted} onClick={toggleVideo} title={videoMuted ? "Enable camera" : "Disable camera"}>
            {videoMuted ? <CamOffIcon /> : <CamOnIcon />}
          </CtrlBtn>
          <CtrlBtn active={screenSharing} onClick={toggleScreenShare} title={screenSharing ? "Stop sharing" : "Share screen"}>
            <ScreenIcon />
          </CtrlBtn>
          <div className="w-px h-6 bg-white/[0.08] mx-1" />
          <CtrlBtn danger onClick={handleLeave} title="Leave session">
            <LeaveIcon />
          </CtrlBtn>
          {isOwner && (
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="px-4 h-11 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              {ending ? "Ending…" : "End for All"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
