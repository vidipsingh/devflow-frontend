
  const FALLBACK_STATS = [
    { value: "50K+", label: "Lines reviewed daily", color: "text-indigo-400" },
    { value: "98%",  label: "AI review accuracy",   color: "text-cyan-400"   },
    { value: "3.2×", label: "Faster code review",   color: "text-emerald-400"},
    { value: "99.9%",label: "Platform uptime",      color: "text-violet-400" },
  ];

  async function getPlatformStats() {
    try {
      const res = await fetch(
        `${process.env.BACKEND_URL}/api/v1/public/stats`,
        { next: {revalidate: 60} }
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as { 
        totalUsers: number;
        totalRepositories: number;
        totalSnippets: number;
        totalAIReviews: number;
      };
    } catch {
      return null;
    }
  }

  function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K+`;
    return n > 0 ? `${n}+` : "0";
  }

  export default async function StatsSection() {
  const data = await getPlatformStats();

  const stats = data
    ? [
        { value: formatCount(data.totalUsers),        label: "Developers signed up",  color: "text-indigo-400"  },
        { value: formatCount(data.totalRepositories), label: "Repositories hosted",    color: "text-cyan-400"    },
        { value: formatCount(data.totalSnippets),     label: "Marketplace snippets",   color: "text-emerald-400" },
        { value: formatCount(data.totalAIReviews),    label: "AI reviews completed",   color: "text-violet-400"  },
      ]
    : FALLBACK_STATS;

 return (
    <section className="relative py-16 border-y border-white/[0.04]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/[0.03] to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-4xl lg:text-5xl font-bold stat-number mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-sm text-[#71717a]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
