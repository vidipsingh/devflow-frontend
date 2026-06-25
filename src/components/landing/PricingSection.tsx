
type PricingPlan = {
  planKey: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  badge: string | null;
  isHighlighted: boolean;
  ctaLabel: string;
  ctaHref: string;
  features: string[];
};

const FALLBACK_PLANS: PricingPlan[] = [
  {
    planKey: "free", name: "Free", price: 0, currency: "USD", period: "forever",
    description: "Perfect for indie developers and open source.",
    badge: null, isHighlighted: false, ctaLabel: "Get started", ctaHref: "/signup",
    features: ["Unlimited public repos", "3 private repos", "5 AI reviews/month", "Basic analytics", "1 GB storage"],
  },
  {
    planKey: "pro", name: "Pro", price: 4.99, currency: "USD", period: "per month",
    description: "For serious developers who ship every day.",
    badge: "Most Popular", isHighlighted: true, ctaLabel: "Start Pro free", ctaHref: "/signup?plan=pro",
    features: ["Unlimited repos", "Unlimited AI reviews", "Pair programming", "50 GB storage", "Video recordings"],
  },
  {
    planKey: "team", name: "Team", price: 12, currency: "USD", period: "per user / month",
    description: "For engineering teams that demand excellence.",
    badge: null, isHighlighted: false, ctaLabel: "Contact sales", ctaHref: "/contact",
    features: ["Everything in Pro", "Team analytics", "SAML SSO", "500 GB storage", "SLA uptime"],
  },
];

async function getPricingPlans(): Promise<PricingPlan[]> {
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/public/pricing`,
      { next: { revalidate: 3600 } } // revalidate every hour
    );
    if (!res.ok) return FALLBACK_PLANS;
    const json = await res.json();
    const plans = json.data as PricingPlan[];
    return plans && plans.length > 0 ? plans : FALLBACK_PLANS;
  } catch {
    return FALLBACK_PLANS;
  }
}

function formatPrice(plan: PricingPlan): string {
  if (plan.price === 0) return "$0";
  const symbol = plan.currency === "INR" ? "₹" : "$";
  return `${symbol}${plan.price}`;
}

export default async function PricingSection() {
  const plans = await getPricingPlans();

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.025] to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex badge-pill bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 mb-4">
            Simple pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Start free. Scale when ready.
          </h2>
          <p className="text-lg text-[#71717a] max-w-xl mx-auto">
            No hidden fees. Cancel anytime. Full features on every paid plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
          {plans.map(plan => (
            <div
              key={plan.planKey}
              className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                plan.isHighlighted
                  ? "pricing-highlight border-indigo-500/50 shadow-xl shadow-indigo-500/10"
                  : "bg-[#16161a] border-white/[0.07] hover:border-white/[0.12]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-pill bg-indigo-500 text-white text-[10px] shadow-lg shadow-indigo-500/30">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-4xl font-bold text-white">{formatPrice(plan)}</span>
                  <span className="text-sm text-[#71717a]">/ {plan.period}</span>
                </div>
                <p className="text-xs text-[#71717a]">{plan.description}</p>
              </div>

              <a
                href={plan.ctaHref}
                className={`w-full block text-center py-2.5 rounded-xl text-sm font-semibold mb-6 transition-all ${
                  plan.isHighlighted ? "btn-primary shadow-lg shadow-indigo-500/20" : "btn-outline"
                }`}
              >
                {plan.ctaLabel}
              </a>

              <ul className="space-y-2.5">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2.5 text-xs text-[#a1a1aa]">
                    <svg
                      width="13" height="13" viewBox="0 0 13 13" fill="none"
                      className={`flex-shrink-0 ${plan.isHighlighted ? "text-indigo-400" : "text-emerald-400"}`}
                    >
                      <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}