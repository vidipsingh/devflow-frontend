
export default function AIReviewSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/[0.07] blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left copy */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-5 leading-snug">
              AI that understands your codebase, not just syntax
            </h2>
            <p className="text-[#a1a1aa] leading-relaxed mb-8">
              Our review engine goes beyond linting. It understands business logic,
              security implications, architectural patterns, and your team&apos;s coding conventions.
            </p>
            <div className="space-y-3">
              {[
                { icon: "🛡️", title: "Security vulnerability detection", desc: "OWASP Top 10, injections, exposed secrets, insecure dependencies" },
                { icon: "⚡", title: "Performance optimisation", desc: "N+1 queries, unnecessary re-renders, inefficient algorithms" },
                { icon: "🏗️", title: "Architecture guidance", desc: "Design pattern recommendations, SOLID principles, coupling analysis" },
                { icon: "📋", title: "Auto-fix suggestions", desc: "One-click apply AI-generated fixes directly in the PR" },
              ].map(item => (
                <div
                  key={item.title}
                  className="flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/20 transition-colors"
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">{item.title}</div>
                    <div className="text-xs text-[#71717a]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: AI diff widget */}
          <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1l1.1 2.2L9 3.8l-1.83 1.78.43 2.52L5.5 6.9 3.4 8.1l.43-2.52L2 3.8l2.4-.6L5.5 1Z" fill="white" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white">AI Review — PR #42</span>
              </div>
              <span className="badge-pill bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px]">
                2 issues found
              </span>
            </div>

            {/* Diff view */}
            <div className="bg-[#0a0a0d] border-b border-white/[0.06]">
              <div className="px-4 py-2 border-b border-white/[0.04]">
                <span className="text-[11px] text-[#52525b] font-mono">payment/webhook.go</span>
              </div>
              <div className="p-4 code-block text-xs space-y-0.5">
                <div className="flex gap-3">
                  <span className="w-5 text-right select-none text-[#52525b]">79</span>
                  <span className="text-[#a1a1aa]">
                    <span className="text-cyan-400">func</span>{" "}
                    <span className="text-yellow-300">handleWebhook</span>
                    (w http.ResponseWriter, r *http.Request) {"{"}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="w-5 text-right select-none text-[#52525b]">80</span>
                  <span className="text-[#a1a1aa]">{"    "}body, _ := io.ReadAll(r.Body)</span>
                </div>
                <div className="flex gap-3 bg-red-500/10 -mx-4 px-4 pl-7 border-l-2 border-red-500">
                  <span className="text-red-400 line-through opacity-70 pl-2">
                    {"    "}processPayment(body)
                  </span>
                </div>
                <div className="flex gap-3 bg-emerald-500/10 -mx-4 px-4 border-l-2 border-emerald-500">
                  <span className="w-5 text-right select-none text-[#52525b]">81</span>
                  <span className="text-emerald-300">
                    +{"   "}ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
                  </span>
                </div>
                <div className="flex gap-3 bg-emerald-500/10 -mx-4 px-4 border-l-2 border-emerald-500">
                  <span className="w-5 text-right select-none text-[#52525b]">82</span>
                  <span className="text-emerald-300">+{"   "}defer cancel()</span>
                </div>
                <div className="flex gap-3 bg-emerald-500/10 -mx-4 px-4 border-l-2 border-emerald-500">
                  <span className="w-5 text-right select-none text-[#52525b]">83</span>
                  <span className="text-emerald-300">+{"   "}processPayment(ctx, body)</span>
                </div>
              </div>
            </div>

            {/* AI comment */}
            <div className="p-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20 mb-4">
                <span className="text-amber-400 text-base flex-shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="text-xs font-semibold text-amber-300 mb-1">Missing context timeout — High severity</p>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    <code className="text-amber-300/80 font-mono bg-amber-500/10 px-1 rounded">processPayment</code>{" "}
                    can run indefinitely if the external gateway is slow. Add a timeout context to prevent goroutine leaks and resource exhaustion.
                  </p>
                  <button className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Apply fix suggestion →
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-4 text-xs text-[#52525b]">
                  <span><span className="text-red-400">●</span> 1 high</span>
                  <span><span className="text-amber-400">●</span> 1 medium</span>
                  <span><span className="text-emerald-400">●</span> 3 suggestions</span>
                </div>
                <button className="btn-primary text-xs px-3 py-1.5 rounded-lg">Apply all fixes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
