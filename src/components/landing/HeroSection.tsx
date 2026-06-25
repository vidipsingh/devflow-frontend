
import Link from "next/link";
import { FaUser } from "react-icons/fa";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 hero-grid opacity-60" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.07] blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[280px] h-[280px] rounded-full bg-violet-500/[0.07] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-medium mb-8 animate-fade-in">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Now in Public Beta — AI Code Review included free
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 animate-fade-in-up">
          <span className="text-white">Git hosting with</span>
          <br />
          <span className="gradient-text">AI superpowers</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-[#a1a1aa] leading-relaxed mb-10 animate-fade-in-up delay-200">
          DevFlow is the next-generation developer platform — AI code review, real-time pair
          programming, gamified contributions, and a snippet marketplace. Ship faster. Ship better.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 animate-fade-in-up delay-300">
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-semibold shadow-lg shadow-indigo-500/25 w-full sm:w-auto justify-center"
          >
            Start for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="btn-outline inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[15px] font-medium w-full sm:w-auto justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6.5 5.5L10.5 8l-4 2.5V5.5Z" fill="currentColor" />
            </svg>
            Watch demo
          </a>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#71717a] animate-fade-in-up delay-400">
         <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
                {["bg-indigo-500", "bg-cyan-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500"].map(
                (c, i) => (
                    <div
                    key={i}
                    className={`w-6 h-6 rounded-full ${c} border-2 border-[#0d0d0f] flex items-center justify-center`}
                    >
                    <FaUser className="text-black text-xs" />
                    </div>
                )
                )}
            </div>
            <span>2,400+ developers signed up</span>
         </div>
          <span className="hidden sm:block text-[#2a2a35]">•</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b">
                <path d="M7 1l1.545 3.09L12 4.635l-2.5 2.43.59 3.435L7 9l-3.09 1.5.59-3.435L2 4.635l3.455-.545L7 1Z" />
              </svg>
            ))}
            <span>4.9 / 5 rating</span>
          </div>
          <span className="hidden sm:block text-[#2a2a35]">•</span>
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5v10M1.5 6.5h10" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            No credit card required
          </span>
        </div>
      </div>

      {/* Dashboard preview */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-8 animate-fade-in-up delay-500">
        <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/60">
          {/* Chrome bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <div className="flex-1 mx-4">
              <div className="w-64 h-5 rounded-md bg-white/[0.05] mx-auto flex items-center justify-center">
                <span className="text-[11px] text-[#52525b]">devflow.io / acme / payment-service</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-pill bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px]">✓ CI Passing</span>
              <span className="badge-pill bg-violet-500/15 border border-violet-500/25 text-violet-400 text-[10px]">✨ AI Review</span>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            {["Code", "Pull Requests (3)", "Issues (7)", "Analytics"].map((tab, i) => (
              <button key={tab} className={`px-4 py-2.5 text-xs font-medium transition-colors ${i === 1 ? "text-white border-b-2 border-indigo-500" : "text-[#71717a] hover:text-white"}`}>
                {tab}
              </button>
            ))}
          </div>
          {/* PR rows */}
          <div className="divide-y divide-white/[0.04]">
            {[
              { id: 42, title: "feat: add Stripe payment integration with webhook handling", user: "alex_dev", status: "review", ai: true, checks: "passing", comments: 4 },
              { id: 41, title: "fix: resolve race condition in concurrent checkout processing", user: "sam_codes", status: "approved", ai: false, checks: "passing", comments: 2 },
              { id: 40, title: "refactor: migrate payment service to dependency injection pattern", user: "priya_eng", status: "review", ai: true, checks: "failing", comments: 8 },
            ].map(pr => (
              <div key={pr.id} className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors flex items-center gap-3">
                <svg className={`w-4 h-4 flex-shrink-0 ${pr.status === "approved" ? "text-emerald-400" : "text-indigo-400"}`} viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                  {pr.status === "approved"
                    ? <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    : <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />}
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white font-medium truncate">{pr.title}</span>
                    {pr.ai && <span className="badge-pill bg-violet-500/15 border border-violet-500/25 text-violet-400 text-[10px] flex-shrink-0">✨ AI</span>}
                  </div>
                  <span className="text-[11px] text-[#52525b]">#{pr.id} · {pr.user}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge-pill text-[10px] ${pr.checks === "passing" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                    {pr.checks === "passing" ? "✓ CI" : "✗ CI"}
                  </span>
                  <span className="text-[11px] text-[#52525b]">💬 {pr.comments}</span>
                </div>
              </div>
            ))}
          </div>
          {/* AI banner */}
          <div className="border-t border-white/[0.06] px-4 py-3 bg-violet-500/[0.04]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1l1.1 2.2L9 3.8l-1.83 1.78.43 2.52L5.5 6.9 3.4 8.1l.43-2.52L2 3.8l2.4-.6L5.5 1Z" fill="white" />
                </svg>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                <span className="text-violet-300 font-semibold">DevFlow AI · PR #42 — </span>
                Found <span className="text-amber-400 font-medium">2 issues</span>: missing timeout on webhook handler and unvalidated payment amount.
                Suggested <span className="text-emerald-400 font-medium">3 optimisations</span> for retry logic.
              </p>
            </div>
          </div>
        </div>

        {/* Floating cards */}
        <div className="absolute -right-2 lg:-right-8 top-4 w-24 rounded-2xl glass border border-white/[0.08] p-3 animate-float shadow-xl hidden lg:block">
          <div className="text-xs text-[#71717a] mb-1">Streak 🔥</div>
          <div className="text-2xl font-bold text-white">42d</div>
          <div className="text-[10px] text-emerald-400 mt-1">+3 today</div>
        </div>
        <div className="absolute -left-2 lg:-left-8 top-1/3 w-36 rounded-xl glass border border-white/[0.08] p-3 animate-float shadow-xl hidden lg:block" style={{ animationDelay: "1.2s" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-[#71717a]">Live review</span>
          </div>
          <div className="text-xs text-white font-medium">alice &amp; bob</div>
          <div className="text-[10px] text-[#52525b] mt-0.5">pair programming</div>
        </div>
      </div>
    </section>
  );
}
