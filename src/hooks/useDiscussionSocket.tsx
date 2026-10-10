
/// <reference types="node" />
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

// ─── Config (resolved at build time by Next.js, same pattern as apiFetch.ts) ──
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
const WS_BASE     = BACKEND_URL.replace(/^http/, "ws");

// ─── Event shapes ─────────────────────────────────────────────────────────────

export type DiscussionEventType =
  | "new_discussion"
  | "update_discussion"
  | "delete_discussion"
  | "pin_discussion"
  | "resolve_discussion"
  | "new_reply"
  | "delete_reply";

export interface DiscussionSocketEvent {
  type: DiscussionEventType;
  payload: unknown;
}

export type DiscussionSocketHandler = (evt: DiscussionSocketEvent) => void;

// ─── Context ──────────────────────────────────────────────────────────────────

interface DiscussionSocketContextValue {
  subscribe: (handler: DiscussionSocketHandler) => () => void;
  connected: boolean;
}

const DiscussionSocketContext = createContext<DiscussionSocketContextValue>({
  subscribe: () => () => {},
  connected: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ProviderProps {
  slug: string;
  children: ReactNode;
}

/**
 * DiscussionSocketProvider
 *
 * Mount ONCE at the team layout level so the single WebSocket connection
 * survives navigation between the list page and thread pages.
 */
export function DiscussionSocketProvider({ slug, children }: ProviderProps) {
  const handlersRef = useRef<Set<DiscussionSocketHandler>>(new Set());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let ws: WebSocket | null = null;
    let destroyed  = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1000;

    function connect() {
      if (destroyed) return;
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("devflow_token") ?? ""
          : "";

      const socket = new WebSocket(
        `${WS_BASE}/api/v1/teams/${slug}/discussions/ws?token=${encodeURIComponent(token)}`
      );
      ws = socket;

      socket.onopen = () => {
        if (destroyed) { socket.close(1000, "late open"); return; }
        retryDelay = 1000;
        setConnected(true);
      };

      socket.onmessage = (ev) => {
        if (destroyed) return;
        try {
          const evt = JSON.parse(ev.data) as DiscussionSocketEvent;
          console.log("[DiscussionSocket] received event:", evt.type, JSON.stringify(evt.payload).slice(0, 200));
          console.log("[DiscussionSocket] handlers count:", handlersRef.current.size);
          handlersRef.current.forEach((h) => h(evt));
        } catch {
          /* ignore malformed frames */
        }
      };

      socket.onerror = () => { /* onclose fires next */ };

      socket.onclose = (ev) => {
        ws = null;
        setConnected(false);
        if (destroyed) return;
        if (ev.code === 4001) return; // auth failure — don't retry
        const delay = retryDelay;
        retryDelay = Math.min(delay * 2, 8000);
        retryTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      destroyed = true;
      setConnected(false);
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (ws) {
        ws.onclose = null; // prevent retry scheduling from cleanup close
        ws.close(1000, "provider unmount");
        ws = null;
      }
    };
  }, [slug]);

  const subscribe = useCallback((handler: DiscussionSocketHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return (
    <DiscussionSocketContext.Provider value={{ subscribe, connected }}>
      {children}
    </DiscussionSocketContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useDiscussionSocket
 *
 * Subscribe to real-time discussion events from the nearest
 * DiscussionSocketProvider. The provider must be rendered at the team layout
 * level so the single WebSocket survives page-to-page navigation.
 *
 * The `_slug` parameter is kept for call-site compatibility but routing is
 * handled by the provider — you don't need to pass it here.
 */
export function useDiscussionSocket(
  _slug: string | null | undefined,
  onEvent: DiscussionSocketHandler
): void {
  const { subscribe } = useContext(DiscussionSocketContext);
  const onEventRef    = useRef<DiscussionSocketHandler>(onEvent);
  useEffect(() => { onEventRef.current = onEvent; });

  useEffect(() => {
    const unsub = subscribe((evt) => onEventRef.current(evt));
    return unsub;
  }, [subscribe]);
}
