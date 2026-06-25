
export default function GamificationSection() {
  const badges = [
    { emoji: "🔥", name: "On Fire", desc: "30-day streak", gradient: "from-orange-500/25 to-red-500/25", border: "border-orange-500/30" },
    { emoji: "⚡", name: "Velocity", desc: "50 PRs/month", gradient: "from-yellow-500/25 to-amber-500/25", border: "border-yellow-500/30" },
    { emoji: "🛡️", name: "Guardian", desc: "Caught 10 vulns", gradient: "from-blue-500/25 to-indigo-500/25", border: "border-blue-500/30" },
    { emoji: "🎯", name: "Precision", desc: "Zero reverts 90d", gradient: "from-emerald-500/25 to-teal-500/25", border: "border-emerald-500/30" },
    { emoji: "👑", name: "Top Reviewer", desc: "#1 on leaderboard", gradient: "from-violet-500/25 to-purple-500/25", border: "border-violet-500/30" },
    { emoji: "🚀", name: "Ship It", desc: "100 merges total", gradient: "from-cyan-500/25 to-blue-500/25", border: "border-cyan-500/30" },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-yellow-500/[0.04] blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Badges + streak */}
          <div className="order-2 lg:order-1 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {badges.map(badge => (
                <div
                  key={badge.name}
                  className={`rounded-2xl border ${badge.border} bg-gradient-to-br ${badge.gradient} p-4 flex flex-col items-center gap-2 text-center hover:scale-105 transition-transform duration-200 cursor-default`}
                >
                  <span className="text-3xl">{badge.emoji}</span>
                  <div className="text-xs font-semibold text-white">{badge.name}</div>
                  <div className="text-[10px] text-[#71717a]">{badge.desc}</div>
                </div>
              ))}
            </div>

            {/* Streak bar */}
            <div className="glass rounded-2xl border border-white/[0.07] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-white">🔥 Current streak</div>
                  <div className="text-xs text-[#71717a]">Keep committing to maintain it!</div>
                </div>
                <div className="text-3xl font-bold text-orange-400 stat-number">42d</div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 21 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-sm ${
                      i < 18 ? "bg-orange-500" : i < 20 ? "bg-orange-500/35" : "bg-white/[0.06]"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-[#52525b]">
                <span>3 weeks ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex badge-pill bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 mb-6">
              🏆 Gamification
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-5 leading-snug">
              Make coding an adventure, not a chore
            </h2>
            <p className="text-[#a1a1aa] leading-relaxed mb-8">
              Developer experience matters. DevFlow gamifies every interaction — earning XP for reviews,
              maintaining streaks, collecting badges, and competing on team leaderboards makes your team
              genuinely excited to contribute.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: "40+", label: "Achievement badges" },
                { val: "XP", label: "Level progression" },
                { val: "🏆", label: "Team leaderboards" },
                { val: "🔥", label: "Daily streak rewards" },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-2xl font-bold text-white mb-1">{item.val}</div>
                  <div className="text-xs text-[#71717a]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
