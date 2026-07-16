
"use client";

import { use, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRepoDetail } from "@/hooks/useRepoDetail";
import { UploadFileModal } from "@/components/repositories/UploadFileModal";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
function getToken() {
  try { return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null; }
  catch { return null; }
}

// ─── Language colour dot ──────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  Go: "bg-cyan-400", TypeScript: "bg-blue-400", JavaScript: "bg-yellow-400",
  Python: "bg-green-400", Rust: "bg-orange-500", Java: "bg-red-400",
  "C++": "bg-rose-400", Ruby: "bg-pink-400",
};
function langColor(l: string) { return LANG_COLORS[l] ?? "bg-white/40"; }

// ─── File icon by extension ───────────────────────────────────────────────────
function FileIcon({ name, isDir }: { name: string; isDir: boolean }) {
  if (isDir) return (
    <svg className="w-4 h-4 text-violet-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const colors: Record<string, string> = {
    go: "text-cyan-400", ts: "text-blue-400", tsx: "text-blue-400",
    js: "text-yellow-400", jsx: "text-yellow-400", py: "text-green-400",
    rs: "text-orange-400", md: "text-white/50", json: "text-amber-400",
    yaml: "text-purple-400", yml: "text-purple-400", toml: "text-rose-400",
    css: "text-pink-400", html: "text-orange-400", sh: "text-teal-400",
  };
  return (
    <svg className={`w-4 h-4 shrink-0 ${colors[ext] ?? "text-white/25"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ─── Breadcrumb path builder ──────────────────────────────────────────────────
function Breadcrumb({ path, onNavigate }: { path: string; onNavigate: (p: string) => void }) {
  if (path === "." || path === "") return null;
  const parts = path.split("/").filter(Boolean);
  return (
    <div className="flex items-center gap-1 text-sm text-white/40">
      <button onClick={() => onNavigate(".")} className="hover:text-indigo-300 transition-colors">root</button>
      {parts.map((part, i) => {
        const subPath = parts.slice(0, i + 1).join("/");
        return (
          <span key={i} className="flex items-center gap-1">
            <span className="text-white/20">/</span>
            {i === parts.length - 1 ? (
              <span className="text-white/70">{part}</span>
            ) : (
              <button onClick={() => onNavigate(subPath)} className="hover:text-indigo-300 transition-colors">{part}</button>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── Simple Markdown renderer ─────────────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-white mt-6 mb-2">{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-xl font-semibold text-white mt-5 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-lg font-medium text-white mt-4 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith("```")) {
      const lang = line.slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-[#0d1117] border border-white/[0.08] rounded-xl p-4 overflow-x-auto my-3">
          <code className={`text-sm text-white/75 language-${lang}`}>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<li key={i} className="text-white/60 text-sm ml-4 list-disc">{line.slice(2)}</li>);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-white/65 text-sm leading-relaxed">{line}</p>);
    }
    i++;
  }
  return <div className="space-y-1">{elements}</div>;
}

// ─── Tab definition ───────────────────────────────────────────────────────────
const TABS = [
  { id: "code", label: "Code", icon: (
    <svg className="w-3.5 h-3.5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )},
  { id: "commits", label: "Commits", icon: (
    <svg className="w-3.5 h-3.5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )},
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const {
    repo, tree, commits, activeBlob,
    currentPath, currentBranch,
    isLoadingRepo, isLoadingTree, isLoadingBlob,
    isUploading, error, uploadError, uploadSuccess,
    navigateTo, openBlob, closeBlob, switchBranch, uploadFile,
  } = useRepoDetail(name);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "commits">("code");
  const [starCount, setStarCount] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);
  const [isStarring, setIsStarring] = useState(false);

  // Fetch star status from backend on mount (so it persists across page reloads)
  const fetchStarStatus = useCallback(async () => {
    if (!name) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/repositories/${name}/star`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStarred(data.data?.starred ?? false);
        setStarCount(data.data?.stars ?? null);
      }
    } catch { /* ignore */ }
  }, [name]);

  // Load star status once the repo slug is resolved
  useEffect(() => { fetchStarStatus(); }, [fetchStarStatus]);

  const handleStar = useCallback(async () => {
    // Once starred, disable — same as GitHub (no unstar from this button)
    if (!repo || isStarring) return;
    const nextStarred = !starred;
    const delta = nextStarred ? 1 : -1;
    // Optimistic update
    setStarred(nextStarred);
    setStarCount((prev) => (prev ?? repo.stats.stars) + delta);
    setIsStarring(true);
    try {
      const token = getToken();
      await fetch(`${API_BASE}/api/v1/repositories/${repo.slug ?? name}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ star: nextStarred }),
      });
    } catch {
      // Revert on failure
      setStarred(!nextStarred);
      setStarCount((prev) => (prev ?? repo.stats.stars) - delta);
    } finally {
      setIsStarring(false);
    }
  }, [repo, starred, isStarring, name]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoadingRepo) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-indigo-400 animate-spin" />
          </div>
          <p className="text-white/30 text-sm">Loading repository…</p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error || !repo) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-base">Repository not found</p>
            <p className="text-white/40 text-sm mt-1">{error ?? "This repository does not exist or you don't have access."}</p>
          </div>
          <Link href="/dashboard/repositories" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to repositories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Breadcrumb nav ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-white/35">
          <Link href="/dashboard" className="hover:text-white/60 transition-colors">Dashboard</Link>
          <span className="text-white/15">/</span>
          <Link href="/dashboard/repositories" className="hover:text-white/60 transition-colors">Repositories</Link>
          <span className="text-white/15">/</span>
          <span className="text-white/70 font-medium">{repo.name}</span>
        </div>

        {/* ── Repo header ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111117] to-[#0d0d12] p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2.5">
              {/* Name + badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white">{repo.name}</h1>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                  repo.visibility === "private"
                    ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                    : "border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
                }`}>
                  {repo.visibility}
                </span>
              </div>

              {repo.description && (
                <p className="text-white/45 text-sm max-w-2xl leading-relaxed">{repo.description}</p>
              )}

              {repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {repo.topics.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300/80 border border-violet-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats + interactive star */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {/* Star button — GitHub style */}
              <button
                onClick={handleStar}
                disabled={isStarring}
                title={starred ? "Unstar this repository" : "Star this repository"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  starred
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/5 hover:border-amber-400/20"
                    : "border-white/[0.1] bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.07]"
                }`}
              >
                <svg
                  className={`w-4 h-4 transition-all ${starred ? "fill-amber-400 text-amber-400" : "fill-none text-white/40"}`}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {/* <span>{starred ? "Unstar" : "Star"}</span> */}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ml-0.5 ${
                  starred ? "bg-amber-500/20 text-amber-300" : "bg-white/[0.06] text-white/30"
                }`}>
                  {starCount ?? repo.stats.stars}
                </span>
              </button>

              {/* Forks */}
              <span className="flex items-center gap-1.5 text-sm text-white/40">
                <svg className="w-4 h-4 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-white/55">{repo.stats.forks}</span>
              </span>

              {repo.language && (
                <span className="flex items-center gap-1.5 text-sm text-white/40">
                  <span className={`w-2.5 h-2.5 rounded-full ${langColor(repo.language)}`} />
                  <span className="text-white/55">{repo.language}</span>
                </span>
              )}
              <span className="text-white/20 text-xs">
                {commits.length} commit{commits.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-white/[0.08] cursor-pointer">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px cursor-pointer ${
                activeTab === tab.id
                  ? "border-indigo-400 text-white"
                  : "border-transparent text-white/35 hover:text-white/60"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "commits" && commits.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.06] text-white/30"
                }`}>
                  {commits.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  CODE TAB                                                        */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "code" && (
          <div className="space-y-4">
            {/* Toolbar: branch selector + upload button */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {/* Branch selector */}
                <div className="relative">
                  <select
                    value={currentBranch}
                    onChange={(e) => switchBranch(e.target.value)}
                    className="bg-[#111117] border border-white/[0.1] rounded-lg pl-8 pr-4 py-1.5 text-sm text-white/70 appearance-none focus:outline-none focus:border-indigo-400/40 cursor-pointer hover:border-white/20 transition-colors"
                  >
                    {(repo.branches ?? [currentBranch]).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <svg className="w-3.5 h-3.5 text-indigo-400/60 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
                  </svg>
                </div>

                {/* Breadcrumb */}
                {currentPath !== "." && (
                  <Breadcrumb path={currentPath} onNavigate={navigateTo} />
                )}
              </div>

              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload file
              </button>
            </div>

            {/* Upload success banner */}
            {uploadSuccess && (
              <div className="flex items-center gap-2 text-indigo-300 text-sm bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                File committed successfully!
              </div>
            )}

            {/* Blob viewer (file content) */}
            {activeBlob ? (
              <div className="bg-[#111117] border border-white/[0.08] rounded-2xl overflow-hidden">
                {/* Blob header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-white/[0.015]">
                  <div className="flex items-center gap-3 text-sm min-w-0">
                    <button
                      onClick={closeBlob}
                      className="flex items-center gap-1.5 text-white/35 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <FileIcon name={activeBlob.name} isDir={false} />
                    <span className="text-white/70 font-mono text-xs truncate">{activeBlob.path}</span>
                    <span className="text-white/25 text-xs shrink-0">
                      {activeBlob.size < 1024 ? `${activeBlob.size} B` : `${(activeBlob.size / 1024).toFixed(1)} KB`}
                    </span>
                  </div>
                  <code className="text-xs font-mono text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-md shrink-0">
                    {activeBlob.sha.slice(0, 8)}
                  </code>
                </div>

                {/* Line numbers + content */}
                <div className="overflow-auto max-h-[65vh]">
                  {isLoadingBlob ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-white/30 text-sm">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                      Loading…
                    </div>
                  ) : activeBlob.name.endsWith(".md") ? (
                    <div className="p-6">
                      <MarkdownRenderer content={activeBlob.content} />
                    </div>
                  ) : (
                    <div className="flex">
                      {/* Line numbers */}
                      <div className="select-none px-4 py-4 text-right bg-white/[0.02] border-r border-white/[0.06] min-w-[3.5rem]">
                        {activeBlob.content.split("\n").map((_, idx) => (
                          <div key={idx} className="text-xs text-white/20 font-mono leading-6">{idx + 1}</div>
                        ))}
                      </div>
                      {/* Code */}
                      <pre className="flex-1 p-4 text-sm text-white/75 font-mono overflow-x-auto leading-6">
                        <code>{activeBlob.content}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* File tree */
              <div className="bg-[#111117] border border-white/[0.08] rounded-2xl overflow-hidden">
                {/* Tree header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-white/[0.015] text-xs text-white/30">
                  <span className="font-medium">Name</span>
                  <span>Last commit</span>
                </div>

                {/* Go up row */}
                {currentPath !== "." && currentPath !== "/" && currentPath !== "" && (
                  <button
                    onClick={() => {
                      const parent = currentPath.includes("/")
                        ? currentPath.split("/").slice(0, -1).join("/")
                        : ".";
                      navigateTo(parent);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] text-white/30 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-mono">..</span>
                  </button>
                )}

                {/* Loading */}
                {isLoadingTree ? (
                  <div className="flex items-center justify-center py-16 gap-3 text-white/30 text-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                    Loading files…
                  </div>
                ) : tree.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                      <svg className="w-7 h-7 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/40 text-sm font-medium">This repository is empty</p>
                      <p className="text-white/25 text-xs mt-1">Upload your first file to get started</p>
                    </div>
                    <button
                      onClick={() => setUploadOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Upload a file
                    </button>
                  </div>
                ) : (
                  tree.map((entry, idx) => (
                    <button
                      key={entry.path}
                      onClick={() => {
                        if (entry.type === "dir") {
                          navigateTo(entry.path);
                        } else {
                          openBlob(entry.path);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left group cursor-pointer ${
                        idx !== tree.length - 1 ? "border-b border-white/[0.05]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileIcon name={entry.name} isDir={entry.type === "dir"} />
                        <span className={`text-sm truncate transition-colors ${
                          entry.type === "dir"
                            ? "text-white/80 font-medium group-hover:text-violet-300"
                            : "text-white/60 group-hover:text-white/90"
                        }`}>
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        {entry.lastCommit && (
                          <span className="text-xs text-white/25 truncate max-w-[180px] hidden sm:block">
                            {entry.lastCommit.message}
                          </span>
                        )}
                        {entry.type === "file" && entry.size > 0 && (
                          <span className="text-xs text-white/20 hidden md:block font-mono">
                            {entry.size < 1024 ? `${entry.size} B` : `${(entry.size / 1024).toFixed(1)} KB`}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  COMMITS TAB                                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "commits" && (
          <div className="space-y-3">
            {commits.length === 0 ? (
              <div className="text-center py-24 text-white/25 text-sm">
                No commits yet. Upload a file to create the first commit.
              </div>
            ) : (
              commits.map((c, idx) => (
                <div
                  key={c.id}
                  className="bg-[#111117] border border-white/[0.08] rounded-2xl px-5 py-4 flex items-start justify-between gap-4 hover:border-indigo-500/20 transition-colors group"
                >
                  {/* Left: commit line */}
                  <div className="flex gap-3 min-w-0 flex-1">
                    {/* Connector dots */}
                    <div className="flex flex-col items-center shrink-0 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/60 border border-indigo-400/50 group-hover:bg-indigo-400 transition-colors" />
                      {idx !== commits.length - 1 && (
                        <div className="w-px flex-1 mt-1.5 bg-white/[0.06] min-h-[1.5rem]" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1 pb-1">
                      <p className="text-white/85 text-sm font-medium leading-snug">{c.message}</p>
                      <div className="flex items-center gap-3 text-xs text-white/35 flex-wrap">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {c.authorName}
                        </span>
                        <span>
                          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {c.filePaths.length > 0 && (
                          <span className="text-white/20 font-mono text-[11px]">
                            {c.filePaths.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: stats + hash */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      {c.additions > 0 && (
                        <span className="text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded-md font-mono">+{c.additions}</span>
                      )}
                      {c.deletions > 0 && (
                        <span className="text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded-md font-mono">-{c.deletions}</span>
                      )}
                    </div>
                    <code className="text-[11px] font-mono text-indigo-300/60 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/15">
                      {c.shortHash}
                    </code>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Upload modal ─────────────────────────────────────────────────── */}
      <UploadFileModal
        isOpen={uploadOpen}
        repoName={repo.name}
        branch={currentBranch}
        currentPath={currentPath}
        isUploading={isUploading}
        uploadError={uploadError}
        onUpload={uploadFile}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}
