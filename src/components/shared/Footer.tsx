
import Link from "next/link";
import { SiCodeigniter } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#0a0a0d]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <SiCodeigniter className="text-white text-xs" />
            </div>
            <span className="text-sm font-semibold text-white">DevFlow</span>
          </Link>

          {/* Center links */}
          <div className="flex items-center gap-6">
            {[
              { label: "Features",     href: "#features"     },
              { label: "How it Works", href: "#how-it-works" },
              { label: "Marketplace",  href: "#marketplace"  },
            ].map((l) => (
              <a key={l.label} href={l.href} className="text-xs text-[#71717a] hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-[#52525b]">
            © {new Date().getFullYear()} DevFlow, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
