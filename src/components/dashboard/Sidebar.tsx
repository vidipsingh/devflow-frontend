
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiCodeigniter } from "react-icons/si";
import type { DashboardUser } from "@/hooks/useDashboard";

// ---------------------------------------------------------------------------
// Nav item types
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Icons (inline SVG — no extra dep)
// ---------------------------------------------------------------------------

const Icon = {
  home: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  repo: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5h6M5 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  pr: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="4.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 6v4M11.5 6v1a3 3 0 0 1-3 3H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  issue: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  ai: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2l1.2 2.4L12 5.1l-2 1.94.47 2.76L8 8.6l-2.47 1.2.47-2.76L4 5.1l2.8-.7L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3 12l2 2M11 12l2 2M3 14l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  marketplace: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 3h12l-1.5 6H3.5L2 3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="5.5" cy="13" r="1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10.5" cy="13" r="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12l3.5-4 3 2.5L12 5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  team: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 13c0-2.76 2.24-5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="11.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 13c0-1.66 1.12-3 2.5-3S14 11.34 14 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.76 3.76l.7.7M11.54 11.54l.7.7M3.76 12.24l.7-.7M11.54 4.46l.7-.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  chevronLeft: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Build nav sections
// ---------------------------------------------------------------------------

function buildNavSections(openPRs: number, openIssues: number): NavSection[] {
  return [
    {
      items: [
        { label: "Overview",     href: "/dashboard",               icon: Icon.home        },
        { label: "Repositories", href: "/dashboard/repositories",  icon: Icon.repo        },
        { label: "Pull Requests",href: "/dashboard/pulls",         icon: Icon.pr,   badge: openPRs   },
        { label: "Issues",       href: "/dashboard/issues",        icon: Icon.issue, badge: openIssues },
      ],
    },
    {
      title: "DevFlow",
      items: [
        { label: "AI Reviews",   href: "/dashboard/ai",           icon: Icon.ai        },
        { label: "Marketplace",  href: "/dashboard/marketplace",  icon: Icon.marketplace },
        { label: "Analytics",    href: "/dashboard/analytics",    icon: Icon.analytics  },
        { label: "Team",         href: "/dashboard/team",         icon: Icon.team       },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Settings",     href: "/dashboard/settings",     icon: Icon.settings   },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// NavLink atom
// ---------------------------------------------------------------------------

function NavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group
        ${active
          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
          : "text-[#71717a] hover:text-white hover:bg-white/[0.05] border border-transparent"
        }`}
    >
      <span className={`flex-shrink-0 ${active ? "text-indigo-400" : "text-[#52525b] group-hover:text-[#a1a1aa]"} transition-colors`}>
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
      {/* Badge dot when collapsed */}
      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface SidebarProps {
  user: DashboardUser;
  openPRs?: number;
  openIssues?: number;
}

export default function Sidebar({ user, openPRs = 0, openIssues = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navSections = buildNavSections(openPRs, openIssues);

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-white/[0.06] bg-[#0d0d0f] transition-all duration-300 ${
        collapsed ? "w-[60px]" : "w-[220px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 h-14 border-b border-white/[0.05] flex-shrink-0 ${collapsed ? "justify-center px-0" : ""}`}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md flex-shrink-0">
            <SiCodeigniter className="text-white text-xs" />
          </div>
          {!collapsed && (
            <span className="text-[14px] font-semibold text-white tracking-tight">DevFlow</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-hide">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.title && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] uppercase tracking-widest font-semibold text-[#3f3f46]">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    collapsed={collapsed}
                    active={
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User strip */}
      {!collapsed && (
        <div className="flex-shrink-0 border-t border-white/[0.05] px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[#52525b] truncate">@{user.username}</p>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wide flex-shrink-0">
              {user.plan}
            </span>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex-shrink-0 flex items-center justify-center h-10 border-t border-white/[0.05] text-[#52525b] hover:text-white hover:bg-white/[0.04] transition-all"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? Icon.chevronRight : Icon.chevronLeft}
      </button>
    </aside>
  );
}
