
"use client";

import { FolderSearch, X } from "lucide-react";

interface Props {
  hasSearch: boolean;
  onClearSearch: () => void;
}

export default function RepoEmptyState({ hasSearch, onClearSearch }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
        <FolderSearch size={28} className="text-white/25" />
      </div>
      <h3 className="text-base font-semibold text-white/60 mb-1.5">
        {hasSearch ? "No repositories found" : "No repositories yet"}
      </h3>
      <p className="text-sm text-white/30 max-w-xs leading-relaxed">
        {hasSearch
          ? "Try adjusting your search or filter to find what you're looking for."
          : "Create your first repository to get started on DevFlow."}
      </p>
      {hasSearch && (
        <button
          onClick={onClearSearch}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/15 transition-all"
        >
          <X size={14} />
          Clear search
        </button>
      )}
    </div>
  );
}
