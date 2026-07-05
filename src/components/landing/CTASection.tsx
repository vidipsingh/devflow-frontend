
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/8 to-cyan-600/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex badge-pill bg-white/[0.06] border border-white/[0.1] text-[#a1a1aa] mb-6">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
          Free forever on the free plan
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-5 leading-[1.08]">
          Your team deserves a
          <br />
          <span className="gradient-text">better dev platform</span>
        </h2>

        <p className="text-lg text-[#a1a1aa] max-w-xl mx-auto mb-10 leading-relaxed">
          Join thousands of developers already using DevFlow to write better code, faster.
          No setup fees. No credit card required to start.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold shadow-xl shadow-indigo-500/30 w-full sm:w-auto justify-center"
          >
            Get started for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
