
"use client";

/**
 * ReviewSessionContext
 * -------------------
 * Lives at dashboard-layout level so the WebRTC session survives navigation.
 * Any page can call useActiveReviewSession() to read/control the session.
 * The dashboard layout renders the floating PiP miniplayer when a session is active.
 */

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const WS_BASE  = API_BASE.replace(/^http/, "ws");

function getToken() {
  try { return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null; }
  catch { return null; }
}

function parseJwt(): { userId: string; userName: string } {
  try {
    const token = getToken();
    if (!token) return { userId: "", userName: "You" };
    const p = JSON.parse(atob(token.split(".")[1]));
    return { userId: p.userId ?? p.sub ?? "", userName: p.username ?? p.name ?? "You" };
  } catch { return { userId: "", userName: "You" }; }
}

function colorFromId(id: string): string {
  const palette = ["#6366f1","#22d3ee","#f43f5e","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

const ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ─── Peer state ───────────────────────────────────────────────────────────────

export interface RemotePeer {
  userId:     string;
  userName:   string;
  color:      string;
  stream:     MediaStream | null;
  audioMuted: boolean;
  videoMuted: boolean;
}

// ─── Session meta (survives navigation) ──────────────────────────────────────

export interface SessionMeta {
  sessionId: string;
  prId:      string;
  repoId:    string;
  prNum:     string;
  repoName:  string;
  /** userId of whoever created the session — only they can end it for everyone */
  ownerId:   string;
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface ReviewCtx {
  /** Currently active session meta, or null when not in a call */
  meta:           SessionMeta | null;
  /** Join a new session — starts media + WS */
  join:           (m: SessionMeta) => void;
  /** Leave the session — cleans up everything */
  leave:          () => void;
  /** End the session for all participants (owner only) — calls REST + WS broadcast */
  endSession:     () => Promise<void>;
  /** True when the current user is the session owner */
  isOwner:        boolean;

  localStream:    MediaStream | null;
  /** What the local tile renders — camera OR screen share */
  localDisplay:   MediaStream | null;
  /** Raw camera stream — used for PiP overlay when screen sharing */
  cameraStream:   MediaStream | null;
  peers:          Map<string, RemotePeer>;
  connected:      boolean;
  audioMuted:     boolean;
  videoMuted:     boolean;
  screenSharing:  boolean;
  error:          string | null;

  toggleAudio:       () => void;
  toggleVideo:       () => void;
  toggleScreenShare: () => Promise<void>;

  myUserId:   string;
  myUserName: string;
}

const Ctx = createContext<ReviewCtx | null>(null);

export function useActiveReviewSession(): ReviewCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useActiveReviewSession must be used inside ReviewSessionProvider");
  return c;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ReviewSessionProvider({ children }: { children: ReactNode }) {
  const identity     = useRef(parseJwt());
  const myUserId     = identity.current.userId;
  const myUserName   = identity.current.userName;

  const [meta,         setMeta]         = useState<SessionMeta | null>(null);
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [localDisplay, setLocalDisplay] = useState<MediaStream | null>(null);
  const [peers,        setPeers]        = useState<Map<string, RemotePeer>>(new Map());
  const [connected,    setConnected]    = useState(false);
  const [audioMuted,   setAudioMuted]   = useState(true);
  const [videoMuted,   setVideoMuted]   = useState(true);
  const [screenSharing,setScreenSharing]= useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const wsRef          = useRef<WebSocket | null>(null);
  const localRef       = useRef<MediaStream | null>(null);
  const screenRef      = useRef<MediaStream | null>(null);
  const pcsRef         = useRef<Map<string, RTCPeerConnection>>(new Map());
  const sendRef        = useRef<(m: object) => void>(() => {});
  const audioMutedRef  = useRef(true);
  const videoMutedRef  = useRef(true);
  // Guard re-entrant negotiation per peer
  const makingOfferRef = useRef<Set<string>>(new Set());
  // Buffer ICE candidates that arrive before setRemoteDescription completes (common on same-machine/LAN)
  const iceBufRef      = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // ── helpers ────────────────────────────────────────────────────────────────

  const sendSignal = useCallback((m: object) => sendRef.current(m), []);

  const broadcastMute = useCallback(() => {
    sendSignal({ type: "mute-state", audioMuted: audioMutedRef.current, videoMuted: videoMutedRef.current });
  }, [sendSignal]);

  const closePC = useCallback((uid: string) => {
    const pc = pcsRef.current.get(uid);
    if (pc) { try { pc.close(); } catch { /**/ } }
    pcsRef.current.delete(uid);
    makingOfferRef.current.delete(uid);
    iceBufRef.current.delete(uid);
  }, []);

  /** Flush buffered ICE candidates after remote SDP is set */
  const flushIce = useCallback(async (uid: string) => {
    const pc  = pcsRef.current.get(uid);
    const buf = iceBufRef.current.get(uid);
    if (!pc || !buf) return;
    iceBufRef.current.delete(uid);
    for (const c of buf) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /**/ }
    }
  }, []);

  /** Create (or recreate) a PeerConnection to a remote peer */
  const createPC = useCallback((uid: string, uname: string): RTCPeerConnection => {
    closePC(uid);

    const pc = new RTCPeerConnection({ iceServers: ICE });

    // Add all local tracks — even if disabled/muted
    const src = localRef.current;
    if (src) {
      src.getTracks().forEach(t => pc.addTrack(t, src));
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal({ type: "ice-candidate", to: uid, payload: candidate.toJSON() });
    };

    // NOTE: We do NOT set onnegotiationneeded here.
    // Offers are sent explicitly in the "joined" handler and via renegotiation after screen share.
    // Using onnegotiationneeded + manual offers simultaneously causes a double-setLocalDescription race.

    pc.ontrack = ({ streams, track }) => {
      const stream = streams[0] ?? new MediaStream([track]);
      setPeers(prev => {
        const n   = new Map(prev);
        const old = n.get(uid);
        n.set(uid, {
          userId:     uid,
          userName:   old?.userName  ?? uname,
          color:      old?.color     ?? colorFromId(uid),
          stream,
          audioMuted: old?.audioMuted ?? false,
          videoMuted: old?.videoMuted ?? false,
        });
        return n;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pcsRef.current.delete(uid);
        setPeers(prev => { const n = new Map(prev); n.delete(uid); return n; });
      }
    };

    pcsRef.current.set(uid, pc);

    // Pre-register so tile appears immediately
    setPeers(prev => {
      if (prev.has(uid)) return prev;
      const n = new Map(prev);
      n.set(uid, { userId: uid, userName: uname, color: colorFromId(uid), stream: null, audioMuted: false, videoMuted: false });
      return n;
    });

    return pc;
  }, [closePC, sendSignal]);

  // ── Start local media ──────────────────────────────────────────────────────

  const startMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      s.getAudioTracks().forEach(t => { t.enabled = false; });
      s.getVideoTracks().forEach(t => { t.enabled = false; });
      localRef.current = s;
      setLocalStream(s);
      setLocalDisplay(s);
      return s;
    } catch (e) {
      const msg = "Camera/mic unavailable: " + (e instanceof Error ? e.message : String(e));
      setError(msg);
      const empty = new MediaStream();
      localRef.current = empty;
      setLocalStream(empty);
      setLocalDisplay(empty);
      return empty;
    }
  }, []);

  // ── WebSocket message pump ─────────────────────────────────────────────────

  const onMessage = useCallback(async (raw: string) => {
    let msg: {
      type: string; from: string; fromName: string; to?: string;
      payload?: RTCSessionDescriptionInit | RTCIceCandidateInit;
      participants?: Array<{ userId: string; userName: string; color: string; joinedAt: string }>;
      audioMuted?: boolean; videoMuted?: boolean;
    };
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      // We just connected — send offers to every existing participant
      case "joined": {
        for (const p of (msg.participants ?? [])) {
          if (p.userId === myUserId) continue;
          const pc = createPC(p.userId, p.userName);
          // onnegotiationneeded fires after addTrack inside createPC → sends offer automatically
          // But we force it here to be safe
          try {
            makingOfferRef.current.add(p.userId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal({ type: "offer", to: p.userId, payload: pc.localDescription });
          } catch (err) {
            console.warn("initial offer error", err);
          } finally {
            makingOfferRef.current.delete(p.userId);
          }
        }
        broadcastMute();
        break;
      }

      case "peer-joined": {
        if (msg.from === myUserId) break;
        // Pre-register tile. They will send us an offer soon.
        setPeers(prev => {
          if (prev.has(msg.from)) return prev;
          const n = new Map(prev);
          n.set(msg.from, { userId: msg.from, userName: msg.fromName, color: colorFromId(msg.from), stream: null, audioMuted: false, videoMuted: false });
          return n;
        });
        break;
      }

      // Incoming offer — we are the answerer
      case "offer": {
        if (!msg.payload || msg.from === myUserId) break;
        // Perfect negotiation: if we're also making an offer, the polite peer backs off.
        // We are always polite for incoming offers (answerer role).
        let pc = pcsRef.current.get(msg.from);
        if (!pc) pc = createPC(msg.from, msg.fromName ?? "");

        const offerCollision = makingOfferRef.current.has(msg.from) || pc.signalingState !== "stable";
        if (offerCollision) {
          // We're the polite peer — rollback our own offer and accept theirs
          try {
            await pc.setLocalDescription({ type: "rollback" });
          } catch { /* may not be needed in stable state */ }
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ type: "answer", to: msg.from, payload: pc.localDescription });
          // Flush any ICE candidates that arrived before remote SDP was ready
          await flushIce(msg.from);
          broadcastMute();
        } catch (err) {
          console.warn("offer/answer error", err);
        }
        break;
      }

      case "answer": {
        if (!msg.payload || msg.from === myUserId) break;
        const pc = pcsRef.current.get(msg.from);
        if (pc && pc.signalingState === "have-local-offer") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit));
            // Flush buffered ICE candidates
            await flushIce(msg.from);
          } catch (err) { console.warn("answer error", err); }
        }
        break;
      }

      case "ice-candidate": {
        if (!msg.payload || msg.from === myUserId) break;
        const pc = pcsRef.current.get(msg.from);
        if (!pc) break;
        // If no remote description yet, buffer the candidate
        if (!pc.remoteDescription) {
          const buf = iceBufRef.current.get(msg.from) ?? [];
          buf.push(msg.payload as RTCIceCandidateInit);
          iceBufRef.current.set(msg.from, buf);
        } else {
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.payload as RTCIceCandidateInit)); } catch { /**/ }
        }
        break;
      }

      case "peer-left": {
        closePC(msg.from);
        setPeers(prev => { const n = new Map(prev); n.delete(msg.from); return n; });
        break;
      }

      // Session owner ended the session for everyone
      case "session-ended": {
        // Trigger leave without navigating — page.tsx listens to meta becoming null
        leave();
        break;
      }

      case "mute-state": {
        if (msg.from === myUserId) break;
        setPeers(prev => {
          const old = prev.get(msg.from);
          if (!old) return prev;
          const n = new Map(prev);
          n.set(msg.from, {
            ...old,
            audioMuted: msg.audioMuted ?? old.audioMuted,
            videoMuted: msg.videoMuted ?? old.videoMuted,
          });
          return n;
        });
        break;
      }
    }
  }, [myUserId, createPC, closePC, flushIce, sendSignal, broadcastMute]);

  // ── join() — start media + open WS ────────────────────────────────────────

  const join = useCallback(async (m: SessionMeta) => {
    // Reset state
    setMeta(m);
    setError(null);
    audioMutedRef.current = true;
    videoMutedRef.current = true;
    setAudioMuted(true);
    setVideoMuted(true);
    setScreenSharing(false);
    setPeers(new Map());
    setConnected(false);
    iceBufRef.current.clear();

    await startMedia();

    const token = getToken();
    const wsUrl = `${WS_BASE}/api/v1/ws/review/${m.sessionId}${token ? `?token=${token}` : ""}`;
    const ws    = new WebSocket(wsUrl);
    wsRef.current = ws;

    const send = (msg: object) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    };
    sendRef.current = send;

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setError("WebSocket error");
    ws.onmessage = (evt) => { onMessage(evt.data); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMedia, onMessage]);

  // ── leave() ────────────────────────────────────────────────────────────────

  const leave = useCallback(() => {
    pcsRef.current.forEach(pc => { try { pc.close(); } catch { /**/ } });
    pcsRef.current.clear();
    makingOfferRef.current.clear();
    localRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current = null;
    wsRef.current?.close();
    sendRef.current = () => {};
    localRef.current = null;
    setMeta(null);
    setLocalStream(null);
    setLocalDisplay(null);
    setPeers(new Map());
    setConnected(false);
    setScreenSharing(false);
    audioMutedRef.current = true;
    videoMutedRef.current = true;
    setAudioMuted(true);
    setVideoMuted(true);
    setError(null);
  }, []);

  // ── endSession() — owner-only: REST + WS broadcast → then leave ──────────
  // Defined AFTER leave() so the closure captures the stable leave reference.

  const endSession = useCallback(async () => {
    const m = meta;
    if (!m) return;
    const token = getToken();
    try {
      await fetch(
        `${API_BASE}/api/v1/repos/${m.repoId}/pulls/${m.prId}/review-sessions/${m.sessionId}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
    } catch { /* WS broadcast will still kick everyone out */ }
    leave();
  }, [meta, leave]);

  // Cleanup on unmount
  useEffect(() => () => { leave(); }, [leave]);

  // ── toggleAudio ────────────────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const muted = !track.enabled;
    audioMutedRef.current = muted;
    setAudioMuted(muted);
    sendSignal({ type: "mute-state", audioMuted: muted, videoMuted: videoMutedRef.current });
  }, [sendSignal]);

  // ── toggleVideo ────────────────────────────────────────────────────────────

  const toggleVideo = useCallback(() => {
    const track = localRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const muted = !track.enabled;
    videoMutedRef.current = muted;
    setVideoMuted(muted);
    // Only update localDisplay when NOT screen sharing.
    // If screen is active, localDisplay stays as the screen stream regardless.
    if (!screenRef.current) {
      setLocalDisplay(muted ? null : localRef.current);
    }
    sendSignal({ type: "mute-state", audioMuted: audioMutedRef.current, videoMuted: muted });
  }, [sendSignal]);

  // ── toggleScreenShare ──────────────────────────────────────────────────────

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      screenRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current = null;
      const camTrack = localRef.current?.getVideoTracks()[0];
      pcsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender && camTrack) sender.replaceTrack(camTrack).catch(() => {});
      });
      // Restore local display to camera (or null if camera muted)
      setLocalDisplay(videoMutedRef.current ? null : localRef.current);
      setScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenRef.current = screen;
        const st = screen.getVideoTracks()[0];

        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(st).catch(() => {});
          else        pc.addTrack(st, screen);
        });

        setLocalDisplay(screen);
        setScreenSharing(true);

        st.onended = () => {
          screenRef.current = null;
          const cam = localRef.current?.getVideoTracks()[0];
          pcsRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === "video");
            if (sender && cam) sender.replaceTrack(cam).catch(() => {});
          });
          setLocalDisplay(videoMutedRef.current ? null : localRef.current);
          setScreenSharing(false);
        };
      } catch { /* user cancelled */ }
    }
  }, [screenSharing]);

  // Cleanup on unmount
  useEffect(() => () => { leave(); }, [leave]);

  const isOwner = !!meta && meta.ownerId === myUserId;

  const value: ReviewCtx = {
    meta, join, leave, endSession, isOwner,
    localStream, localDisplay, cameraStream: localStream, peers, connected,
    audioMuted, videoMuted, screenSharing, error,
    toggleAudio, toggleVideo, toggleScreenShare,
    myUserId, myUserName,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
