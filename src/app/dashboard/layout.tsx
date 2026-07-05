
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("devflow_token");
    } catch {
      // localStorage unavailable
    }

    if (!token) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const { user, notifications, unreadCount, markAllRead, markRead } = useDashboard();

  // Count open PRs + issues across all repos for sidebar badges
  // (will come from real API later — hardcoded for now)
  const openPRs    = 7;
  const openIssues = 11;

  // While we are checking auth (first render), show a full-screen spinner.
  // This avoids a flash of dashboard content before the redirect fires.
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-[#71717a] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0d0d0f] overflow-hidden">
      <Sidebar user={user} openPRs={openPRs} openIssues={openIssues} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAll={markAllRead}
          onMarkRead={markRead}
        />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
