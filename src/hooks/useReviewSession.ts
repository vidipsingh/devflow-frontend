"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const WS_BASE  = API_BASE.replace(/^http/, "ws");

function getToken() {
  try { return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null; }
  catch { return null; }
}
function authHeaders(): HeadersInit {
  const t = getToken();
  return t
    ? { "Content-Type": "application/json", Authorization: `Bearer ${t}` }
    : { "Content-Type": "application/json" };
}

/** Parse userId + userName from JWT synchronously — avoids useEffect race */
function parseJwt(): { userId: string; userName: string } {
  try {
    const token = getToken();
    if (!token) return { userId: "", userName: "You" };
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      userId:   payload.userId   ?? payload.sub  ?? "",
      userName: payload.username ?? payload.name ?? "You",
    };
  } catch {
    return { userId: "", userName: "You" };
  }
}

/** Deterministic color from userId string */
function colorFromId(id: string): string {
  const palette = ["#6366f1","#22d3ee","#f43f5e","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewParticipant {
  userId:   string;
  userName: string;
  color:    string;
  joinedAt: string;
}

export interface ReviewSession {
  id:           string;
  prId:         string;
  repoId:       string;
  ownerId:      string;
  ownerName:    string;
  status:       "waiting" | "active" | "ended";
  participants: ReviewParticipant[];
  createdAt:    string;
  endedAt?:     string;
}

// ─── REST API hook ────────────────────────────────────────────────────────

export function useReviewSessions(repoId: string, prId: string) {
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const list = useCallback(async () => {
    if (!repoId || !prId) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch(
        `${API_BASE}/api/v1/repos/${repoId}/pulls/${prId}/review-sessions`,
        { headers: authHeaders() }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setSessions(json.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally { setLoading(false); }
  }, [repoId, prId]);

  const create = useCallback(async (): Promise<ReviewSession | null> => {
    try {
      const res  = await fetch(
        `${API_BASE}/api/v1/repos/${repoId}/pulls/${prId}/review-sessions`,
        { method: "POST", headers: authHeaders() }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create");
      const sess: ReviewSession = json.data;
      setSessions(prev => [sess, ...prev]);
      return sess;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    }
  }, [repoId, prId]);

  const end = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/repos/${repoId}/pulls/${prId}/review-sessions/${sessionId}/end`,
        { method: "POST", headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to end session");
      setSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, status: "ended" as const } : s)
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [repoId, prId]);

  useEffect(() => { list(); }, [list]);
  return { sessions, loading, error, list, create, end };
}

// ─── Signaling message types ──────────────────────────────────────────────────

interface SignalMsg {
  type:         string;
  from:         string;
  fromName:     string;
  to?:          string;
  payload?:     RTCSessionDescriptionInit | RTCIceCandidateInit;
  participants?: ReviewParticipant[];
  /** mute-state broadcast fields */
  audioMuted?:  boolean;
  videoMuted?:  boolean;
}

// ─── Remote peer ──────────────────────────────────────────────────────────────

export interface RemotePeer {
  userId:     string;
  userName:   string;
  color:      string;
  stream:     MediaStream | null;
  audioMuted: boolean;
  videoMuted: boolean;
}

interface UseReviewConferenceOptions {
  sessionId: string;
  enabled:   boolean;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ─── Conference hook ──────────────────────────────────────────────────────────

export function useReviewConference({ sessionId, enabled }: UseReviewConferenceOptions) {
  // Parse identity synchronously so it is ready before any async WS message arrives
  const identity      = useRef(parseJwt());
  const myUserId      = identity.current.userId;
  const myUserName    = identity.current.userName;

  const [localStream,   setLocalStream]   = useState<MediaStream | null>(null);
  const [localDisplay,  setLocalDisplay]  = useState<MediaStream | null>(null);
  const [peers,         setPeers]         = useState<Map<string, RemotePeer>>(new Map());
  const [connected,     setConnected]     = useState(false);
  const [audioMuted,    setAudioMuted]    = useState(true);
  const [videoMuted,    setVideoMuted]    = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const wsRef     = useRef<WebSocket | null>(null);
  const localRef  = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const pcsRef    = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Keep a ref to the send function so callbacks created before WS opens can still call it
  const sendRef = useRef<(msg: object) => void>(() => {});

  // Keep current mute state in refs
  const audioMutedRef = useRef(true);
  const videoMutedRef = useRef(true);

  // ── Broadcast own mute state to all peers ─────────────────────────────────
  const broadcastMuteState = useCallback(() => {
    sendRef.current({
      type:       "mute-state",
      audioMuted: audioMutedRef.current,
      videoMuted: videoMutedRef.current,
    });
  }, []);

  // ── Acquire local camera + mic (both muted by default) ────────────────────
  const startLocalMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Disable both tracks immediately — user unmutes intentionally
      stream.getAudioTracks().forEach(t => { t.enabled = false; });
      stream.getVideoTracks().forEach(t => { t.enabled = false; });
      localRef.current = stream;
      setLocalStream(stream);
      setLocalDisplay(stream);
      return stream;
    } catch (e: unknown) {
      const errMsg = "Camera/mic unavailable: " + (e instanceof Error ? e.message : String(e));
      setError(errMsg);
      console.error(errMsg, e);
      const empty = new MediaStream();
      localRef.current = empty;
      setLocalStream(empty);
      setLocalDisplay(empty);
      return empty;
    }
  }, []);

  // ── Close + remove a stale PeerConnection ─────────────────────────────────
  const closePC = useCallback((remoteUserId: string) => {
    const old = pcsRef.current.get(remoteUserId);
    if (old) { 
      try { 
        old.close(); 
        console.log(`Closed PC for ${remoteUserId}`);
      } catch (e) { 
        console.warn(`Error closing PC for ${remoteUserId}:`, e);
      } 
    }
    pcsRef.current.delete(remoteUserId);
  }, []);

  // ── Create a fresh PeerConnection for a remote peer ───────────────────────
  const createPC = useCallback((remoteUserId: string, remoteName: string): RTCPeerConnection => {
    // Always close stale PC first
    closePC(remoteUserId);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    console.log(`Created PC for ${remoteUserId} (${remoteName})`);

    // Add all local tracks (camera + mic, currently disabled but present)
    const src = localRef.current;
    if (src) {
      src.getTracks().forEach(track => {
        console.log(`Adding track to PC for ${remoteUserId}:`, track.kind);
        pc.addTrack(track, src);
      });
    } else {
      console.warn(`No local stream available when creating PC for ${remoteUserId}`);
    }

    // If already screen sharing, replace video sender with screen track
    if (screenRef.current) {
      const screenTrack = screenRef.current.getVideoTracks()[0];
      if (screenTrack) {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack)
            .then(() => console.log(`Replaced video track with screen for ${remoteUserId}`))
            .catch(err => console.warn(`Failed to replace track for ${remoteUserId}:`, err));
        }
      }
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log(`ICE candidate for ${remoteUserId}:`, candidate.candidate?.substring(0, 50));
        sendRef.current({ type: "ice-candidate", to: remoteUserId, payload: candidate.toJSON() });
      }
    };

    pc.ontrack = (evt) => {
      console.log(`Received track from ${remoteUserId}:`, evt.track.kind);
      const stream = evt.streams[0] ?? new MediaStream([evt.track]);
      setPeers(prev => {
        const next     = new Map(prev);
        const existing = next.get(remoteUserId);
        next.set(remoteUserId, {
          userId:     remoteUserId,
          userName:   existing?.userName  ?? remoteName,
          color:      existing?.color     ?? colorFromId(remoteUserId),
          stream,
          audioMuted: existing?.audioMuted ?? false,
          videoMuted: existing?.videoMuted ?? false,
        });
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      console.log(`PC connection state change for ${remoteUserId}: ${s}`);
      if (s === "failed" || s === "closed") {
        pcsRef.current.delete(remoteUserId);
        setPeers(prev => { const n = new Map(prev); n.delete(remoteUserId); return n; });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${remoteUserId}: ${pc.iceConnectionState}`);
    };

    pc.onsignalingstatechange = () => {
      console.log(`Signaling state for ${remoteUserId}: ${pc.signalingState}`);
    };

    pcsRef.current.set(remoteUserId, pc);

    // Pre-register peer so UI shows avatar tile immediately
    setPeers(prev => {
      const n = new Map(prev);
      if (!n.has(remoteUserId)) {
        n.set(remoteUserId, {
          userId: remoteUserId, userName: remoteName,
          color:  colorFromId(remoteUserId),
          stream: null,
          audioMuted: false, videoMuted: false,
        });
      }
      return n;
    });

    return pc;
  }, [closePC]);

  // ── Main WS + negotiation effect ──────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !sessionId) return;

    let cancelled = false;

    const run = async () => {
      const stream = await startLocalMedia();
      if (cancelled) return;

      const token = getToken();
      const wsUrl = `${WS_BASE}/api/v1/ws/review/${sessionId}${token ? `?token=${token}` : ""}`;
      console.log(`Connecting to WebSocket: ${wsUrl.replace(/\?.*/, '?...')}`);
      
      const ws    = new WebSocket(wsUrl);
      wsRef.current = ws;

      const send = (msg: object) => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log(`Sending message:`, msg);
          ws.send(JSON.stringify(msg));
        } else {
          console.warn(`WebSocket not open, skipping message:`, msg);
        }
      };
      sendRef.current = send;

      ws.onopen  = () => { 
        if (!cancelled) {
          console.log('WebSocket connected');
          setConnected(true);
        }
      };
      
      ws.onclose = () => { 
        if (!cancelled) {
          console.log('WebSocket closed');
          setConnected(false);
        }
      };
      
      ws.onerror = (evt) => { 
        if (!cancelled) {
          console.error('WebSocket error:', evt);
          setError("WebSocket connection error"); 
        }
      };

      ws.onmessage = async (evt) => {
        if (cancelled) return;
        let msg: SignalMsg;
        try { msg = JSON.parse(evt.data); } catch (e) {
          console.warn('Failed to parse WebSocket message:', evt.data);
          return;
        }

        console.log(`Received message type: ${msg.type}, from: ${msg.from}`);

        // Never process our own echoed messages (except mute-state which should be from others)
        if (msg.from === myUserId && msg.type !== "mute-state") return;

        switch (msg.type) {

          // We just joined — server gives us the current participant list.
          // We (the newcomer) create the offer toward every existing peer.
          case "joined": {
            console.log(`Joined event, participants:`, msg.participants);
            for (const p of (msg.participants ?? [])) {
              if (p.userId === myUserId) continue;
              console.log(`Creating offer for peer: ${p.userId} (${p.userName})`);
              const pc    = createPC(p.userId, p.userName);
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                send({ type: "offer", to: p.userId, payload: offer });
                console.log(`Sent offer to ${p.userId}`);
              } catch (err) {
                console.error(`Error creating/sending offer to ${p.userId}:`, err);
              }
            }
            // Broadcast our own mute state so existing peers know we're muted
            broadcastMuteState();
            break;
          }

          // An existing peer just joined — they will send us an offer shortly.
          // Pre-register tile so it shows up immediately.
          case "peer-joined": {
            if (msg.from === myUserId) break;
            console.log(`Peer joined: ${msg.from} (${msg.fromName})`);
            setPeers(prev => {
              if (prev.has(msg.from)) return prev;
              const n = new Map(prev);
              n.set(msg.from, {
                userId: msg.from, userName: msg.fromName,
                color:  colorFromId(msg.from),
                stream: null, audioMuted: false, videoMuted: false,
              });
              return n;
            });
            break;
          }

          // Received SDP offer from a peer — answer it
          case "offer": {
            if (!msg.payload) {
              console.warn('Received offer without payload');
              break;
            }
            console.log(`Received offer from ${msg.from}`);
            const pc = createPC(msg.from, msg.fromName);
            
            try {
              // Guard against bad signaling state
              if (pc.signalingState !== "stable") {
                console.log(`PC signalingState is ${pc.signalingState}, rolling back`);
                try {
                  await pc.setLocalDescription({ type: "rollback" });
                } catch (err) {
                  console.warn('Rollback failed:', err);
                }
              }

              await pc.setRemoteDescription(new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              send({ type: "answer", to: msg.from, payload: answer });
              console.log(`Sent answer to ${msg.from}`);
              
              // After answering, broadcast our own mute state to this new peer
              broadcastMuteState();
            } catch (err) {
              console.error("offer handling error:", err);
              setError(`Failed to handle offer: ${err instanceof Error ? err.message : String(err)}`);
            }
            break;
          }

          // Received SDP answer from a peer
          case "answer": {
            if (!msg.payload) {
              console.warn('Received answer without payload');
              break;
            }
            console.log(`Received answer from ${msg.from}`);
            const pc = pcsRef.current.get(msg.from);
            if (pc && pc.signalingState === "have-local-offer") {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit));
                console.log(`Set remote description for ${msg.from}`);
              } catch (err) {
                console.error("answer handling error:", err);
              }
            } else {
              console.warn(`Received answer from ${msg.from} but PC state is ${pc?.signalingState}`);
            }
            break;
          }

          // ICE candidate
          case "ice-candidate": {
            if (!msg.payload) break;
            const pc = pcsRef.current.get(msg.from);
            if (pc && pc.remoteDescription) {
              try { 
                await pc.addIceCandidate(new RTCIceCandidate(msg.payload as RTCIceCandidateInit));
                console.log(`Added ICE candidate from ${msg.from}`);
              }
              catch (err) { 
                console.warn(`Failed to add ICE candidate from ${msg.from}:`, err);
              }
            } else {
              console.log(`Ignoring ICE candidate from ${msg.from} (no PC or remoteDescription)`);
            }
            break;
          }

          // A peer left
          case "peer-left": {
            console.log(`Peer left: ${msg.from}`);
            closePC(msg.from);
            setPeers(prev => { const n = new Map(prev); n.delete(msg.from); return n; });
            break;
          }

          // Remote peer broadcast their mute state
          case "mute-state": {
            if (msg.from === myUserId) break;
            console.log(`Mute state from ${msg.from}: audio=${msg.audioMuted}, video=${msg.videoMuted}`);
            setPeers(prev => {
              const existing = prev.get(msg.from);
              if (!existing) {
                console.warn(`Received mute state from unknown peer ${msg.from}`);
                return prev;
              }
              const n = new Map(prev);
              n.set(msg.from, {
                ...existing,
                audioMuted: msg.audioMuted ?? existing.audioMuted,
                videoMuted: msg.videoMuted ?? existing.videoMuted,
              });
              return n;
            });
            break;
          }

          default:
            console.log(`Unknown message type: ${msg.type}`);
        }
      };
    };

    run().catch(err => {
      console.error('Error in conference setup:', err);
      setError(`Setup error: ${err instanceof Error ? err.message : String(err)}`);
    });

    return () => {
      cancelled = true;
      pcsRef.current.forEach(pc => { try { pc.close(); } catch { /**/ } });
      pcsRef.current.clear();
      localRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current?.getTracks().forEach(t => t.stop());
      wsRef.current?.close();
      sendRef.current = () => {};
      setLocalStream(null);
      setLocalDisplay(null);
      setPeers(new Map());
      setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId]);

  // ── Toggle audio ──────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    if (!localRef.current) return;
    const track = localRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const nowMuted = !track.enabled;
    audioMutedRef.current = nowMuted;
    setAudioMuted(nowMuted);
    broadcastMuteState();
  }, [broadcastMuteState]);

  // ── Toggle video ──────────────────────────────────────────────────────────
  const toggleVideo = useCallback(() => {
    if (!localRef.current) return;
    const track = localRef.current.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const nowMuted = !track.enabled;
    videoMutedRef.current = nowMuted;
    setVideoMuted(nowMuted);
    broadcastMuteState();
  }, [broadcastMuteState]);

  // ── Screen share ──────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      // Stop screen share → restore camera track in all PCs
      console.log('Stopping screen share');
      screenRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current = null;
      
      const camTrack = localRef.current?.getVideoTracks()[0];
      if (camTrack) {
        const promises: Promise<void>[] = [];
        pcsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            console.log('Replacing screen track with camera track');
            promises.push(
              sender.replaceTrack(camTrack)
                .then(() => console.log('Successfully replaced with camera'))
                .catch(err => console.error('Failed to replace track:', err))
            );
          }
        });
        await Promise.all(promises);
      }
      
      setLocalDisplay(localRef.current);
      setScreenSharing(false);
    } else {
      try {
        console.log('Starting screen share');
        const screen = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: false 
        });
        screenRef.current = screen;
        const screenTrack = screen.getVideoTracks()[0];

        if (!screenTrack) {
          console.error('No video track in screen stream');
          screen.getTracks().forEach(t => t.stop());
          return;
        }

        console.log('Screen track obtained, replacing in all PCs');
        
        // Replace video sender in all active PCs
        const promises: Promise<void>[] = [];
        pcsRef.current.forEach((pc, userId) => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            console.log(`Replacing video track for peer ${userId}`);
            promises.push(
              sender.replaceTrack(screenTrack)
                .then(() => console.log(`Successfully replaced track for ${userId}`))
                .catch(err => console.error(`Failed to replace track for ${userId}:`, err))
            );
          } else {
            console.log(`No video sender for peer ${userId}, adding track instead`);
            try {
              pc.addTrack(screenTrack, screen);
            } catch (err) {
              console.error(`Failed to add track for ${userId}:`, err);
            }
          }
        });

        await Promise.all(promises);

        setLocalDisplay(screen);
        setScreenSharing(true);

        // Browser UI "stop sharing" button
        screenTrack.onended = () => {
          console.log('Screen share ended by browser');
          screenRef.current = null;
          
          const camTrack = localRef.current?.getVideoTracks()[0];
          if (camTrack) {
            const promises: Promise<void>[] = [];
            pcsRef.current.forEach(pc => {
              const sender = pc.getSenders().find(s => s.track?.kind === "video");
              if (sender) {
                promises.push(
                  sender.replaceTrack(camTrack)
                    .catch(err => console.error('Failed to restore camera:', err))
                );
              }
            });
            Promise.all(promises).then(() => {
              setLocalDisplay(localRef.current);
              setScreenSharing(false);
            });
          } else {
            setLocalDisplay(localRef.current);
            setScreenSharing(false);
          }
        };
      } catch (err) {
        if ((err as Error).name !== 'NotAllowedError') {
          console.error('Screen share error:', err);
          setError(`Screen share failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        // NotAllowedError = user cancelled, which is fine
      }
    }
  }, [screenSharing]);

  // ── Leave ─────────────────────────────────────────────────────────────────
  const leave = useCallback(() => {
    console.log('Leaving conference');
    pcsRef.current.forEach(pc => { try { pc.close(); } catch { /**/ } });
    pcsRef.current.clear();
    localRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current = null;
    wsRef.current?.close();
    sendRef.current = () => {};
    setLocalStream(null);
    setLocalDisplay(null);
    setPeers(new Map());
    setConnected(false);
    setScreenSharing(false);
    audioMutedRef.current = true;
    videoMutedRef.current = true;
    setAudioMuted(true);
    setVideoMuted(true);
  }, []);

  return {
    localStream,
    localDisplay,
    peers,
    connected,
    audioMuted,
    videoMuted,
    screenSharing,
    error,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leave,
    myUserId,
    myUserName,
  };
}