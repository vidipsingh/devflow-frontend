
"use client";

import { useState, useEffect } from "react";
import { SiCodeigniter } from "react-icons/si";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Marketplace", href: "#marketplace" },
  { label: "Docs", href: "#" },
];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoHref, setLogoHref]     = useState("/");

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("devflow_token")) {
        setLogoHref("/dashboard");
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "nav-blur bg-[#0d0d0f]/85 border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href={logoHref} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/40 transition-shadow duration-300">
           <SiCodeigniter />

          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">
            DevFlow
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-2 text-sm text-[#a1a1aa] hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#a1a1aa] hover:text-white transition-colors duration-200 px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
          >
            Get started free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-[#a1a1aa] hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/[0.06] px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-2.5 text-sm text-[#a1a1aa] hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-white/[0.06] pt-3 mt-2 flex flex-col gap-2">
            <Link href="/login" className="px-3 py-2.5 text-sm text-[#a1a1aa] hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm font-medium px-4 py-2.5 rounded-lg text-center"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
