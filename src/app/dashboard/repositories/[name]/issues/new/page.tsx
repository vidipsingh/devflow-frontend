
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useIssues, IssueLabel } from "@/hooks/useIssues";

// ─── Preset label colours ─────────────────────────────────────────────────────
const PRESET_LABELS: IssueLabel[] = [
  { name: "bug", color: "#ef4444" },
  { name: "enhancement", color: "#6366f1" },
  { name: "documentation", color: "#3b82f6" },
  { name: "question", color: "#8b5cf6" },
  { name: "good first issue", color: "#10b981" },
  { name: "help wanted", color: "#f59e0b" },
  { name: "invalid", color: "#6b7280" },
  { name: "wontfix", color: "#1f2937" },
];

function LabelPill({
  label,
  selected,
  onToggle,
}: {
  label: IssueLabel;
  selected: boolean;
  onToggle: () => void;
}) {
  const bg = label.color;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
        selected ? "ring-2 ring-white/30 scale-105" : "opacity-60 hover:opacity-90"
      }`}
      style={{
        backgroundColor: bg + "22",
        color: bg,
        borderColor: bg + "55",
      }}
    >
      {selected && (
        <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {label.name}
    </button>
  );
}

// ─── Simple write/preview tab editor ─────────────────────────────────────────
function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minRows = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const [preview, setPreview] = useState(false);

  const renderPreview = (text: string) => {
    if (!text.trim()) return <p className="text-white/25 text-sm italic">Nothing to preview.</p>;
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold text-white mt-4 mb-1">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold text-white mt-3 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-medium text-white mt-2 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith("- ") || line.startsWith("* "))
        return <li key={i} className="text-white/65 text-sm ml-4 list-disc">{line.slice(2)}</li>;
      if (line.startsWith("> "))
        return <blockquote key={i} className="border-l-2 border-indigo-400/50 pl-3 text-white/50 text-sm italic">{line.slice(2)}</blockquote>;
      if (line.startsWith("```"))
        return <div key={i} className="text-white/30 text-xs font-mono">{line}</div>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-white/70 text-sm leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="border border-white/[0.08] rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/[0.08] bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            !preview ? "text-white border-b-2 border-indigo-400" : "text-white/40 hover:text-white/70"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            preview ? "text-white border-b-2 border-indigo-400" : "text-white/40 hover:text-white/70"
          }`}
        >
          Preview
        </button>
        <div className="ml-auto px-3 py-2 flex items-center gap-1 text-white/20 text-xs">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm2 2a1 1 0 000 2h8a1 1 0 100-2H6zm0 3a1 1 0 000 2h4a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Markdown supported
        </div>
      </div>

      {preview ? (
        <div className="p-4 min-h-[160px] space-y-1 bg-[#0d0d14]">
          {renderPreview(value)}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="w-full bg-[#0d0d14] px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-y focus:outline-none leading-relaxed"
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewIssuePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const router = useRouter();
  const { createIssue, actionLoading, actionError, setActionError } = useIssues(name);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<IssueLabel[]>([]);
  const [milestone, setMilestone] = useState("");
  const [titleError, setTitleError] = useState("");

  const toggleLabel = (label: IssueLabel) => {
    setSelectedLabels((prev) =>
      prev.some((l) => l.name === label.name)
        ? prev.filter((l) => l.name !== label.name)
        : [...prev, label]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setTitleError("Title is required"); return; }
    if (title.trim().length > 256) { setTitleError("Title must be 256 characters or less"); return; }
    setTitleError("");
    setActionError(null);

    const issue = await createIssue({
      title: title.trim(),
      body: body.trim(),
      labels: selectedLabels,
      milestone: milestone.trim() || undefined,
    });

    if (issue) {
      router.push(`/dashboard/repositories/${name}/issues/${issue.number}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

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
          <Link href={`/dashboard/repositories/${name}/issues`} className="hover:text-white transition-colors">
            Issues
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70">New</span>
        </div>

        {/* ── Heading ────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white">Open a new issue</h1>
          <p className="text-white/40 text-sm mt-1">
            Report a bug, request a feature, or start a discussion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Title ──────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(""); }}
              placeholder="Short, descriptive title"
              maxLength={256}
              className={`w-full bg-[#0d0d14] border rounded-xl px-4 py-2.5 text-white/90 text-sm placeholder-white/20 focus:outline-none transition-colors ${
                titleError
                  ? "border-red-400/50 focus:border-red-400"
                  : "border-white/[0.08] focus:border-indigo-400/50"
              }`}
            />
            {titleError && <p className="text-red-400 text-xs">{titleError}</p>}
            <p className="text-white/25 text-xs text-right">{title.length}/256</p>
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">
              Description <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder={`Describe the issue in detail.\n\nYou can use **Markdown** formatting:\n- Lists\n- \`code\`\n- > quotes`}
              minRows={10}
            />
          </div>

          {/* ── Labels ─────────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            <label className="text-white/70 text-sm font-medium">
              Labels <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_LABELS.map((label) => (
                <LabelPill
                  key={label.name}
                  label={label}
                  selected={selectedLabels.some((l) => l.name === label.name)}
                  onToggle={() => toggleLabel(label)}
                />
              ))}
            </div>
            {selectedLabels.length > 0 && (
              <p className="text-white/30 text-xs">
                Selected: {selectedLabels.map((l) => l.name).join(", ")}
              </p>
            )}
          </div>

          {/* ── Milestone ──────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">
              Milestone <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder="e.g. v1.0, Q3 2025"
              className="w-full bg-[#0d0d14] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white/90 text-sm placeholder-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors max-w-xs"
            />
          </div>

          {/* ── Error ──────────────────────────────────────────────────── */}
          {actionError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {actionError}
            </div>
          )}

          <div className="border-t border-white/[0.06]" />

          {/* ── Actions ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={actionLoading || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {actionLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit new issue
                </>
              )}
            </button>
            <Link
              href={`/dashboard/repositories/${name}/issues`}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
