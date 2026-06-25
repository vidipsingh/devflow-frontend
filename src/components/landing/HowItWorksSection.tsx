
export default function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      color: "text-indigo-400",
      borderColor: "border-indigo-500/30",
      bg: "bg-indigo-500/10",
      title: "Create your repository",
      desc: "Push code with a familiar git remote workflow. DevFlow handles storage, indexing, and access control automatically.",
      code: `$ git remote add devflow \\
    https://devflow.io/acme/api.git
$ git push devflow main

  ✓ Objects uploaded (42 objects)
  ✓ Refs updated
  ✓ CI pipeline triggered
  ✓ AI review queued`,
    },
    {
      num: "02",
      color: "text-violet-400",
      borderColor: "border-violet-500/30",
      bg: "bg-violet-500/10",
      title: "Open a pull request",
      desc: "Create PRs from the web UI or CLI. DevFlow AI automatically reviews and posts inline suggestions within seconds.",
      code: `$ devflow pr create \\
    --title "feat: payment webhooks"

  ✓ Pull request #42 created
  ✓ Reviewers notified
  ✨ AI review complete

  → 2 issues, 3 suggestions`,
    },
    {
      num: "03",
      color: "text-cyan-400",
      borderColor: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      title: "Collaborate & merge",
      desc: "Review comments, approve changes, and merge with required checks. All activity feeds analytics and earns XP.",
      code: `$ devflow pr merge 42 --squash

  ✓ All checks passing
  ✓ 2 approvals received
  ✓ Merged to main

  🏆 +50 XP earned!
  🔥 Streak: 15 days`,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex badge-pill bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mb-4">
            Simple workflow
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Up and running in minutes
          </h2>
          <p className="text-lg text-[#71717a] max-w-xl mx-auto">
            Familiar Git workflow with powerful superpowers baked in at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          <div className="hidden lg:block absolute top-10 left-[calc(33.3%+8px)] right-[calc(33.3%+8px)] h-px " />
          {steps.map(step => (
            <div key={step.num} className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="p-6 pb-4">
                <div className={`inline-flex w-10 h-10 rounded-xl ${step.bg} border ${step.borderColor} items-center justify-center mb-4`}>
                  <span className={`text-sm font-bold font-mono ${step.color}`}>{step.num}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-[#71717a] leading-relaxed">{step.desc}</p>
              </div>
              <div className="bg-[#0a0a0d] border-t border-white/[0.06] p-4">
                <pre className="code-block text-[11px] text-[#a1a1aa] overflow-x-auto whitespace-pre">{step.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
