
import type { Metadata } from "next";
import Link from "next/link";
import { SiCodeigniter } from "react-icons/si";

export const metadata: Metadata = {
  title: {
    template: "%s — DevFlow",
    default: "Auth — DevFlow",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col">
      {/* Minimal auth navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/4 bg-[#0d0d0f]/80 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/40 transition-shadow duration-300">
              <SiCodeigniter className="text-white text-xs" />
            </div>
            <span className="text-[14px] font-semibold text-white tracking-tight">
              DevFlow
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-[#71717a] hover:text-white transition-colors duration-200 flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to home
          </Link>
        </nav>
      </header>

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-indigo-600/[0.08] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[280px] h-[280px] rounded-full bg-violet-500/[0.05] blur-[100px]" />
        <div className="absolute inset-0 hero-grid opacity-30" />
      </div>

      {/* Page content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-14 pb-8">
        {children}
      </main>

      <footer className="py-5 text-center text-[11px] text-[#3f3f46]">
        © {new Date().getFullYear()} DevFlow
      </footer>
    </div>
  );
}
