
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, Lock, Globe } from "lucide-react";
import type { Repository } from "@/hooks/useRepository";
import type { UpdateRepoPayload } from "@/hooks/useRepoActions";

interface Props {
  repo: Repository;
  onClose: () => void;
  onSave: (slug: string, payload: UpdateRepoPayload) => Promise<{ ok: boolean; error?: string }>;
  isSaving: boolean;
}

export default function EditRepoModal({ repo, onClose, onSave, isSaving }: Props) {
  const [description, setDescription] = useState(repo.description);
  const [visibility, setVisibility] = useState<"public" | "private">(repo.visibility);
  const [topicsInput, setTopicsInput] = useState(repo.topics.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSave() {
    setError(null);
    const topics = topicsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const { ok, error: err } = await onSave(repo.name, {
      description,
      visibility,
      topics,
    });

    if (!ok) {
      setError(err ?? "Failed to update repository.");
      return;
    }
    setSuccess(true);
    setTimeout(onClose, 900);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111117] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-semibold text-white">Edit repository</h2>
            <p className="text-xs text-white/40 mt-0.5">{repo.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 size={15} /> Saved successfully!
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Short description of your repository…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 transition-all resize-none"
            />
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Topics
              <span className="ml-1 font-normal text-white/30">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              placeholder="go, api, mongodb"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 transition-all"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Visibility</label>
            <div className="flex gap-2">
              {(["public", "private"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    visibility === v
                      ? "border-indigo-500/60 bg-indigo-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  {v === "public" ? <Globe size={14} className="text-emerald-400" /> : <Lock size={14} className="text-rose-400" />}
                  <span className="capitalize">{v}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/8 border border-white/10 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || success}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
