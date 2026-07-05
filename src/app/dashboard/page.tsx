
"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useRepository } from "@/hooks/useRepository";
import OverviewCards from "@/components/dashboard/OverviewCards";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import RepoList from "@/components/dashboard/RepoList";
import ContributionGraph from "@/components/dashboard/ContributionGraph";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  const { user, stats, activity } = useDashboard();
  const repoState = useRepository();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Welcome row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Good {getGreeting()}, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-[#71717a] mt-0.5">
            Here&apos;s what&apos;s happening across your repos.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#52525b]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          All systems operational
        </div>
      </div>

      {/* Stat cards */}
      <OverviewCards stats={stats} />

      {/* Contribution graph — full width */}
      <ContributionGraph streak={user.streak} />

      {/* Main content: 2/3 left + 1/3 right */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

        {/* Left column */}
        <div className="space-y-6 min-w-0">
          {/* Repository list */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Repositories</h2>
              <a
                href="/dashboard/repositories"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View all →
              </a>
            </div>
            <RepoList {...repoState} />
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <QuickActions user={user} />
          <ActivityFeed activity={activity} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
