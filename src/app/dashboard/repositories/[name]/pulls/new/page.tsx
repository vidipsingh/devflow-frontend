
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePullRequests, PRLabel } from "@/hooks/usePullRequests";
import { useRepoDetail } from "@/hooks/useRepoDetail";

const PRESET_LABELS: PRLabel[] = [
  { name: "bug", color: "d73a4a" },
  { name: "enhancement", color: "a2eeef" },
  { name: "feature", color: "0075ca" },
  { name: "documentation", color: "0075ca" },
  { name: "refactor", color: "e4e669" },
  { name: "test", color: "bfd4f2" },
  { name: "breaking change", color: "e11d48" },
  { name: "good first issue", color: "7057ff" },
];

export default function NewPRPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const router = useRouter();
  const { createPR, actionLoading, actionError, setActionError } = usePullRequests(name);
  const { repo } = useRepoDetail(name);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [headBranch, setHeadBranch] = useState("");
  const [baseBranch, setBaseBranch] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<PRLabel[]>([]);
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill base branch from repo default
  useEffect(() => {
    if (repo?.defaultBranch && !baseBranch) {
      setBaseBranch(repo.defaultBranch);
    }
  }, [repo, baseBranch]);

  const branches = repo?.branches ?? [];

  function toggleLabel(label: PRLabel) {
    setSelectedLabels((prev) =>
      prev.some((l) => l.name === label.name)
        ? prev.filter((l) => l.name !== label.name)
        : [...prev, label]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    if (!title.trim()) return;
    if (!headBranch || !baseBranch) return;
    if (headBranch === baseBranch) {
      setActionError("Head and base branches must be different.");
      return;
    }

    const pr = await createPR({
      title: title.trim(),
      body: body.trim(),
      headBranch,
      baseBranch,
      isDraft,
      labels: selectedLabels,
    });

    if (pr) {
      setSubmitted(true);
      router.push(`/dashboard/repositories/${name}/pulls/${pr.number}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/dashboard/repositories" className="hover:text-white transition-colors">
            Repositories
          </Link>
          <span className="text-white/20">/</span>
          <Link href={`/dashboard/repositories/${name}`} className="hover:text-white transition-colors">
            {name}
          </Link>
          <span className="text-white/20">/</span>
          <Link href={`/dashboard/repositories/${name}/pulls`} className="hover:text-white transition-colors">
            Pull Requests
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70">New</span>
        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-bold text-white">Open a pull request</h1>
          <p className="text-white/35 text-sm mt-1">
            Propose changes and request a review before merging into the base branch.
          </p>
        </div>

        {/* ── Branch comparison bar ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap bg-[#0d0d14] border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <svg className="w-4 h-4 text-indigo-400/70" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" />
            </svg>
            <span>base:</span>
          </div>
          <select
            value={baseBranch}
            onChange={(e) => setBaseBranch(e.target.value)}
            className="bg-[#111117] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-indigo-400/40 cursor-pointer"
          >
            <option value="">Select base branch</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>

          <div className="flex items-center gap-2 text-sm text-white/50">
            <span>compare:</span>
          </div>
          <select
            value={headBranch}
            onChange={(e) => setHeadBranch(e.target.value)}
            className="bg-[#111117] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-indigo-400/40 cursor-pointer"
          >
            <option value="">Select head branch</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          {/* Left column */}
          <div className="space-y-4">

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pull request title"
                maxLength={256}
                required
                className="w-full bg-[#0d0d14] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-400/20 transition-colors"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">
                Description
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the changes you made, why you made them, and any relevant context…"
                rows={10}
                className="w-full bg-[#0d0d14] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-400/20 transition-colors resize-y font-mono"
              />
            </div>

            {/* Error */}
            {actionError && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {actionError}
              </div>
            )}

            {/* Submit row */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <Link
                href={`/dashboard/repositories/${name}/pulls`}
                className="text-sm text-white/35 hover:text-white/60 transition-colors"
              >
                Cancel
              </Link>
              <div className="flex items-center gap-3">
                {/* Draft toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-white/45 hover:text-white/70 transition-colors">
                  <div
                    onClick={() => setIsDraft((d) => !d)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                      isDraft ? "bg-indigo-500/60" : "bg-white/[0.08]"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isDraft ? "translate-x-4" : ""}`} />
                  </div>
                  Draft
                </label>

                <button
                  type="submit"
                  disabled={actionLoading || submitted || !title.trim() || !headBranch || !baseBranch}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-900/30"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
                      </svg>
                      {isDraft ? "Create draft PR" : "Create pull request"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Labels */}
            <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Labels</span>
                  <button
                    type="button"
                    onClick={() => setLabelPickerOpen((o) => !o)}
                    className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {labelPickerOpen && (
                <div className="p-3 space-y-1 border-b border-white/[0.06]">
                  {PRESET_LABELS.map((label) => {
                    const active = selectedLabels.some((l) => l.name === label.name);
                    const bg = `#${label.color}`;
                    return (
                      <button
                        key={label.name}
                        type="button"
                        onClick={() => toggleLabel(label)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: bg }}
                        />
                        <span className="text-white/70">{label.name}</span>
                        {active && (
                          <svg className="w-3 h-3 text-indigo-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="px-4 py-3 min-h-[2.5rem]">
                {selectedLabels.length === 0 ? (
                  <span className="text-white/20 text-xs">None yet</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLabels.map((l) => {
                      const bg = `#${l.color}`;
                      return (
                        <span
                          key={l.name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: bg + "33", color: bg, border: `1px solid ${bg}55` }}
                        >
                          {l.name}
                          <button
                            type="button"
                            onClick={() => toggleLabel(l)}
                            className="cursor-pointer opacity-60 hover:opacity-100"
                          >×</button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Info card */}
            <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Branch summary</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/35">Base</span>
                  <code className={`font-mono px-2 py-0.5 rounded text-indigo-300 ${baseBranch ? "bg-indigo-500/10" : "text-white/20 bg-white/[0.04]"}`}>
                    {baseBranch || "not selected"}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/35">Compare</span>
                  <code className={`font-mono px-2 py-0.5 rounded ${headBranch ? "text-emerald-300 bg-emerald-500/10" : "text-white/20 bg-white/[0.04]"}`}>
                    {headBranch || "not selected"}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/35">Draft</span>
                  <span className={`px-2 py-0.5 rounded ${isDraft ? "text-amber-300 bg-amber-500/10" : "text-white/25 bg-white/[0.04]"}`}>
                    {isDraft ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
