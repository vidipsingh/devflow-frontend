
"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useRepository } from "@/hooks/useRepository";
import OverviewCards from "@/components/dashboard/OverviewCards";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import RepoList from "@/components/dashboard/RepoList";
import ContributionGraph from "@/components/dashboard/ContributionGraph";
import QuickActions from "@/components/dashboard/QuickActions";
import { AlertCircle, RefreshCw } from "lucide-react";

function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-2xl border border-white/[0.07] bg-white/[0.02] animate-pulse"
        />
      ))}
    </div>
  );
}

function GraphSkeleton() {
  return (
    <div className="h-40 rounded-2xl border border-white/[0.07] bg-white/[0.02] animate-pulse" />
  );
}

export default function DashboardPage() {
  const { user, stats, activity, notifications, unreadCount, isLoading, error, markAllRead, markRead } =
    useDashboard();

  const repoState = useRepository();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Welcome row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Good {getGreeting()},{" "}
            {isLoading ? (
              <span className="inline-block w-24 h-5 rounded bg-white/10 animate-pulse align-middle" />
            ) : (
              <span>{user.name.split(" ")[0]} 👋</span>
            )}
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

      {/* Error banner */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/8 text-red-400">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 text-xs font-medium hover:text-red-300 transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      {isLoading ? <StatSkeleton /> : <OverviewCards stats={stats} />}

      {isLoading ? <GraphSkeleton /> : <ContributionGraph streak={user.streak} />}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

        <div className="space-y-6 min-w-0">
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

        <div className="space-y-6">
          {isLoading ? (
            <div className="h-64 rounded-2xl border border-white/[0.07] bg-white/[0.02] animate-pulse" />
          ) : (
            <QuickActions user={user} />
          )}
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

// Helpers
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
