
"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { Repository } from "@/hooks/useRepository";

interface Props {
  repo: Repository;
  onClose: () => void;
  onConfirm: (slug: string) => Promise<{ ok: boolean; error?: string }>;
  isDeleting: boolean;
}

export default function DeleteRepoModal({ repo, onClose, onConfirm, isDeleting }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isMatch = confirmText === repo.name;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleDelete() {
    setError(null);
    const { ok, error: err } = await onConfirm(repo.name);
    if (!ok) {
      setError(err ?? "Failed to delete repository.");
    }
    // parent will close + refetch on success
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#111117] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
              <Trash2 size={15} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Delete repository</h2>
              <p className="text-xs text-white/40 mt-0.5">This action is irreversible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Warning */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
            <p className="text-sm text-red-300/90 leading-relaxed">
              This will permanently delete the{" "}
              <span className="font-semibold text-white">{repo.name}</span> repository,
              all its content, branches, and history. This cannot be undone.
            </p>
          </div>

          {/* Confirmation input */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Type{" "}
              <span className="font-mono font-semibold text-white">{repo.name}</span>{" "}
              to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => { setConfirmText(e.target.value); setError(null); }}
              placeholder={repo.name}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}
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
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {isDeleting ? (
              <><Loader2 size={14} className="animate-spin" /> Deleting…</>
            ) : (
              <><Trash2 size={14} /> Delete repository</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
