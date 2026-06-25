
const testimonials = [
  {
    quote: "DevFlow's AI review caught a critical SQL injection vulnerability that slipped past our manual review. Saved us from a potential data breach. Absolutely worth it.",
    name: "Priya Sharma",
    role: "Senior Backend Engineer",
    company: "FinTech India",
    avatar: "PS",
    avatarColor: "from-indigo-500 to-violet-500",
    stars: 5,
  },
  {
    quote: "The pair programming feature is incredible. My team went from async PR hell to real-time collaboration. Our review cycle time dropped from 2 days to 4 hours.",
    name: "Alex Chen",
    role: "Engineering Lead",
    company: "Startup SF",
    avatar: "AC",
    avatarColor: "from-cyan-500 to-blue-500",
    stars: 5,
  },
  {
    quote: "I published three Go utility snippets and made $400 in the first month. The marketplace is a genuine passive income stream for developers. Game changer.",
    name: "Luca Bianchi",
    role: "Freelance Developer",
    company: "Independent",
    avatar: "LB",
    avatarColor: "from-emerald-500 to-teal-500",
    stars: 5,
  },
  {
    quote: "The gamification aspect sounds gimmicky until you see your team's PR review rate jump 3x. Engineers actually compete to be top reviewer now. Wild.",
    name: "Sarah Mitchell",
    role: "VP of Engineering",
    company: "Scale-up UK",
    avatar: "SM",
    avatarColor: "from-orange-500 to-amber-500",
    stars: 5,
  },
  {
    quote: "Switched from GitHub to DevFlow for the AI reviews. The AI integration is unreal — it understood our domain-specific patterns and flagged issues our linter never would.",
    name: "Rahul Verma",
    role: "Full-stack Developer",
    company: "SaaS Startup",
    avatar: "RV",
    avatarColor: "from-pink-500 to-rose-500",
    stars: 5,
  },
  {
    quote: "The analytics dashboard alone is worth it. Finally I can show my CTO exactly where our team's bottlenecks are and which engineers need more support.",
    name: "Emma Johansson",
    role: "Engineering Manager",
    company: "Nordic Tech",
    avatar: "EJ",
    avatarColor: "from-violet-500 to-purple-500",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-indigo-500/[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex badge-pill bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mb-4">
            Loved by developers
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Don&apos;t take our word for it
          </h2>
          <p className="text-lg text-[#71717a] max-w-xl mx-auto">
            Join thousands of developers already shipping better code with DevFlow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`glass rounded-2xl border border-white/[0.07] p-6 flex flex-col gap-4 hover:border-white/[0.12] transition-colors ${
                i === 1 ? "md:mt-6" : ""
              }`}
            >
              {/* Stars */}
              <div className="flex items-center gap-1">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <svg key={si} width="13" height="13" viewBox="0 0 13 13" fill="#f59e0b">
                    <path d="M6.5 1l1.27 2.57 2.84.41-2.06 2 .49 2.83L6.5 7.5 3.96 8.81l.49-2.83L2.39 4l2.84-.41L6.5 1Z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-[#a1a1aa] leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-[#71717a]">{t.role} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
