
"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const WS_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "")
  .replace(/^https/, "wss")
  .replace(/^http/, "ws");

function getToken() {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParticipantInfo {
  userId: string;
  username: string;
  color: string;
}

export interface PairSession {
  id: string;
  ownerId: string;
  repoId: string;
  fileId: string;
  filePath: string;
  document: string;
  version: number;
  status: "waiting" | "active" | "ended";
  participants: ParticipantInfo[];
  createdAt: string;
  endedAt?: string;
}

export interface OTOperation {
  clientSeq: number;
  serverSeq: number;
  index: number;
  insert: string;
  delete: number;
  authorId: string;
  authorName: string;
}

// ─── WebSocket message types ──────────────────────────────────────────────────

interface WSStateMsg   { type: "state";  document: string; version: number }
interface WSOpMsg      { type: "op";     serverSeq: number; op: OTOperation; authorId: string; authorName: string }
interface WSAckMsg     { type: "ack";    serverSeq: number; op: OTOperation }
interface WSCursorMsg  { type: "cursor"; userId: string; userName: string; index: number }
interface WSLeaveMsg   { type: "leave";  userId: string; userName: string }
type WSMessage = WSStateMsg | WSOpMsg | WSAckMsg | WSCursorMsg | WSLeaveMsg | { type: "pong" };

// ─── OT client-side helpers ───────────────────────────────────────────────────

/**
 * Transform op2 so it can be correctly applied after op1 has already been applied.
 * Follows standard OT include-transformation rules.
 */
function transformOp(op1: OTOperation, op2: OTOperation): OTOperation {
  const result = { ...op2 };

  // op1 = insert, op2 = insert
  if (op1.insert && op2.insert) {
    if (op1.index <= op2.index) {
      result.index += op1.insert.length;
    }
    return result;
  }

  // op1 = insert, op2 = delete
  if (op1.insert && op2.delete > 0) {
    if (op1.index <= op2.index) {
      result.index += op1.insert.length;
    }
    return result;
  }

  // op1 = delete, op2 = insert
  if (op1.delete > 0 && op2.insert) {
    if (op1.index < op2.index) {
      const shift = Math.min(op1.delete, op2.index - op1.index);
      result.index -= shift;
      if (result.index < op1.index) result.index = op1.index;
    }
    return result;
  }

  // op1 = delete, op2 = delete
  if (op1.delete > 0 && op2.delete > 0) {
    const op1End = op1.index + op1.delete;
    const op2End = op2.index + op2.delete;

    if (op1End <= op2.index) {
      // op1 entirely before op2 — shift op2 left
      result.index -= op1.delete;
    } else if (op1.index >= op2End) {
      // op1 entirely after op2 — no change
    } else {
      // Overlapping — shrink op2's delete by the overlap
      const overlapStart = Math.max(op1.index, op2.index);
      const overlapEnd   = Math.min(op1End, op2End);
      const overlap      = overlapEnd - overlapStart;
      result.delete = Math.max(0, result.delete - overlap);
      if (op1.index <= op2.index) {
        result.index = op1.index;
      }
    }
    return result;
  }

  return result;
}

/**
 * Adjust a cursor index given that `op` has just been applied to the document.
 */
export function transformCursorIndex(cursorIndex: number, op: OTOperation): number {
  if (op.insert) {
    if (op.index <= cursorIndex) {
      return cursorIndex + op.insert.length;
    }
    return cursorIndex;
  }
  if (op.delete > 0) {
    const opEnd = op.index + op.delete;
    if (opEnd <= cursorIndex) {
      return cursorIndex - op.delete;
    }
    if (op.index < cursorIndex) {
      return op.index;
    }
    return cursorIndex;
  }
  return cursorIndex;
}

export function applyOp(doc: string, op: OTOperation): string {
  const safe = doc ?? "";
  const idx = Math.max(0, Math.min(op.index, safe.length));
  if (op.insert) {
    return safe.slice(0, idx) + op.insert + safe.slice(idx);
  }
  if (op.delete > 0) {
    const end = Math.min(idx + op.delete, safe.length);
    return safe.slice(0, idx) + safe.slice(end);
  }
  return safe;
}

// ─── usePairSessions ─────────────────────────────────────────────────────────

export function usePairSessions() {
  const [sessions, setSessions] = useState<PairSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/pair-sessions`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch sessions");
      setSessions(json.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(
    async (repoId: string, filePath: string, document: string): Promise<PairSession | null> => {
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/v1/pair-sessions`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ repoId, filePath, document }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to create session");
        const sess: PairSession = json.data;
        setSessions((prev) => [sess, ...prev]);
        return sess;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      }
    },
    []
  );

  const joinSession = useCallback(async (sessionId: string): Promise<PairSession | null> => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/pair-sessions/${sessionId}/join`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to join session");
      return json.data as PairSession;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    }
  }, []);

  const endSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/pair-sessions/${sessionId}/end`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to end session");
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: "ended" as const } : s))
      );
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    }
  }, []);

  const getSession = useCallback(async (sessionId: string): Promise<PairSession | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/pair-sessions/${sessionId}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) return null;
      return json.data as PairSession;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, fetchSessions, createSession, joinSession, endSession, getSession };
}

// ─── RemoteCursor type ────────────────────────────────────────────────────────

export interface RemoteCursor {
  userId: string;
  userName: string;
  index: number;
  color: string;
}

// ─── usePairEditor ────────────────────────────────────────────────────────────

interface UsePairEditorOptions {
  sessionId: string;
  initialDocument?: string;
  participants?: ParticipantInfo[];
}

interface UsePairEditorReturn {
  document: string;
  version: number;
  connected: boolean;
  remoteCursors: RemoteCursor[];
  participants: ParticipantInfo[];
  /** Synchronous mirror of `document` — always current, use in event handlers */
  docRef: React.MutableRefObject<string>;
  sendInsert: (index: number, text: string) => void;
  sendDelete: (index: number, count: number) => void;
  sendCursor: (index: number) => void;
  disconnect: () => void;
}

const CURSOR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
];

export function usePairEditor({
  sessionId,
  initialDocument,
  participants: initialParticipants = [],
}: UsePairEditorOptions): UsePairEditorReturn {
  const [doc, setDoc] = useState<string>(() => initialDocument ?? "");
  const [version, setVersion] = useState(0);
  const [connected, setConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [participants, setParticipants] = useState<ParticipantInfo[]>(initialParticipants ?? []);

  // docRef is always in sync with the real document, updated synchronously before setDoc
  const docRef = useRef<string>(initialDocument ?? "");

  const wsRef = useRef<WebSocket | null>(null);
  const clientSeqRef = useRef(0);
  const baseVersionRef = useRef(0);

  // pendingOpsRef: ops we've sent but not yet ACK'd by server
  const pendingOpsRef = useRef<OTOperation[]>([]);

  // participantsRef mirrors participants state for WS callbacks
  const participantsRef = useRef<ParticipantInfo[]>(initialParticipants ?? []);

  // Track if initial document has been set
  const initializedRef = useRef(false);

  // When initialDocument arrives async (after session fetch), sync it once — only
  // if the WS hasn't already overridden the doc via a "state" message
  useEffect(() => {
    if (!initializedRef.current && initialDocument !== undefined) {
      docRef.current = initialDocument;
      setDoc(initialDocument);
      initializedRef.current = true;
    }
  }, [initialDocument]);

  // Keep participantsRef in sync
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    const token = getToken();
    if (!token || !sessionId) return;

    const wsUrl = `${WS_BASE}/api/v1/ws/pair/${sessionId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (evt) => {
      let msg: WSMessage;
      try { msg = JSON.parse(evt.data as string); } catch { return; }

      if (msg.type === "state") {
        // Authoritative server state — reset everything
        const newDoc = msg.document ?? "";
        docRef.current = newDoc;
        setDoc(newDoc);
        setVersion(msg.version);
        baseVersionRef.current = msg.version;
        // Clear pending ops because server is giving us ground truth.
        // Any ops we sent before this point will be ACK'd separately or are lost
        // (shouldn't happen in practice as state arrives on first connect only)
        pendingOpsRef.current = [];
        initializedRef.current = true;

      } else if (msg.type === "ack") {
        // Server ACK'd one of our ops — remove it from pending queue
        pendingOpsRef.current = pendingOpsRef.current.filter(
          (op) => op.clientSeq !== msg.op.clientSeq
        );
        setVersion(msg.serverSeq);
        baseVersionRef.current = msg.serverSeq;
        // Local doc already updated optimistically — nothing else to do

      } else if (msg.type === "op") {
        // Remote op from another user, already transformed by server.
        // We must transform it against our local pending (unACK'd) ops so it
        // applies correctly on top of our optimistic local state.
        let incoming = { ...msg.op };
        for (const pending of pendingOpsRef.current) {
          incoming = transformOp(pending, incoming);
        }

        // Apply to local doc synchronously
        const newDoc = applyOp(docRef.current, incoming);
        docRef.current = newDoc;
        setDoc(newDoc);
        setVersion(msg.serverSeq);
        baseVersionRef.current = msg.serverSeq;
        // Shift all remote cursor positions through this op
        setRemoteCursors((prev) =>
          prev.map((c) => ({
            ...c,
            index: transformCursorIndex(c.index, incoming),
          }))
        );

      } else if (msg.type === "cursor") {
        // Transform incoming remote cursor through our pending ops so it
        // reflects where the remote user's cursor would be in our local view
        let cursorIdx = msg.index;
        for (const pending of pendingOpsRef.current) {
          cursorIdx = transformCursorIndex(cursorIdx, pending);
        }

        const allParticipants = participantsRef.current;
        const colorIdx = allParticipants.findIndex((p) => p.userId === msg.userId);
        const color = CURSOR_COLORS[Math.max(colorIdx, 0) % CURSOR_COLORS.length];

        setRemoteCursors((prev) => {
          const filtered = prev.filter((c) => c.userId !== msg.userId);
          return [...filtered, { userId: msg.userId, userName: msg.userName, index: cursorIdx, color }];
        });

      } else if (msg.type === "leave") {
        setRemoteCursors((prev) => prev.filter((c) => c.userId !== msg.userId));
        setParticipants((prev) => prev.filter((p) => p.userId !== msg.userId));
      }
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  /**
   * Low-level send — pushes op to pendingOps and transmits over WS.
   * Does NOT modify docRef — callers must do that first.
   */
  const sendOp = useCallback((op: OTOperation) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    pendingOpsRef.current.push(op);
    wsRef.current.send(JSON.stringify({
      type: "op",
      clientSeq: op.clientSeq,
      baseVersion: baseVersionRef.current,
      index: op.index,
      insert: op.insert,
      delete: op.delete,
    }));
  }, []);

  const sendInsert = useCallback((index: number, text: string) => {
    if (!text) return;
    clientSeqRef.current++;
    const op: OTOperation = {
      clientSeq: clientSeqRef.current,
      serverSeq: 0,
      index,
      insert: text,
      delete: 0,
      authorId: "",
      authorName: "",
    };
    // Apply optimistically to docRef BEFORE pushing to pending
    const newDoc = applyOp(docRef.current, op);
    docRef.current = newDoc;
    setDoc(newDoc);
    sendOp(op);
  }, [sendOp]);

  const sendDelete = useCallback((index: number, count: number) => {
    if (count <= 0) return;
    clientSeqRef.current++;
    const op: OTOperation = {
      clientSeq: clientSeqRef.current,
      serverSeq: 0,
      index,
      insert: "",
      delete: count,
      authorId: "",
      authorName: "",
    };
    // Apply optimistically to docRef BEFORE pushing to pending
    const newDoc = applyOp(docRef.current, op);
    docRef.current = newDoc;
    setDoc(newDoc);
    sendOp(op);
  }, [sendOp]);

  const sendCursor = useCallback((index: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "cursor", index }));
    }
  }, []);

  const disconnect = useCallback(() => { wsRef.current?.close(); }, []);

  return {
    document: doc ?? "",
    version,
    connected,
    remoteCursors,
    participants,
    docRef,
    sendInsert,
    sendDelete,
    sendCursor,
    disconnect,
  };
}
