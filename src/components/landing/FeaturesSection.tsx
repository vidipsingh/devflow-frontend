
export default function FeaturesSection() {
  const features = [
    {
      icon: "✨",
      gradient: "from-violet-500/20 to-indigo-500/20",
      iconBg: "bg-violet-500/15",
      borderHover: "hover:border-violet-500/30",
      tag: "AI-Powered",
      tagColor: "bg-violet-500/15 border-violet-500/25 text-violet-400",
      title: "AI Code Review",
      desc: "Automatically analyse every PR with AI. Catch bugs, security issues, and performance bottlenecks before production.",
      bullets: ["Bug & vulnerability detection", "Security scanning (OWASP)", "Performance suggestions", "Auto-fix code snippets"],
    },
    {
      icon: "🤝",
      gradient: "from-cyan-500/20 to-blue-500/20",
      iconBg: "bg-cyan-500/15",
      borderHover: "hover:border-cyan-500/30",
      tag: "Real-time",
      tagColor: "bg-cyan-500/15 border-cyan-500/25 text-cyan-400",
      title: "Live Pair Programming",
      desc: "Collaborate in real-time with WebSocket-powered live cursors, shared Monaco Editor, and video session recording.",
      bullets: ["Shared Monaco Editor", "Video session recording", "Live cursor presence", "Instant chat & annotations"],
    },
    {
      icon: "⚙️",
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconBg: "bg-emerald-500/15",
      borderHover: "hover:border-emerald-500/30",
      tag: "DevOps",
      tagColor: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
      title: "Smart Git Hosting",
      desc: "Full Git protocol with branch protection, LFS, CODEOWNERS enforcement, and required CI checks — plus smart HTTP and SSH.",
      bullets: ["Full Git protocol (HTTP/SSH)", "Branch protection rules", "CI/CD integration hooks", "Automated merge checks"],
    },
    {
      icon: "📊",
      gradient: "from-orange-500/20 to-amber-500/20",
      iconBg: "bg-orange-500/15",
      borderHover: "hover:border-orange-500/30",
      tag: "Analytics",
      tagColor: "bg-orange-500/15 border-orange-500/25 text-orange-400",
      title: "Deep Analytics",
      desc: "Track developer velocity, review cycle time, code churn, and team productivity with beautiful Recharts dashboards.",
      bullets: ["Developer velocity tracking", "PR cycle time analysis", "Code hotspot heatmaps", "Team leaderboards"],
    },
    {
      icon: "🛒",
      gradient: "from-pink-500/20 to-rose-500/20",
      iconBg: "bg-pink-500/15",
      borderHover: "hover:border-pink-500/30",
      tag: "Community",
      tagColor: "bg-pink-500/15 border-pink-500/25 text-pink-400",
      title: "Snippet Marketplace",
      desc: "Publish, discover, and monetise reusable code snippets. Earn with a 70/30 revenue split. Buy once, use everywhere via CLI.",
      bullets: ["Publish & monetise snippets", "70% revenue to creators", "In-editor snippet search", "Version-controlled packages"],
    },
    {
      icon: "🏆",
      gradient: "from-yellow-500/20 to-amber-500/20",
      iconBg: "bg-yellow-500/15",
      borderHover: "hover:border-yellow-500/30",
      tag: "Gamification",
      tagColor: "bg-yellow-500/15 border-yellow-500/25 text-yellow-400",
      title: "Developer Gamification",
      desc: "Contribution streaks, achievement badges, leaderboards, and XP points make code reviews something devs actually want to do.",
      bullets: ["Daily contribution streaks", "40+ achievement badges", "Team leaderboards", "XP & level progression"],
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex badge-pill bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 mb-4">
            Packed with features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Everything your team needs
          </h2>
          <p className="text-lg text-[#71717a] max-w-2xl mx-auto">
            From AI-assisted code review to gamified developer experiences — DevFlow reimagines the entire workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div
              key={f.title}
              className={`feature-card relative rounded-2xl border border-white/[0.07] bg-[#16161a] p-6 overflow-hidden ${f.borderHover}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center text-xl`}>
                    {f.icon}
                  </div>
                  <span className={`badge-pill border text-[10px] ${f.tagColor}`}>{f.tag}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[#71717a] leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-emerald-400 flex-shrink-0">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
