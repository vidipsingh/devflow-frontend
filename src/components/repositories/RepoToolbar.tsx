
"use client";

import { Search, LayoutGrid, List } from "lucide-react";
import type { ViewMode } from "@/hooks/useRepositoriesPage";
import type { SortKey, RepoVisibility } from "@/hooks/useRepository";

interface Props {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  visibilityFilter: "all" | RepoVisibility;
  setVisibilityFilter: (v: "all" | RepoVisibility) => void;
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
}

const VISIBILITY_TABS: { label: string; value: "all" | RepoVisibility }[] = [
  { label: "All", value: "all" },
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Last updated", value: "updated" },
  { label: "Most stars", value: "stars" },
  { label: "Name A–Z", value: "name" },
];

export default function RepoToolbar({
  searchQuery,
  setSearchQuery,
  visibilityFilter,
  setVisibilityFilter,
  sortKey,
  setSortKey,
  viewMode,
  setViewMode,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search repositories…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
        />
      </div>

      {/* Visibility filter */}
      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-0.5 flex-shrink-0 cursor-pointer">
        {VISIBILITY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setVisibilityFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              visibilityFilter === tab.value
                ? "bg-indigo-600 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex-shrink-0">
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-indigo-500/60 cursor-pointer appearance-none pr-8 relative transition-all"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff60' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1a2e]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* View toggle */}
      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-0.5 flex-shrink-0">
        <button
          onClick={() => setViewMode("grid")}
          title="Grid view"
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            viewMode === "grid"
              ? "bg-indigo-600 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <LayoutGrid size={15} />
        </button>
        <button
          onClick={() => setViewMode("list")}
          title="List view"
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            viewMode === "list"
              ? "bg-indigo-600 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <List size={15} />
        </button>
      </div>
    </div>
  );
}
