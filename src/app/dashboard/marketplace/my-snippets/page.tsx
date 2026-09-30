
"use client";

import { useState } from "react";
import Link from "next/link";
import { useMySnippets, type Snippet } from "@/hooks/useMarketplace";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "draft" | "published" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
      status === "published"
        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
        : "bg-white/[0.06] text-white/40 border border-white/10"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "published" ? "bg-emerald-400" : "bg-white/30"}`} />
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

// ─── Snippet row ──────────────────────────────────────────────────────────────

function SnippetRow({
  snippet,
  onPublish,
  onDelete,
  busy,
}: {
  snippet: Snippet;
  onPublish: (id: string, action: "publish" | "unpublish") => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors group">
      {/* Language dot */}
      <div className="w-2 h-2 rounded-full bg-indigo-400/60 flex-shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/marketplace/${snippet.id}`}
            className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors truncate max-w-[260px]"
          >
            {snippet.title}
          </Link>
          <StatusBadge status={snippet.status} />
          {snippet.language && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">
              {snippet.language}
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/35 truncate">{snippet.description || "No description"}</p>
      </div>

      {/* Pricing */}
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-semibold ${snippet.pricing?.type === "paid" ? "text-emerald-400" : "text-white/30"}`}>
          {snippet.pricing?.type === "paid" ? `₹${snippet.pricing.price}` : "Free"}
        </p>
        {snippet.pricing?.type === "paid" && (
          <p className="text-[10px] text-white/25">
            ₹{snippet.earnings?.creatorEarnings?.toFixed(2) ?? "0.00"} earned
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-3 text-[10px] text-white/25 flex-shrink-0">
        <span>{snippet.stats?.downloads ?? 0} ↓</span>
        <span>{snippet.stats?.views ?? 0} views</span>
        {snippet.stats?.ratingCount > 0 && (
          <span>★ {snippet.stats.rating.toFixed(1)}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/dashboard/marketplace/${snippet.id}/edit`}
          className="px-2.5 py-1 text-[10px] font-medium text-white/50 bg-white/[0.05] border border-white/10 rounded-lg hover:bg-white/[0.1] hover:text-white/80 transition-all"
        >
          Edit
        </Link>

        <button
          onClick={() => onPublish(snippet.id, snippet.status === "published" ? "unpublish" : "publish")}
          disabled={busy}
          className={`px-2.5 py-1 text-[10px] font-medium border rounded-lg transition-all disabled:opacity-50 ${
            snippet.status === "published"
              ? "text-amber-400/70 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
              : "text-emerald-400/70 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
          }`}
        >
          {snippet.status === "published" ? "Unpublish" : "Publish"}
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete(snippet.id)}
              disabled={busy}
              className="px-2 py-1 text-[10px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-[10px] font-medium text-white/40 border border-white/10 rounded-lg hover:bg-white/[0.06] transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-2.5 py-1 text-[10px] font-medium text-red-400/60 border border-red-500/15 rounded-lg hover:bg-red-500/10 transition-all"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MySnippetsPage() {
  const { snippets, isLoading, error, publishSnippet, deleteSnippet, refetch } = useMySnippets();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const filtered = snippets.filter((s) =>
    filter === "all" ? true : s.status === filter
  );

  const handlePublish = async (id: string, action: "publish" | "unpublish") => {
    setBusy(true);
    setActionError(null);
    try {
      await publishSnippet(id, action);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await deleteSnippet(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const totalEarnings = snippets.reduce(
    (acc, s) => acc + (s.earnings?.creatorEarnings ?? 0), 0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
            <Link href="/dashboard/marketplace" className="hover:text-white/60 transition-colors">Marketplace</Link>
            <span>/</span>
            <span className="text-white/60">My Snippets</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Snippets</h1>
          <p className="text-sm text-white/40 mt-1">Manage your published code snippets</p>
        </div>
        <Link
          href="/dashboard/marketplace/new"
          className="px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-400 transition-colors shadow shadow-indigo-500/20"
        >
          + New Snippet
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",     value: snippets.length,                                     color: "text-white" },
          { label: "Published", value: snippets.filter((s) => s.status === "published").length, color: "text-emerald-400" },
          { label: "Drafts",    value: snippets.filter((s) => s.status === "draft").length,     color: "text-amber-400" },
          { label: "Earnings",  value: `₹${totalEarnings.toFixed(2)}`,                          color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {actionError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#111118] border border-white/[0.07] rounded-xl p-1 w-fit">
        {(["all", "published", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-2xl overflow-hidden">
        {isLoading && (
          <div className="space-y-px">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.02] animate-pulse border-b border-white/[0.04]" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-white/40 text-sm">{error}</p>
            <button onClick={refetch} className="px-3 py-1.5 bg-white/[0.06] text-xs text-white/60 rounded-lg border border-white/10">Retry</button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-white/20">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M12 18v-6M9 15h6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">
                {filter !== "all" ? `No ${filter} snippets` : "You haven't created any snippets yet"}
              </p>
              <p className="text-white/25 text-xs mt-1">Create a snippet and publish it to the marketplace</p>
            </div>
            <Link
              href="/dashboard/marketplace/new"
              className="px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-400 transition-colors"
            >
              Create Your First Snippet
            </Link>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div>
            {/* Column header */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-b border-white/[0.07] bg-white/[0.02]">
              <div className="w-2 flex-shrink-0" />
              <p className="flex-1 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Snippet</p>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest flex-shrink-0 w-24 text-right">Pricing</p>
              <p className="hidden sm:block text-[10px] font-semibold text-white/30 uppercase tracking-widest flex-shrink-0 w-28 text-right">Stats</p>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest flex-shrink-0 w-40 text-right">Actions</p>
            </div>
            {filtered.map((snippet) => (
              <SnippetRow
                key={snippet.id}
                snippet={snippet}
                onPublish={handlePublish}
                onDelete={handleDelete}
                busy={busy}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
