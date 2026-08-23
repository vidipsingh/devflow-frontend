
"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePairEditor, usePairSessions } from "@/hooks/usePairProgramming";
import type { PairSession } from "@/hooks/usePairProgramming";

// ─── Syntax highlighting ──────────────────────────────────────────────────────

const TOKEN_PATTERNS: { regex: RegExp; cls: string }[] = [
  { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,       cls: "tok-str" },
  { regex: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g,                          cls: "tok-cmt" },
  { regex: /\b(func|return|if|else|for|range|var|const|let|type|struct|interface|import|package|from|export|default|class|extends|new|this|async|await|switch|case|break|continue|defer|go|chan|map|make|append|len|nil|true|false|null|undefined|void|typeof|instanceof|in|of|try|catch|finally|throw)\b/g, cls: "tok-kw" },
  { regex: /\b([A-Z][A-Za-z0-9_]*)\b/g,                                       cls: "tok-type" },
  { regex: /\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,                          cls: "tok-num" },
  { regex: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,                           cls: "tok-fn" },
  { regex: /(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%&|^~<>!]=?|[{}[\]();:,.?])/g, cls: "tok-op" },
];

const TOKEN_STYLES: Record<string, React.CSSProperties> = {
  "tok-str":  { color: "#ce9178" },
  "tok-cmt":  { color: "#6a9955", fontStyle: "italic" },
  "tok-kw":   { color: "#569cd6", fontWeight: 600 },
  "tok-type": { color: "#4ec9b0" },
  "tok-num":  { color: "#b5cea8" },
  "tok-fn":   { color: "#dcdcaa" },
  "tok-op":   { color: "#d4d4d4" },
};

interface Token { start: number; end: number; cls: string }

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const occupied = new Uint8Array(code.length);
  for (const { regex, cls } of TOKEN_PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      const s = m.index, e = s + m[0].length;
      let free = true;
      for (let i = s; i < e; i++) if (occupied[i]) { free = false; break; }
      if (free) {
        tokens.push({ start: s, end: e, cls });
        for (let i = s; i < e; i++) occupied[i] = 1;
      }
    }
  }
  tokens.sort((a, b) => a.start - b.start);
  return tokens;
}

function renderHighlighted(code: string): React.ReactNode[] {
  if (!code) return [<span key="empty">{"\n"}</span>];
  const tokens = tokenize(code);
  const result: React.ReactNode[] = [];
  let pos = 0;
  for (const tok of tokens) {
    if (tok.start > pos) result.push(<span key={`p${pos}`}>{code.slice(pos, tok.start)}</span>);
    result.push(<span key={`t${tok.start}`} style={TOKEN_STYLES[tok.cls]}>{code.slice(tok.start, tok.end)}</span>);
    pos = tok.end;
  }
  if (pos < code.length) result.push(<span key={`p${pos}`}>{code.slice(pos)}</span>);
  // Ensure the pre always has at least a trailing newline so height matches textarea
  result.push(<span key="trail">{"\n"}</span>);
  return result;
}

function getLineCol(text: string, index: number) {
  const safe = text ?? "";
  const idx = Math.max(0, Math.min(index, safe.length));
  const lines = safe.slice(0, idx).split("\n");
  return { line: lines.length - 1, col: lines[lines.length - 1].length };
}

// ─── Editor ───────────────────────────────────────────────────────────────────

interface EditorProps {
  sessionId: string;
  session: PairSession;
  onEnd: () => void;
}

function PairEditor({ sessionId, session, onEnd }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef      = useRef<HTMLPreElement>(null);
  const gutterRef   = useRef<HTMLDivElement>(null);

  const {
    document: doc,
    version,
    connected,
    remoteCursors,
    docRef,
    sendInsert,
    sendDelete,
    sendCursor,
    disconnect,
  } = usePairEditor({
    sessionId,
    initialDocument: session.document ?? "",
    participants: session.participants ?? [],
  });

  const [localCursor, setLocalCursor] = useState(0);
  const [copied, setCopied]           = useState(false);
  const [scrollTop,  setScrollTop]    = useState(0);
  const [scrollLeft, setScrollLeft]   = useState(0);

  // ── Remote-change sync via useLayoutEffect ────────────────────────────────
  //
  // Textarea is UNCONTROLLED (defaultValue). React never touches .value.
  // After any render, we compare ta.value vs docRef.current (sync ref).
  //
  //   Local edit path:
  //     user types → handleInput → sendDelete/sendInsert → docRef.current updated
  //     → setDoc (async) → re-render → useLayoutEffect runs
  //     → ta.value === docRef.current → SKIP (no revert!)
  //
  //   Remote op path:
  //     WS "op" msg → docRef.current updated, setDoc called → re-render
  //     → useLayoutEffect: ta.value ≠ docRef.current → sync ta.value
  //     → restore caret using per-character delta (only counts change BEFORE cursor)
  //
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const target = docRef.current;

    // Already in sync → local edit or no-op, never revert
    if (ta.value === target) return;

    // Remote change detected — need to update textarea imperatively
    const oldValue  = ta.value;
    const selStart  = ta.selectionStart ?? 0;
    const selEnd    = ta.selectionEnd   ?? 0;

    ta.value = target;

    // Compute how much the string changed BEFORE the cursor position
    // by finding the common prefix length and adjusting only by the delta
    // that happened before selStart
    const oldLen = oldValue.length;
    const newLen = target.length;

    // Find length of common prefix
    let commonPfx = 0;
    const minPfx = Math.min(oldLen, newLen, selStart);
    while (commonPfx < minPfx && oldValue[commonPfx] === target[commonPfx]) commonPfx++;

    if (commonPfx >= selStart) {
      // The change happened entirely AFTER the cursor — cursor stays put
      ta.setSelectionRange(selStart, selEnd);
    } else {
      // Change happened before cursor — find common suffix from the right
      let oldSuf = oldLen, newSuf = newLen;
      while (
        oldSuf > selStart &&
        newSuf > selStart &&
        oldValue[oldSuf - 1] === target[newSuf - 1]
      ) {
        oldSuf--;
        newSuf--;
      }
      // How many chars were removed/added in range [commonPfx, oldSuf/newSuf]
      const deletedInRange = oldSuf - commonPfx;
      const insertedInRange = newSuf - commonPfx;
      const deltaBeforeCursor = insertedInRange - deletedInRange;
      const newStart = Math.max(0, Math.min(selStart + deltaBeforeCursor, newLen));
      const newEnd   = Math.max(newStart, Math.min(selEnd + deltaBeforeCursor, newLen));
      ta.setSelectionRange(newStart, newEnd);
    }
  }); // NO dependency array — runs after every render

  // ── Initial document load ─────────────────────────────────────────────────
  // The textarea mounts with defaultValue={session.document} but if the
  // session document was "" at mount time and gets filled later (async join),
  // we need to imperatively set the initial value once.
  const mountedRef = useRef(false);
  useLayoutEffect(() => {
    if (!mountedRef.current && textareaRef.current) {
      mountedRef.current = true;
      const ta = textareaRef.current;
      if (ta.value !== docRef.current) {
        ta.value = docRef.current;
      }
    }
  }, [docRef]);

  // ── Scroll sync ───────────────────────────────────────────────────────────
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop  = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
    // Track scroll offsets in state so the cursor overlay re-renders correctly
    setScrollTop(ta.scrollTop);
    setScrollLeft(ta.scrollLeft);
  }, []);

  // ── Input handler ─────────────────────────────────────────────────────────
  // Diff old doc (docRef.current) vs new textarea value to emit minimal OT ops.
  // Key correctness property: when user types after a deletion, docRef.current
  // already reflects the deletion (applied optimistically in sendDelete), so
  // the diff correctly computes the insertion position in the post-delete doc.
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.currentTarget.value;
      const oldVal = docRef.current; // always the correct previous state

      if (newVal === oldVal) return;

      // Forward diff — find start of change
      let start = 0;
      const minLen = Math.min(oldVal.length, newVal.length);
      while (start < minLen && oldVal[start] === newVal[start]) start++;

      // Backward diff — find end of change from both sides
      let oldEnd = oldVal.length;
      let newEnd = newVal.length;
      while (
        oldEnd > start &&
        newEnd > start &&
        oldVal[oldEnd - 1] === newVal[newEnd - 1]
      ) {
        oldEnd--;
        newEnd--;
      }

      const deletedCount = oldEnd - start;
      const insertedText = newVal.slice(start, newEnd);

      // Emit delete first (if any), then insert (if any).
      // sendDelete updates docRef.current synchronously, so sendInsert
      // sees the post-deletion document — correct position every time.
      if (deletedCount > 0) sendDelete(start, deletedCount);
      if (insertedText)     sendInsert(start, insertedText);
    },
    [docRef, sendDelete, sendInsert]
  );

  // ── Tab key handler ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        const TAB   = "  "; // 2 spaces

        // Insert 2 spaces at cursor position
        const before = ta.value.slice(0, start);
        const after  = ta.value.slice(end);
        ta.value = before + TAB + after;
        ta.selectionStart = ta.selectionEnd = start + TAB.length;

        // Emit ops: delete selected range (if any) then insert spaces
        if (end > start) sendDelete(start, end - start);
        sendInsert(start, TAB);
      }
    },
    [sendDelete, sendInsert]
  );

  // ── Cursor tracking ───────────────────────────────────────────────────────
  const trackCursor = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const idx = ta.selectionStart ?? 0;
    setLocalCursor(idx);
    sendCursor(idx);
  }, [sendCursor]);

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sessionId]);

  const safeDoc   = doc ?? "";
  const lines     = safeDoc.split("\n");
  const lineCount = lines.length;
  const { line: curLine, col: curCol } = getLineCol(safeDoc, localCursor);

  const ext = (session.filePath ?? "").split(".").pop()?.toLowerCase() ?? "";
  const langLabel: Record<string, string> = {
    go: "Go", ts: "TypeScript", tsx: "TypeScript JSX", js: "JavaScript",
    jsx: "JavaScript JSX", py: "Python", rs: "Rust", java: "Java",
    c: "C", cpp: "C++", cs: "C#", rb: "Ruby", sh: "Shell",
    json: "JSON", yaml: "YAML", yml: "YAML", md: "Markdown", html: "HTML", css: "CSS",
  };
  const language = langLabel[ext] ?? (ext.toUpperCase() || "Plain Text");

  const LINE_H   = 22;
  const CHAR_W   = 7.8;
  const GUTTER_W = 52;
  const PAD_L    = GUTTER_W + 12;
  const PAD_T    = 12;
  const PAD_R    = 16;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#0d0d0f" }}>

      {/* ── Top bar (matches dashboard header style) ── */}
      <div
        className="flex items-center gap-0 flex-shrink-0 border-b"
        style={{ height: 40, background: "#111113", borderColor: "rgba(255,255,255,0.07)" }}
      >
        {/* Back breadcrumb */}
        <Link
          href="/dashboard/pair"
          className="flex items-center gap-1.5 px-4 h-full text-xs font-medium transition-colors border-r flex-shrink-0"
          style={{ color: "#71717a", borderColor: "rgba(255,255,255,0.07)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#a1a1aa")}
          onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sessions
        </Link>

        {/* Active file tab */}
        <div
          className="flex items-center gap-2 px-4 h-full text-xs border-r border-b-0 flex-shrink-0"
          style={{
            color: "#cccccc",
            borderColor: "rgba(255,255,255,0.07)",
            borderBottom: "2px solid #6366f1",
            background: "#0d0d0f",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="#4ec9b0" strokeWidth="1.2" />
            <path d="M5 5h6M5 8h4M5 11h5" stroke="#4ec9b0" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span className="font-medium">{session.filePath || "untitled"}</span>
          {/* Live dot */}
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? "animate-pulse" : ""}`}
            style={{ background: connected ? "#22c55e" : "#f87171" }}
          />
        </div>

        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-3 px-4 flex-shrink-0">
          {/* Participants mini-stack */}
          <div className="flex -space-x-1.5">
            {(session.participants ?? []).slice(0, 4).map((p, i) => (
              <div
                key={p.userId}
                title={p.username}
                className="w-5 h-5 rounded-full border flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                style={{ background: p.color, borderColor: "#111113", zIndex: i }}
              >
                {(p.username ?? "?")[0].toUpperCase()}
              </div>
            ))}
          </div>

          <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />

          <button
            onClick={copyId}
            className="text-[11px] font-medium transition-colors cursor-pointer"
            style={{ color: copied ? "#22c55e" : "#71717a" }}
          >
            {copied ? "✓ Copied" : "Share ID"}
          </button>

          <button
            onClick={() => { disconnect(); onEnd(); }}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
            style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l4-3-4-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            End
          </button>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Code editor area ── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: "#0d0d0f" }}>

          {/* Line numbers gutter */}
          <div
            ref={gutterRef}
            aria-hidden
            className="absolute top-0 left-0 bottom-0 overflow-hidden select-none pointer-events-none"
            style={{
              width: GUTTER_W,
              zIndex: 10,
              background: "#0d0d0f",
              borderRight: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ paddingTop: PAD_T, paddingBottom: 40 }}>
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                <div
                  key={i}
                  style={{
                    lineHeight: `${LINE_H}px`,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                    color: i === curLine ? "#a1a1aa" : "#3f3f46",
                    textAlign: "right",
                    paddingRight: 10,
                    transition: "color 0.1s",
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Syntax highlight overlay */}
          <pre
            ref={preRef}
            aria-hidden
            className="absolute inset-0 m-0 whitespace-pre pointer-events-none overflow-hidden"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontSize: 13,
              lineHeight: `${LINE_H}px`,
              paddingLeft: PAD_L,
              paddingTop: PAD_T,
              paddingRight: PAD_R,
              paddingBottom: 40,
              color: "#d4d4d4",
              zIndex: 1,
              tabSize: 2,
            }}
          >
            {renderHighlighted(safeDoc)}
          </pre>

          {/* Remote cursors */}
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex: 2 }}
          >
            {remoteCursors.map((cursor) => {
              const { line, col } = getLineCol(safeDoc, cursor.index);
              const top  = PAD_T + line * LINE_H - scrollTop;
              const left = PAD_L + col * CHAR_W - scrollLeft;
              return (
                <div
                  key={cursor.userId}
                  className="absolute"
                  style={{ top, left }}
                >
                  {/* Cursor line */}
                  <div
                    style={{
                      width: 2,
                      height: LINE_H,
                      background: cursor.color,
                      borderRadius: 1,
                      opacity: 0.9,
                    }}
                  />
                  {/* Name label */}
                  <div
                    style={{
                      position: "absolute",
                      top: -18,
                      left: 0,
                      background: cursor.color,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: "system-ui, sans-serif",
                      padding: "2px 5px",
                      borderRadius: "3px 3px 3px 0",
                      whiteSpace: "nowrap",
                      lineHeight: "14px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {cursor.userName}
                  </div>
                </div>
              );
            })}
          </div>

          {/* UNCONTROLLED textarea — React never touches .value after mount */}
          <textarea
            ref={textareaRef}
            defaultValue={session.document ?? ""}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={trackCursor}
            onClick={trackCursor}
            onSelect={trackCursor}
            onScroll={syncScroll}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            data-gramm="false"
            className="absolute inset-0 w-full h-full resize-none border-0 outline-none bg-transparent"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontSize: 13,
              lineHeight: `${LINE_H}px`,
              paddingLeft: PAD_L,
              paddingTop: PAD_T,
              paddingRight: PAD_R,
              paddingBottom: 40,
              color: "transparent",
              caretColor: "#a1a1aa",
              zIndex: 3,
              tabSize: 2,
              WebkitTextFillColor: "transparent",
            }}
          />
        </div>

        {/* ── Right sidebar ── */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{
            width: 220,
            background: "#111113",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Participants */}
          <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#52525b", letterSpacing: "0.08em" }}
            >
              Participants
            </p>
            {/* Connection status */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-1.5 h-1.5 rounded-full ${connected ? "animate-pulse" : ""}`}
                style={{ background: connected ? "#22c55e" : "#f87171" }}
              />
              <span className="text-[11px]" style={{ color: "#71717a" }}>
                {connected ? "Connected · Live" : "Reconnecting…"}
              </span>
            </div>
            <div className="space-y-2.5">
              {(session.participants ?? []).map((p) => {
                const isActive = remoteCursors.some((c) => c.userId === p.userId);
                return (
                  <div key={p.userId} className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ background: p.color }}
                    >
                      {(p.username ?? "?")[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-medium truncate flex-1" style={{ color: "#a1a1aa" }}>
                      {p.username}
                    </span>
                    {isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                        style={{ background: p.color }}
                      />
                    )}
                  </div>
                );
              })}
              {(session.participants ?? []).length === 0 && (
                <p className="text-[11px] italic" style={{ color: "#3f3f46" }}>
                  Waiting for others…
                </p>
              )}
            </div>
          </div>

          {/* Info panel */}
          <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#52525b", letterSpacing: "0.08em" }}
            >
              Info
            </p>
            <div className="space-y-2">
              {(
                [
                  ["Version",  `v${version}`],
                  ["Language", language],
                  ["Lines",    `${lineCount}`],
                  ["Chars",    `${safeDoc.length}`],
                  ["Cursor",   `${curLine + 1}:${curCol + 1}`],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: "#52525b" }}>{k}</span>
                  <span className="text-[11px] font-mono font-medium" style={{ color: "#a1a1aa" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="px-4 py-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#52525b", letterSpacing: "0.08em" }}
            >
              Share
            </p>
            <div
              className="font-mono text-[10px] break-all rounded-lg px-2.5 py-2 mb-2.5"
              style={{ color: "#52525b", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {sessionId}
            </div>
            <button
              onClick={copyId}
              className="w-full text-xs py-2 rounded-lg font-medium transition-all cursor-pointer"
              style={{
                color: copied ? "#22c55e" : "#a1a1aa",
                background: copied ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {copied ? "✓ Copied!" : "Copy Session ID"}
            </button>
          </div>

          <div className="flex-1" />

          {/* Tips */}
          <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="space-y-1 text-[10px]" style={{ color: "#3f3f46" }}>
              <p>• Real-time OT sync</p>
              <p>• Tab inserts 2 spaces</p>
              <p>• Saved on every keystroke</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status bar (matches dashboard style) ── */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0 text-white"
        style={{ height: 24, background: "#6366f1", fontSize: 11 }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${connected ? "animate-pulse" : ""}`}
              style={{ background: connected ? "#fff" : "#fbbf24" }}
            />
            {connected ? "Live" : "Offline"}
          </span>
          <span className="opacity-75">{session.filePath || "untitled"}</span>
        </div>
        <div className="flex items-center gap-4 opacity-90">
          <span>Ln {curLine + 1}, Col {curCol + 1}</span>
          <span>{language}</span>
          <span>UTF-8</span>
          <span>v{version}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PairSessionPage() {
  const params    = useParams();
  const router    = useRouter();
  const sessionId = params.sessionId as string;

  const { joinSession, endSession, getSession } = usePairSessions();
  const [session, setSession] = useState<PairSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      setLoading(true);
      // Try to join first (idempotent — server won't re-add if already a participant)
      const joined = await joinSession(sessionId);
      if (joined) {
        setSession(joined);
      } else {
        // Fall back to GET (session might already be active)
        const existing = await getSession(sessionId);
        if (!existing) setError("Session not found or has ended.");
        else setSession(existing);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleEnd = async () => {
    if (session) await endSession(session.id);
    router.push("/dashboard/pair");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#0d0d0f" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-9 h-9 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(99,102,241,0.3)", borderTopColor: "#6366f1" }}
          />
          <p className="text-sm font-medium" style={{ color: "#71717a" }}>
            Joining session…
          </p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5" style={{ background: "#0d0d0f" }}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#f87171" strokeWidth="1.5" />
            <path d="M12 8v5M12 15h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold mb-1" style={{ color: "#e4e4e7" }}>
            Session unavailable
          </h3>
          <p className="text-sm" style={{ color: "#71717a" }}>
            {error ?? "This session could not be found."}
          </p>
        </div>
        <Link
          href="/dashboard/pair"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: "#6366f1", color: "#fff" }}
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  return <PairEditor sessionId={sessionId} session={session} onEnd={handleEnd} />;
}
