
"use client";

import { useState } from "react";
import Link from "next/link";
import { useMarketplaceBrowse, type Snippet } from "@/hooks/useMarketplace";

// ─── helpers ──────────────────────────────────────────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "text-blue-400 bg-blue-400/10",
  javascript: "text-yellow-400 bg-yellow-400/10",
  python:     "text-green-400 bg-green-400/10",
  go:         "text-cyan-400 bg-cyan-400/10",
  rust:       "text-orange-400 bg-orange-400/10",
  java:       "text-red-400 bg-red-400/10",
  cpp:        "text-pink-400 bg-pink-400/10",
  c:          "text-purple-400 bg-purple-400/10",
};

function langColor(lang: string) {
  return LANGUAGE_COLORS[lang?.toLowerCase()] ?? "text-zinc-400 bg-zinc-400/10";
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            width="12" height="12" viewBox="0 0 12 12"
            className={i <= full ? "text-amber-400" : half && i === full + 1 ? "text-amber-400/60" : "text-white/15"}
            fill="currentColor"
          >
            <path d="M6 1l1.2 2.4L10 3.8l-2 1.95.47 2.76L6 7.4l-2.47 1.1.47-2.76L2 3.8l2.8-.4L6 1z" />
          </svg>
        ))}
      </div>
      <span className="text-[10px] text-white/40">{count > 0 ? `(${count})` : "no reviews"}</span>
    </div>
  );
}

function SnippetCard({ snippet }: { snippet: Snippet }) {
  return (
    <Link
      href={`/dashboard/marketplace/${snippet.id}`}
      className="group flex flex-col bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200"
    >
      {/* Preview / code banner */}
      <div className="relative h-28 bg-[#0a0a12] border-b border-white/[0.06] overflow-hidden flex items-start p-3">
        <pre className="text-[9px] leading-relaxed text-white/25 font-mono whitespace-pre overflow-hidden select-none group-hover:text-white/35 transition-colors">
          {(snippet.preview || snippet.code || "").slice(0, 300)}
        </pre>
        {/* Fade overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a12]/40 to-[#0a0a12]" />
        {/* Language badge */}
        <span className={`absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${langColor(snippet.language)}`}>
          {snippet.language || "code"}
        </span>
        {/* Pricing badge */}
        <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
          snippet.pricing?.type === "paid"
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-white/10 text-white/50"
        }`}>
          {snippet.pricing?.type === "paid"
            ? `₹${snippet.pricing.price}`
            : "FREE"}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
            {snippet.title}
          </h3>
          <p className="text-[11px] text-white/45 mt-0.5 line-clamp-2 leading-relaxed">
            {snippet.description || "No description provided."}
          </p>
        </div>

        {/* Tags */}
        {snippet.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {snippet.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.06]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/[0.05]">
          <StarRating rating={snippet.stats?.rating ?? 0} count={snippet.stats?.ratingCount ?? 0} />
          <div className="flex items-center gap-2.5 text-[10px] text-white/30">
            <span className="flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2v9M4 7l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 13h12" strokeLinecap="round" />
              </svg>
              {snippet.stats?.downloads ?? 0}
            </span>
            <span className="flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" strokeLinecap="round" />
                <circle cx="8" cy="8" r="1.5" />
              </svg>
              {snippet.stats?.views ?? 0}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-white/25">by @{snippet.creatorUsername || "unknown"}</p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "downloads", label: "Most Downloaded" },
  { value: "rating",    label: "Top Rated" },
  { value: "recent",    label: "Recently Published" },
  { value: "purchases", label: "Most Purchased" },
];

export default function MarketplacePage() {
  const [sort, setSort] = useState("downloads");
  const [search, setSearch] = useState("");
  const { snippets, isLoading, error, refetch } = useMarketplaceBrowse(sort, 50);

  const filtered = snippets.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.language?.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q)) ||
      s.creatorUsername?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Marketplace</h1>
          <p className="text-sm text-white/40 mt-1">
            Browse, buy and download community code snippets &amp; projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/marketplace/my-snippets"
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs font-medium border border-white/10 hover:bg-white/10 hover:text-white transition-all"
          >
            My Snippets
          </Link>
          <Link
            href="/dashboard/marketplace/purchases"
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs font-medium border border-white/10 hover:bg-white/10 hover:text-white transition-all"
          >
            My Purchases
          </Link>
          <Link
            href="/dashboard/marketplace/new"
            className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-400 transition-colors shadow shadow-indigo-500/20"
          >
            + Publish Snippet
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Snippets",  value: snippets.length, icon: "📦" },
          { label: "Free Snippets",   value: snippets.filter((s) => s.pricing?.type === "free").length, icon: "🆓" },
          { label: "Paid Snippets",   value: snippets.filter((s) => s.pricing?.type === "paid").length, icon: "💰" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111118] border border-white/[0.07] rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">{stat.icon}</span>
            <div>
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search snippets, language, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#111118] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 bg-[#111118] border border-white/10 rounded-lg text-sm text-white/70 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-[#111118] border border-white/[0.07] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-white/50 text-sm">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-white/[0.06] text-white/70 text-xs rounded-lg border border-white/10 hover:bg-white/10 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-white/[0.07] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-white/20">
              <path d="M3 3h7l2 3h9a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white/60 text-sm font-medium">
              {search ? "No snippets match your search" : "No published snippets yet"}
            </p>
            <p className="text-white/30 text-xs mt-1">
              {search ? "Try a different search term" : "Be the first to publish a snippet!"}
            </p>
          </div>
          {!search && (
            <Link
              href="/dashboard/marketplace/new"
              className="px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-400 transition-colors"
            >
              Publish a Snippet
            </Link>
          )}
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <SnippetCard key={s.id} snippet={s} />
          ))}
        </div>
      )}
    </div>
  );
}
