
type Snippet = {
  id: string;
  title: string;
  language: string;
  pricing: { type: string; price: number; currency: string };
  stats: { downloads: number; rating: number };
  category: string;
  creatorUsername?: string;
  tags: string[];
};

async function getSnippets(): Promise<Snippet[]> {
  try {
    if (!process.env.BACKEND_URL) return [];
    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/marketplace/snippets?limit=6&sort=downloads`,
      {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as Snippet[]) ?? [];
  } catch {
    return [];
  }
}

const PLACEHOLDER_SNIPPETS: Snippet[] = [
  { id: "1", title: "Rate Limiter Middleware",       language: "go",         pricing: { type: "paid", price: 499,  currency: "INR" }, stats: { downloads: 2400, rating: 4.8 }, category: "Backend",  creatorUsername: "gopher_pro",    tags: [] },
  { id: "2", title: "React Query + Zustand Setup",   language: "typescript", pricing: { type: "free", price: 0,    currency: "INR" }, stats: { downloads: 5100, rating: 4.9 }, category: "Frontend", creatorUsername: "react_wizard",   tags: [] },
  { id: "3", title: "JWT Auth with Refresh Tokens",  language: "go",         pricing: { type: "paid", price: 299,  currency: "INR" }, stats: { downloads: 3800, rating: 4.7 }, category: "Auth",     creatorUsername: "secdev",         tags: [] },
  { id: "4", title: "Elasticsearch DSL Builder",     language: "typescript", pricing: { type: "paid", price: 799,  currency: "INR" }, stats: { downloads: 1200, rating: 4.5 }, category: "Search",   creatorUsername: "search_ninja",   tags: [] },
  { id: "5", title: "WebSocket Reconnect Logic",     language: "typescript", pricing: { type: "free", price: 0,    currency: "INR" }, stats: { downloads: 4200, rating: 4.8 }, category: "Realtime", creatorUsername: "rtdev",          tags: [] },
  { id: "6", title: "MongoDB Atlas Aggregations",    language: "go",         pricing: { type: "paid", price: 399,  currency: "INR" }, stats: { downloads: 986,  rating: 4.6 }, category: "Database", creatorUsername: "mongo_master",   tags: [] },
];

function formatPrice(s: Snippet): string {
  if (s.pricing.type === "free") return "Free";
  const symbol = s.pricing.currency === "INR" ? "₹" : "$";
  return `${symbol}${s.pricing.price}`;
}

function formatDownloads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function MarketplaceSection() {
  const fetched = await getSnippets();
  const snippets = fetched.length > 0 ? fetched : PLACEHOLDER_SNIPPETS;

  return (
    <section id="marketplace" className="py-24 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-cyan-500/[0.05] blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex badge-pill bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mb-4">
            💰 Snippet Marketplace
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Buy less. Build more.
          </h2>
          <p className="text-lg text-[#71717a] max-w-2xl mx-auto">
            Discover production-ready snippets from top developers. Publish your own and keep 70% of every sale.
          </p>
        </div>

        {/* Search bar (UI only — search is a client feature) */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative flex items-center">
            <svg className="absolute left-4 text-[#52525b] w-4 h-4" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <div className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#52525b]">
              Search snippets by language, tag, or keyword...
            </div>
          </div>
        </div>

        {/* Snippet grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {snippets.map(s => {
            const price = formatPrice(s);
            const isFree = s.pricing.type === "free";
            const isGo = s.language === "go";
            return (
              <div
                key={s.id}
                className="feature-card glass rounded-2xl border border-white/[0.07] p-4 hover:border-emerald-500/20 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${isGo ? "bg-cyan-500/20 text-cyan-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {isGo ? "Go" : "TS"}
                    </div>
                    <span className="badge-pill bg-white/[0.05] border border-white/[0.08] text-[#71717a] text-[10px]">
                      {s.category}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${isFree ? "text-emerald-400" : "text-white"}`}>
                    {price}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{s.title}</h4>
                <p className="text-xs text-[#71717a] mb-3">
                  by @{s.creatorUsername ?? "devflow_user"}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#52525b]">
                  <span>⬇ {formatDownloads(s.stats.downloads)}</span>
                  <span>★ {s.stats.rating.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10 space-y-4">
          <a
            href="/dashboard/marketplace"
            className="btn-outline inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
          >
            Browse all snippets
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}