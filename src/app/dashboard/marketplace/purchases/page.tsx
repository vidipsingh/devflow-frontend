
"use client";

import Link from "next/link";
import { useMyPurchases } from "@/hooks/useMarketplace";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatAmount(paise: number, currency = "INR") {
  const amount = paise / 100;
  if (currency === "INR") return `₹${amount.toFixed(2)}`;
  return `${currency} ${amount.toFixed(2)}`;
}

export default function PurchasesPage() {
  const { purchases, isLoading, error, refetch } = useMyPurchases();

  const totalSpent = purchases.reduce((acc, p) => acc + (p.amountPaise / 100), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
          <Link href="/dashboard/marketplace" className="hover:text-white/60 transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="text-white/60">My Purchases</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Purchases</h1>
        <p className="text-sm text-white/40 mt-1">All snippets you&apos;ve purchased</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
          <p className="text-xl font-bold text-white">{purchases.length}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-wide mt-0.5">Total Purchases</p>
        </div>
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
          <p className="text-xl font-bold text-emerald-400">₹{totalSpent.toFixed(2)}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-wide mt-0.5">Total Spent</p>
        </div>
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
            <button onClick={refetch} className="px-3 py-1.5 bg-white/[0.06] text-xs text-white/60 rounded-lg border border-white/10">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && purchases.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-white/20">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">No purchases yet</p>
              <p className="text-white/25 text-xs mt-1">Browse the marketplace to find great snippets</p>
            </div>
            <Link
              href="/dashboard/marketplace"
              className="px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-400 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        )}

        {!isLoading && !error && purchases.length > 0 && (
          <div>
            {/* Column header */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-b border-white/[0.07] bg-white/[0.02]">
              <p className="flex-1 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Snippet</p>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest w-20 text-right">Amount</p>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest w-28 text-right">Date</p>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest w-20 text-right">Status</p>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest w-20 text-right">Actions</p>
            </div>

            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                {/* Snippet link */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <Link
                    href={`/dashboard/marketplace/${purchase.snippetId}`}
                    className="text-sm font-medium text-white hover:text-indigo-300 transition-colors truncate block"
                  >
                    Snippet
                  </Link>
                  <p className="text-[10px] text-white/25 font-mono truncate">
                    {purchase.razorpayOrderId || purchase.id}
                  </p>
                </div>

                {/* Amount */}
                <p className="text-sm font-semibold text-emerald-400 w-20 text-right flex-shrink-0">
                  {formatAmount(purchase.amountPaise, purchase.currency)}
                </p>

                {/* Date */}
                <p className="text-xs text-white/40 w-28 text-right flex-shrink-0">
                  {formatDate(purchase.paidAt ?? purchase.createdAt)}
                </p>

                {/* Status */}
                <div className="w-20 text-right flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    purchase.status === "paid"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : purchase.status === "failed"
                      ? "bg-red-500/15 text-red-400 border border-red-500/20"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      purchase.status === "paid" ? "bg-emerald-400"
                      : purchase.status === "failed" ? "bg-red-400"
                      : "bg-amber-400"
                    }`} />
                    {purchase.status}
                  </span>
                </div>

                {/* Action */}
                <div className="w-20 text-right flex-shrink-0">
                  {purchase.status === "paid" && (
                    <Link
                      href={`/dashboard/marketplace/${purchase.snippetId}`}
                      className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Download →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
