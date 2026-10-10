
"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRepoDetail } from "@/hooks/useRepoDetail";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileLanguageHint(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "TypeScript", tsx: "TypeScript (JSX)", js: "JavaScript", jsx: "JavaScript (JSX)",
    go: "Go", py: "Python", rs: "Rust", java: "Java", kt: "Kotlin",
    rb: "Ruby", php: "PHP", cs: "C#", cpp: "C++", c: "C",
    md: "Markdown", json: "JSON", yaml: "YAML", yml: "YAML",
    toml: "TOML", html: "HTML", css: "CSS", scss: "SCSS",
    sh: "Shell", bash: "Shell", sql: "SQL", xml: "XML",
    dockerfile: "Dockerfile",
  };
  return map[ext] ?? ext.toUpperCase() ?? "Plain Text";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditFilePage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo: repoSlug } = use(params);
  const name = `${owner}/${repoSlug}`;
  const router = useRouter();
  const searchParams = useSearchParams();

  const filePath = searchParams.get("path") ?? "";
  const branchParam = searchParams.get("branch") ?? "";

  const {
    repo,
    isLoadingRepo,
    isLoadingBlob,
    isUploading,
    uploadError,
    uploadSuccess,
    openBlob,
    editFile,
    currentBranch,
    switchBranch,
  } = useRepoDetail(name);

  // ── Local state ────────────────────────────────────────────────────────────
  const [content, setContent] = useState<string | null>(null); // null = loading
  const [commitMessage, setCommitMessage] = useState("");
  const [branch, setBranch] = useState(branchParam);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync branch from hook once repo is loaded
  useEffect(() => {
    if (!branch && currentBranch) setBranch(currentBranch);
  }, [branch, currentBranch]);

  // Switch hook to the right branch when param is available
  useEffect(() => {
    if (branchParam && branchParam !== currentBranch) {
      switchBranch(branchParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchParam]);

  // Load blob content once branch is ready
  useEffect(() => {
    if (!filePath || !currentBranch) return;
    openBlob(filePath).then(() => {
      // activeBlob isn't exposed directly here — we re-fetch via plain fetch
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, currentBranch]);

  // We fetch the blob separately to get the raw text content
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (!filePath || !currentBranch || !name) return;
    const encoded = name.replace("/", "~");
    const params = new URLSearchParams({ ref: currentBranch, path: filePath });
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("devflow_token") ?? ""
        : "";
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"}/api/v1/repositories/${encoded}/blob?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        setContent(json.data?.content ?? "");
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : "Failed to load file");
        setContent("");
      });
  }, [filePath, currentBranch, name]);

  // After successful save → redirect back to the blob viewer
  useEffect(() => {
    if (uploadSuccess && saved) {
      const dest = `/dashboard/repositories/${name}`;
      const q = new URLSearchParams({ path: filePath, branch });
      // Small delay so success flash is visible
      const t = setTimeout(() => router.push(`${dest}?${q}`), 1200);
      return () => clearTimeout(t);
    }
  }, [uploadSuccess, saved, name, filePath, branch, router]);

  // ── Tab key handler — inserts two spaces ──────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = (content ?? "").substring(0, start) + "  " + (content ?? "").substring(end);
        setContent(next);
        // Restore caret position after React re-render
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
      // Ctrl/Cmd+S → save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content]
  );

  const handleSave = useCallback(async () => {
    if (content === null || isUploading) return;
    setSaved(false);
    const ok = await editFile({
      path: filePath,
      content: content,
      message: commitMessage.trim() || undefined,
      branch,
    });
    if (ok) setSaved(true);
  }, [content, filePath, commitMessage, branch, editFile, isUploading]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filename = filePath.split("/").pop() ?? filePath;
  const langHint = fileLanguageHint(filename);
  const lineCount = (content ?? "").split("\n").length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoadingRepo || content === null) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-indigo-400 animate-spin" />
          </div>
          <p className="text-white/30 text-sm">Loading file…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-red-400 font-medium">Failed to load file</p>
          <p className="text-white/40 text-sm">{loadError}</p>
          <Link
            href={`/dashboard/repositories/${name}`}
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm"
          >
            ← Back to repository
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/[0.08] bg-[#0d0d14] shrink-0">
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Link
            href={`/dashboard/repositories/${name}`}
            className="text-white/35 hover:text-indigo-300 transition-colors shrink-0"
            title="Back to repository"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-white/20">/</span>
          <Link href="/dashboard/repositories" className="text-white/30 hover:text-white/60 transition-colors text-xs truncate">
            {owner}
          </Link>
          <span className="text-white/20">/</span>
          <Link
            href={`/dashboard/repositories/${name}`}
            className="text-white/50 hover:text-white/80 transition-colors text-xs font-medium truncate"
          >
            {repoSlug}
          </Link>
          <span className="text-white/20">/</span>
          {/* Show path segments */}
          {filePath.split("/").map((seg, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              {i < arr.length - 1 ? (
                <>
                  <span className="text-white/40 text-xs">{seg}</span>
                  <span className="text-white/20">/</span>
                </>
              ) : (
                <span className="text-white/85 font-mono text-xs font-semibold">{seg}</span>
              )}
            </span>
          ))}

          {/* Language hint badge */}
          <span className="ml-2 hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300/70 text-xs font-mono">
            {langHint}
          </span>
        </div>

        {/* Right: branch selector + commit msg + save */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Branch selector */}
          <div className="relative hidden sm:block">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-[#111117] border border-white/[0.1] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white/70 appearance-none focus:outline-none focus:border-indigo-400/40 cursor-pointer"
            >
              {(repo?.branches ?? [branch]).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <svg className="w-3 h-3 text-indigo-400/60 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
            </svg>
          </div>

          {/* Commit message input */}
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder={`Edit ${filename}`}
            className="hidden sm:block w-52 bg-[#111117] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder-white/25 focus:outline-none focus:border-indigo-400/40"
          />

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isUploading || isLoadingBlob}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30 cursor-pointer"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Commit
              </>
            )}
          </button>

          {/* Cancel */}
          <Link
            href={`/dashboard/repositories/${name}?path=${encodeURIComponent(filePath)}&branch=${encodeURIComponent(branch)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/45 hover:text-white/70 text-sm transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* ── Status banners ───────────────────────────────────────────────── */}
      {(uploadSuccess && saved) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-sm shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Committed successfully — redirecting…
        </div>
      )}
      {uploadError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-300 text-sm shrink-0">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {uploadError}
        </div>
      )}

      {/* ── Mobile commit bar ────────────────────────────────────────────── */}
      <div className="flex sm:hidden items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-[#0d0d14] shrink-0">
        <input
          type="text"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder={`Edit ${filename}`}
          className="flex-1 bg-[#111117] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder-white/25 focus:outline-none"
        />
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="bg-[#111117] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none"
        >
          {(repo?.branches ?? [branch]).map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* ── Editor area ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line numbers */}
        <div
          className="select-none py-4 px-3 text-right bg-[#0a0a0f] border-r border-white/[0.06] text-xs text-white/20 font-mono leading-6 overflow-hidden shrink-0"
          style={{ minWidth: "3.5rem" }}
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="flex-1 bg-[#0d1117] text-white/80 font-mono text-sm leading-6 p-4 resize-none focus:outline-none caret-indigo-400 selection:bg-indigo-500/30"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}
        />
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0a0f] border-t border-white/[0.06] text-xs text-white/25 shrink-0">
        <span className="font-mono">{filePath}</span>
        <div className="flex items-center gap-4">
          <span>{lineCount} line{lineCount !== 1 ? "s" : ""}</span>
          <span>{content.length} chars</span>
          <span>{langHint}</span>
          <span className="hidden sm:inline">Tab: 2 spaces · Ctrl+S to save</span>
        </div>
      </div>
    </div>
  );
}
