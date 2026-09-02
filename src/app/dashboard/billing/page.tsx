
"use client";

import { useEffect } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { usePayment, type PlanKey, type PaymentRecord } from "@/hooks/usePayment";

// ── Plan definitions ──────────────────────────────────────────────────────────

interface Plan {
  key: PlanKey | "free";
  name: string;
  priceLabel: string;
  priceSub: string;
  amountPaise: number;
  badge: string | null;
  highlight: boolean;
  features: string[];
  ctaLabel: string;
}

const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    priceLabel: "₹0",
    priceSub: "forever",
    amountPaise: 0,
    badge: null,
    highlight: false,
    features: [
      "Unlimited public repos",
      "3 private repos",
      "5 AI reviews / month",
      "Basic analytics",
      "1 GB storage",
    ],
    ctaLabel: "Current free tier",
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "₹999",
    priceSub: "per month",
    amountPaise: 99900,
    badge: "Most Popular",
    highlight: true,
    features: [
      "Unlimited repos",
      "50 AI reviews / month",
      "Pair programming sessions",
      "50 GB storage",
      "Video recordings",
      "Priority support",
    ],
    ctaLabel: "Upgrade to Pro",
  },
  {
    key: "team",
    name: "Team",
    priceLabel: "₹2,999",
    priceSub: "per month",
    amountPaise: 299900,
    badge: null,
    highlight: false,
    features: [
      "Everything in Pro",
      "Unlimited AI reviews",
      "Team analytics dashboard",
      "SAML SSO",
      "500 GB storage",
      "99.9% SLA uptime",
    ],
    ctaLabel: "Upgrade to Team",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-white/[0.06] text-white/40",
    pro:  "bg-indigo-500/20 text-indigo-300",
    team: "bg-violet-500/20 text-violet-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
        colors[plan] ?? colors.free
      }`}
    >
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: PaymentRecord["status"] }) {
  const map = {
    paid:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    created: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    failed:  "bg-red-500/15 text-red-400 border-red-500/25",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${map[status]}`}>
      {status}
    </span>
  );
}

// ── Check icon ────────────────────────────────────────────────────────────────

function Check({ highlight }: { highlight: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 13 13" fill="none"
      className={`flex-shrink-0 mt-0.5 ${highlight ? "text-indigo-400" : "text-emerald-400"}`}
    >
      <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user, isLoading: userLoading } = useDashboard();
  const {
    paying, error, success,
    history, historyLoading,
    startCheckout, fetchHistory, clearMessages,
  } = usePayment();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const currentPlan = user.plan ?? "free";

  const handleUpgrade = async (planKey: PlanKey) => {
    clearMessages();
    await startCheckout(planKey, user.email, user.name);
    // Refresh history + page data after successful payment
    fetchHistory();
    // Reload so useDashboard re-fetches updated plan from /me
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Billing & Plans</h1>
        <p className="text-sm text-[#71717a] mt-1">
          Manage your subscription and view payment history.
        </p>
      </div>

      {/* Current plan banner */}
      {!userLoading && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-indigo-400">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              You are on the{" "}
              <PlanBadge plan={currentPlan} />
              {" "}plan
            </p>
            <p className="text-xs text-[#71717a] mt-0.5">
              {currentPlan === "free"
                ? "Upgrade below to unlock AI reviews, pair programming, and more."
                : "Thank you for supporting DevFlow ✨"}
            </p>
          </div>
          {currentPlan !== "free" && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-[#52525b]">AI Reviews used</p>
              <p className="text-sm font-semibold text-white">
                {user.aiReviewsUsed} / {user.aiReviewsLimit === 999999 ? "∞" : user.aiReviewsLimit}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success / error toast */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/10 text-red-300 text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* Plan cards */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4">Choose a plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            const isDowngrade = plan.key === "free" && currentPlan !== "free";
            const isPayable = plan.key !== "free" && !isCurrent;

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-6 border transition-all duration-200 ${
                  plan.highlight
                    ? "bg-gradient-to-b from-indigo-500/[0.08] to-transparent border-indigo-500/40 shadow-xl shadow-indigo-500/[0.08]"
                    : "bg-[#0f0f14] border-white/[0.07] hover:border-white/[0.12]"
                } ${isCurrent ? "ring-1 ring-indigo-500/50" : ""}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-semibold shadow-lg shadow-indigo-500/30">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan name + price */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] text-emerald-400 font-semibold border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-white">{plan.priceLabel}</span>
                    <span className="text-xs text-[#71717a]">/ {plan.priceSub}</span>
                  </div>
                </div>

                {/* CTA button */}
                <button
                  disabled={isCurrent || isDowngrade || paying !== null}
                  onClick={() => isPayable && handleUpgrade(plan.key as PlanKey)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold mb-5 transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-white/[0.04] text-white/30 cursor-default border border-white/[0.06]"
                      : isDowngrade
                      ? "bg-white/[0.04] text-white/20 cursor-not-allowed border border-white/[0.04]"
                      : plan.highlight
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 hover:cursor-pointer"
                      : "border border-white/[0.12] text-white hover:bg-white/[0.05] disabled:opacity-40 hover:cursor-pointer"
                  }`}
                >
                  {paying === plan.key ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Processing…
                    </>
                  ) : isCurrent ? (
                    "Current plan"
                  ) : (
                    plan.ctaLabel
                  )}
                </button>

                {/* Feature list */}
                <ul className="space-y-2">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-[#a1a1aa]">
                      <Check highlight={plan.highlight} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment history */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4">Payment history</h2>

        {historyLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="py-14 rounded-2xl border border-dashed border-white/[0.07] flex flex-col items-center gap-3 text-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-white/10">
              <rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 12h12M10 17h8M10 22h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-[#52525b]">No payments yet</p>
            <p className="text-xs text-[#3f3f46]">Your transaction history will appear here.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.06] text-[10px] uppercase tracking-widest font-semibold text-[#3f3f46]">
              <span>Order ID</span>
              <span className="text-right">Plan</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Status</span>
            </div>

            {history.map((rec, idx) => (
              <div
                key={rec.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center text-sm ${
                  idx !== history.length - 1 ? "border-b border-white/[0.04]" : ""
                } hover:bg-white/[0.02] transition-colors`}
              >
                {/* Order info */}
                <div className="min-w-0">
                  <p className="text-white/80 font-mono text-xs truncate">{rec.razorpayOrderId}</p>
                  <p className="text-[#52525b] text-[10px] mt-0.5">
                    {formatDate(rec.paidAt ?? rec.createdAt)}
                  </p>
                </div>

                {/* Plan */}
                <div className="text-right">
                  <PlanBadge plan={rec.planKey} />
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span className="text-white/70 text-xs font-medium">
                    {formatAmount(rec.amountPaise)}
                  </span>
                </div>

                {/* Status */}
                <div className="text-right">
                  <StatusBadge status={rec.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
