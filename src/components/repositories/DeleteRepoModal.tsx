
"use client";

import { useState } from "react";
import type { Repository } from "@/hooks/useRepository";

interface DeleteRepoModalProps {
  isOpen: boolean;
  repo: Repository | null;
  isDeleting: boolean;
  error: string | null;
  onDelete: (slug: string) => Promise<boolean>;
  onClose: () => void;
}

export function DeleteRepoModal({
  isOpen,
  repo,
  isDeleting,
  error,
  onDelete,
  onClose,
}: DeleteRepoModalProps) {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen || !repo) return null;

  const isConfirmed = confirmText === repo.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    const ok = await onDelete(repo.slug);
    if (ok) {
      setConfirmText("");
      onClose();
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-[#0d1117] border border-red-500/20 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">Delete repository</h2>
            <p className="text-white/40 text-xs mt-0.5">This action cannot be undone</p>
          </div>
          <button onClick={handleClose} className="ml-auto text-white/40 hover:text-white transition-colors p-1 rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-2">
            <p className="text-white/70 text-sm">
              You are about to permanently delete{" "}
              <span className="text-white font-semibold">{repo.name}</span>.
            </p>
            <ul className="text-white/40 text-xs space-y-1 list-disc list-inside">
              <li>All files and commit history will be deleted</li>
              <li>This action is irreversible</li>
            </ul>
          </div>

          {/* Type to confirm */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-medium">
              Type <span className="text-white font-mono">{repo.name}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={repo.name}
              className="w-full bg-[#161b22] border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-red-400/50 font-mono"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Deleting…
                </>
              ) : (
                "Delete repository"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
