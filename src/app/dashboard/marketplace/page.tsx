
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  useMarketplaceSearch,
  type Snippet,
  type SnippetSearchParams,
} from "@/hooks/useMarketplace";

// ─── constants ────────────────────────────────────────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
  typescript:  "text-blue-400 bg-blue-400/10",
  javascript:  "text-yellow-400 bg-yellow-400/10",
  python:      "text-green-400 bg-green-400/10",
  go:          "text-cyan-400 bg-cyan-400/10",
  rust:        "text-orange-400 bg-orange-400/10",
  java:        "text-red-400 bg-red-400/10",
  cpp:         "text-pink-400 bg-pink-400/10",
  c:           "text-purple-400 bg-purple-400/10",
  ruby:        "text-rose-400 bg-rose-400/10",
  php:         "text-violet-400 bg-violet-400/10",
  swift:       "text-orange-300 bg-orange-300/10",
  kotlin:      "text-indigo-400 bg-indigo-400/10",
};

const LANGUAGE_ICONS: Record<string, string> = {
  typescript: "TS", javascript: "JS", python: "Py", go: "Go",
  rust: "Rs", java: "Jv", cpp: "C+", c: "C",
  ruby: "Rb", php: "Ph", swift: "Sw", kotlin: "Kt",
};

const LANGUAGES = [
  "TypeScript","JavaScript","Python","Go","Rust","Java","C++","C",
  "Ruby","PHP","Swift","Kotlin",
];

const SORT_OPTIONS: { value: NonNullable<SnippetSearchParams["sort"]>; label: string; icon: string }[] = [
  { value: "popular",    label: "Most Downloaded", icon: "↓" },
  { value: "rating",     label: "Top Rated",        icon: "★" },
  { value: "recent",     label: "Recently Published", icon: "🕐" },
  { value: "price_asc",  label: "Price: Low → High", icon: "↑₹" },
  { value: "price_desc", label: "Price: High → Low", icon: "↓₹" },
];

const PAGE_SIZE = 20;

// ─── helpers ──────────────────────────────────────────────────────────────────

function langColor(lang: string) {
  return LANGUAGE_COLORS[lang?.toLowerCase()] ?? "text-zinc-400 bg-zinc-400/10";
}

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

interface DropdownOption { value: string; label: string; icon?: string }

function CustomDropdown({
  value,
  options,
  placeholder,
  onChange,
  triggerClass,
  width = "w-52",
}: {
  value: string;
  options: DropdownOption[];
  placeholder: string;
  onChange: (v: string) => void;
  triggerClass?: string;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${width}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all text-sm font-medium ${
          open
            ? "bg-[#16162a] border-indigo-500/60 text-white"
            : "bg-[#111118] border-white/[0.09] text-white/70 hover:border-white/20 hover:text-white"
        } ${triggerClass ?? ""}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.icon && (
            <span className="text-xs font-bold opacity-60 shrink-0">{selected.icon}</span>
          )}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <svg
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-indigo-400" : "text-white/30"}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          stroke="currentColor" strokeWidth="2"
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-[#13131f] border border-white/[0.09] rounded-xl shadow-2xl shadow-black/40 overflow-hidden py-1">
          {/* Clear option */}
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors flex items-center gap-2"
            >
              <span className="text-[10px] opacity-50">✕</span>
              {placeholder}
            </button>
          )}
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                o.value === value
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {o.icon && (
                <span className={`text-[10px] font-bold w-5 text-center shrink-0 ${
                  o.value === value ? "text-indigo-400" : "opacity-40"
                }`}>{o.icon}</span>
              )}
              <span>{o.label}</span>
              {o.value === value && (
                <svg className="ml-auto shrink-0 text-indigo-400" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Price Range Input ────────────────────────────────────────────────────────

function PriceInput({
  value,
  placeholder,
  onChange,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-xs text-white/30 font-medium select-none pointer-events-none">₹</span>
      <input
        type="number"
        min={0}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => e.key === "Enter" && onCommit()}
        className="w-28 pl-7 pr-3 py-2 bg-[#111118] border border-white/[0.09] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-[#16162a] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

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
            className={
              i <= full ? "text-amber-400"
              : half && i === full + 1 ? "text-amber-400/60"
              : "text-white/15"
            }
            fill="currentColor"
          >
            <path d="M6 1l1.2 2.4L10 3.8l-2 1.95.47 2.76L6 7.4l-2.47 1.1.47-2.76L2 3.8l2.8-.4L6 1z" />
          </svg>
        ))}
      </div>
      <span className="text-[10px] text-white/40">
        {count > 0 ? `(${count})` : "no reviews"}
      </span>
    </div>
  );
}

function SnippetCard({ snippet }: { snippet: Snippet }) {
  return (
    <Link
      href={`/dashboard/marketplace/${snippet.id}`}
      className="group flex flex-col bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200"
    >
      <div className="relative h-28 bg-[#0a0a12] border-b border-white/[0.06] overflow-hidden flex items-start p-3">
        <pre className="text-[9px] leading-relaxed text-white/25 font-mono whitespace-pre overflow-hidden select-none group-hover:text-white/35 transition-colors">
          {(snippet.preview || snippet.code || "").slice(0, 300)}
        </pre>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a12]/40 to-[#0a0a12]" />
        <span className={`absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${langColor(snippet.language)}`}>
          {snippet.language || "code"}
        </span>
        <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
          snippet.pricing?.type === "paid"
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-white/10 text-white/50"
        }`}>
          {snippet.pricing?.type === "paid" ? `₹${snippet.pricing.price}` : "FREE"}
        </span>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
            {snippet.title}
          </h3>
          <p className="text-[11px] text-white/45 mt-0.5 line-clamp-2 leading-relaxed">
            {snippet.description || "No description provided."}
          </p>
        </div>

        {snippet.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {snippet.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.06]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

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

function SkeletonCard() {
  return <div className="h-64 bg-[#111118] border border-white/[0.07] rounded-xl animate-pulse" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [inputQ, setInputQ]     = useState("");
  const [language, setLanguage] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort]         = useState<NonNullable<SnippetSearchParams["sort"]>>("popular");
  const [page, setPage]         = useState(1);

  const [params, setParams] = useState<SnippetSearchParams>({
    sort: "popular", page: 1, limit: PAGE_SIZE,
  });

  const { snippets, total, totalPages, isLoading, error, search } =
    useMarketplaceSearch(params);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildParams = useCallback((overrides: Partial<SnippetSearchParams> = {}): SnippetSearchParams => ({
    q:        inputQ.trim() || undefined,
    language: language || undefined,
    minPrice: parseFloat(minPrice) > 0 ? parseFloat(minPrice) : undefined,
    maxPrice: parseFloat(maxPrice) > 0 ? parseFloat(maxPrice) : undefined,
    sort,
    page:     1,
    limit:    PAGE_SIZE,
    ...overrides,
  }), [inputQ, language, minPrice, maxPrice, sort]);

  const commitSearch = useCallback((overrides: Partial<SnippetSearchParams> = {}) => {
    const next = buildParams(overrides);
    setPage(next.page ?? 1);
    setParams(next);
  }, [buildParams]);

  function handleQueryChange(val: string) {
    setInputQ(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const next: SnippetSearchParams = {
        q:        val.trim() || undefined,
        language: language || undefined,
        minPrice: parseFloat(minPrice) > 0 ? parseFloat(minPrice) : undefined,
        maxPrice: parseFloat(maxPrice) > 0 ? parseFloat(maxPrice) : undefined,
        sort, page: 1, limit: PAGE_SIZE,
      };
      setPage(1);
      setParams(next);
    }, 400);
  }

  function handleSortChange(val: string) {
    const v = val as NonNullable<SnippetSearchParams["sort"]>;
    setSort(v);
    const next = buildParams({ sort: v, page: 1 });
    setPage(1);
    setParams(next);
  }

  function handleLanguageChange(val: string) {
    setLanguage(val);
    const next = buildParams({ language: val || undefined, page: 1 });
    setPage(1);
    setParams(next);
  }

  function handlePageChange(p: number) {
    setPage(p);
    const next = buildParams({ page: p });
    setParams(next);
  }

  function handleApplyPriceFilter() {
    commitSearch({ page: 1 });
  }

  function handleClearAll() {
    setInputQ(""); setLanguage(""); setMinPrice(""); setMaxPrice(""); setSort("popular"); setPage(1);
    setParams({ sort: "popular", page: 1, limit: PAGE_SIZE });
  }

  const hasActiveFilters = !!(inputQ || language || minPrice || maxPrice || sort !== "popular");

  // Build dropdown option lists
  const langOptions: { value: string; label: string; icon: string }[] = LANGUAGES.map((l) => ({
    value: l,
    label: l,
    icon: LANGUAGE_ICONS[l.toLowerCase()] ?? l.slice(0, 2),
  }));

  const sortOptions = SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Marketplace</h1>
          <p className="text-sm text-white/40 mt-1">
            Browse, buy and download community code snippets &amp; projects
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/dashboard/marketplace/my-snippets"
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs font-medium border border-white/10 hover:bg-white/10 hover:text-white transition-all">
            My Snippets
          </Link>
          <Link href="/dashboard/marketplace/purchases"
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs font-medium border border-white/10 hover:bg-white/10 hover:text-white transition-all">
            My Purchases
          </Link>
          <Link href="/dashboard/marketplace/new"
            className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-400 transition-colors shadow shadow-indigo-500/20">
            + Publish Snippet
          </Link>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Results", value: total, icon: "📦" },
          { label: "Free Snippets", value: snippets.filter((s) => s.pricing?.type === "free").length, icon: "🆓" },
          { label: "Paid Snippets", value: snippets.filter((s) => s.pricing?.type === "paid").length, icon: "💰" },
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

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-[#0d0d14] border border-white/[0.07] rounded-2xl p-5 space-y-4">

        {/* Row 1: search + sort */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
              width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5L14 14" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search title, description, tags…"
              value={inputQ}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#111118] border border-white/[0.09] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-[#16162a] transition-all"
            />
            {inputQ && (
              <button
                onClick={() => handleQueryChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <CustomDropdown
            value={sort}
            options={sortOptions}
            placeholder="Sort by"
            onChange={handleSortChange}
            width="w-52"
          />

          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.07] transition-all"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 1l8 8M9 1L1 9" strokeLinecap="round" />
              </svg>
              Clear all
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.05]" />

        {/* Row 2: language + price range + active chips */}
        <div className="flex items-center gap-4 flex-wrap">

          {/* Language dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 font-medium shrink-0">Language</span>
            <CustomDropdown
              value={language}
              options={langOptions}
              placeholder="All Languages"
              onChange={handleLanguageChange}
              width="w-44"
            />
          </div>

          {/* Price range */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 font-medium shrink-0">Price</span>
            <PriceInput
              value={minPrice}
              placeholder="Min"
              onChange={setMinPrice}
              onCommit={handleApplyPriceFilter}
            />
            <span className="text-white/20 text-sm font-light">–</span>
            <PriceInput
              value={maxPrice}
              placeholder="Max"
              onChange={setMaxPrice}
              onCommit={handleApplyPriceFilter}
            />
          </div>

          {/* Active filter chips */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {language && (
              <span className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border font-medium ${langColor(language)}`}>
                <span className="font-bold">{LANGUAGE_ICONS[language.toLowerCase()] ?? language.slice(0,2)}</span>
                {language}
                <button onClick={() => handleLanguageChange("")}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">×</button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                ₹{minPrice || "0"} – ₹{maxPrice || "∞"}
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); commitSearch({ minPrice: undefined, maxPrice: undefined, page: 1 }); }}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">×</button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Results summary ───────────────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            {total === 0 ? "No results" : `${total} snippet${total !== 1 ? "s" : ""} found`}
            {inputQ ? ` for "${inputQ}"` : ""}
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-white/30">Page {page} of {totalPages}</p>
          )}
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-white/50 text-sm">{error}</p>
          <button onClick={() => search(params)}
            className="px-4 py-2 bg-white/[0.06] text-white/70 text-xs rounded-lg border border-white/10 hover:bg-white/10 transition-all">
            Retry
          </button>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!isLoading && !error && snippets.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-white/[0.07] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-white/20">
              <path d="M3 3h7l2 3h9a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white/60 text-sm font-medium">
              {hasActiveFilters ? "No snippets match your filters" : "No published snippets yet"}
            </p>
            <p className="text-white/30 text-xs mt-1">
              {hasActiveFilters ? "Try adjusting your search or filters" : "Be the first to publish a snippet!"}
            </p>
          </div>
          {hasActiveFilters ? (
            <button onClick={handleClearAll}
              className="px-4 py-2 bg-white/[0.06] text-white/60 text-xs font-semibold rounded-lg hover:bg-white/10 border border-white/10 transition-colors">
              Clear Filters
            </button>
          ) : (
            <Link href="/dashboard/marketplace/new"
              className="px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-400 transition-colors">
              Publish a Snippet
            </Link>
          )}
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      {!isLoading && !error && snippets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {snippets.map((s) => <SnippetCard key={s.id} snippet={s} />)}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg bg-[#111118] border border-white/10 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p: number;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
            return (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                  p === page
                    ? "bg-indigo-500 text-white shadow shadow-indigo-500/30"
                    : "bg-[#111118] border border-white/10 text-white/50 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg bg-[#111118] border border-white/10 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}

    </div>
  );
}
