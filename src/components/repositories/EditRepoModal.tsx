
"use client";

import { useState, useEffect } from "react";
import type { Repository } from "@/hooks/useRepository";
import type { UpdateRepoPayload } from "@/hooks/useRepoActions";

const LANGUAGES = [
  "Go", "TypeScript", "JavaScript", "Python", "Rust", "Java", "C++", "Ruby",
  "C#", "PHP", "Swift", "Kotlin", "Scala", "Elixir", "Haskell", "Dart",
  "Shell", "YAML", "Makefile", "Other",
];

interface EditRepoModalProps {
  isOpen: boolean;
  repo: Repository | null;
  isUpdating: boolean;
  error: string | null;
  onUpdate: (slug: string, payload: UpdateRepoPayload) => Promise<boolean>;
  onClose: () => void;
}

export function EditRepoModal({
  isOpen,
  repo,
  isUpdating,
  error,
  onUpdate,
  onClose,
}: EditRepoModalProps) {
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [topicsInput, setTopicsInput] = useState("");
  const [language, setLanguage] = useState("");
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [topicDraft, setTopicDraft] = useState("");

  // Sync state from repo when modal opens
  useEffect(() => {
    if (repo && isOpen) {
      setDescription(repo.description ?? "");
      setVisibility(repo.visibility);
      setTopicsInput((repo.topics ?? []).join(", "));
      setTopicTags(repo.topics ?? []);
      setTopicDraft("");
      setLanguage(repo.language ?? "");
    }
  }, [repo, isOpen]);

  if (!isOpen || !repo) return null;

  function addTopic(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !topicTags.includes(tag) && topicTags.length < 10) {
      setTopicTags((prev) => [...prev, tag]);
    }
    setTopicDraft("");
  }

  function removeTopic(tag: string) {
    setTopicTags((prev) => prev.filter((t) => t !== tag));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onUpdate(repo.slug, {
      description: description.trim(),
      visibility,
      topics: topicTags,
    });
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0d1117] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Gradient top border */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Edit repository</h2>
              <p className="text-white/35 text-xs mt-0.5 font-mono">{repo.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-medium uppercase tracking-widest">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of this repository…"
              className="w-full bg-[#111117] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white/80 text-sm placeholder-white/15 focus:outline-none focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-400/10 resize-none transition-all"
            />
            <p className="text-white/25 text-xs">{description.length}/256</p>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-medium uppercase tracking-widest">
              Primary language
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#111117] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white/70 text-sm focus:outline-none focus:border-indigo-400/40 appearance-none cursor-pointer transition-all"
              >
                <option value="">— No language —</option>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <svg className="w-4 h-4 text-white/25 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-white/50 text-xs font-medium uppercase tracking-widest">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(["public", "private"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                    visibility === v
                      ? v === "public"
                        ? "border-indigo-400/40 bg-indigo-500/10 text-white"
                        : "border-amber-400/40 bg-amber-500/10 text-white"
                      : "border-white/[0.07] text-white/35 hover:text-white/55 hover:border-white/15"
                  }`}
                >
                  {v === "public" ? (
                    <svg className={`w-4 h-4 ${visibility === v ? "text-indigo-400" : "text-white/25"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className={`w-4 h-4 ${visibility === v ? "text-amber-400" : "text-white/25"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  <div className="text-left">
                    <p className="capitalize font-medium text-sm leading-none">{v}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {v === "public" ? "Anyone can view" : "Only you can view"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Topics — tag input */}
          <div className="space-y-2">
            <label className="text-white/50 text-xs font-medium uppercase tracking-widest">
              Topics <span className="text-white/20 normal-case font-normal">({topicTags.length}/10)</span>
            </label>

            {/* Existing tags */}
            {topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#111117] border border-white/[0.07] rounded-xl">
                {topicTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTopic(tag)}
                      className="text-violet-300/50 hover:text-violet-200 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add topic input */}
            <div className="relative">
              <input
                type="text"
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTopic(topicDraft); }
                  if (e.key === "," || e.key === " ") { e.preventDefault(); addTopic(topicDraft); }
                }}
                placeholder="Add topic… (press Enter or comma)"
                className="w-full bg-[#111117] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white/70 text-sm placeholder-white/15 focus:outline-none focus:border-indigo-400/40 transition-all"
              />
              {topicDraft.trim() && (
                <button
                  type="button"
                  onClick={() => addTopic(topicDraft)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 text-red-300 text-sm bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:bg-white/[0.04] hover:text-white/70 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
