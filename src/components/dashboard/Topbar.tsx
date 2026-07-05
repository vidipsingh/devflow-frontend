
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { DashboardUser, Notification } from "@/hooks/useDashboard";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path d="M8.5 2a5 5 0 0 0-5 5v2.5L2 11h13l-1.5-1.5V7a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Notification dropdown
// ---------------------------------------------------------------------------

function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAll,
  onMarkRead,
  onClose,
}: {
  notifications: Notification[];
  unreadCount: number;
  onMarkAll: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAll}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <ul className="max-h-[340px] overflow-y-auto divide-y divide-white/[0.04]">
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => { onMarkRead(n.id); onClose(); }}
              className={`w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors flex items-start gap-3 ${n.read ? "opacity-60" : ""}`}
            >
              <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.read ? "bg-transparent" : "bg-indigo-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                <p className="text-[11px] text-[#71717a] mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-[#3f3f46] mt-1">{n.time}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-4 py-2.5">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------

interface TopbarProps {
  user: DashboardUser;
  notifications: Notification[];
  unreadCount: number;
  onMarkAll: () => void;
  onMarkRead: (id: string) => void;
  pageTitle?: string;
}

export default function Topbar({
  user,
  notifications,
  unreadCount,
  onMarkAll,
  onMarkRead,
  pageTitle,
}: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const [search, setSearch]       = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center gap-4 px-4 sm:px-6 border-b border-white/[0.06] bg-[#0d0d0f]/90 backdrop-blur-sm flex-shrink-0">
      {/* Page title (mobile) */}
      {pageTitle && (
        <h1 className="text-sm font-semibold text-white truncate md:hidden">{pageTitle}</h1>
      )}

      {/* Search */}
      <div className="hidden sm:flex flex-1 max-w-sm items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] focus-within:border-indigo-500/40 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search repos, PRs, issues…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white placeholder-[#52525b] focus:outline-none"
        />
        <kbd className="hidden sm:inline text-[10px] text-[#3f3f46] bg-white/[0.05] px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* New repo button */}
        <Link
          href="/dashboard/repositories/new"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-300 text-xs font-medium transition-all"
        >
          <PlusIcon />
          New
        </Link>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            className="relative p-2 rounded-xl text-[#71717a] hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="Notifications"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 ring-2 ring-[#0d0d0f]" />
            )}
          </button>
          {notifOpen && (
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAll={onMarkAll}
              onMarkRead={onMarkRead}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        {/* User avatar + dropdown */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/[0.06] transition-all"
          >
            <div className={`w-7 h-7 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
              {user.name[0]}
            </div>
            <span className="hidden sm:block text-xs font-medium text-[#a1a1aa]">{user.username}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#52525b]">
              <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 glass rounded-xl border border-white/[0.08] shadow-2xl shadow-black/50 z-50 overflow-hidden py-1">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-white/[0.06]">
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-[#52525b]">@{user.username}</p>
              </div>
              {/* Gamification strip */}
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-[#52525b]">Level {user.level} · {user.xp} XP</span>
                  <span className="text-[10px] text-[#52525b]">{user.xpToNext} to next</span>
                </div>
                <div className="h-1 w-full bg-white/[0.07] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all"
                    style={{ width: `${Math.round((user.xp / user.xpToNext) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-orange-400">🔥 {user.streak}d streak</span>
                </div>
              </div>
              {/* Menu items */}
              {[
                { label: "Your profile",   href: "/dashboard/profile"              },
                { label: "Repositories",   href: "/dashboard/repositories"         },
                { label: "Settings",       href: "/dashboard/settings"             },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setUserOpen(false)}
                  className="flex items-center px-3 py-2 text-xs text-[#a1a1aa] hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-white/[0.06] mt-1 pt-1">
                <button
                  onClick={() => {
                    setUserOpen(false);
                    try { 
                      localStorage.removeItem("devflow_token"); 
                    } catch { /* ignore */ }
                    window.location.href = "/login";
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:cursor-pointer hover:bg-red-500/[0.06] transition-all"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
