
import type { Metadata } from "next";
import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";
import AuthRedirect from "@/components/shared/AuthRedirect";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your free DevFlow account and start shipping better code.",
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md py-8">
      <AuthRedirect />
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Free forever · No credit card
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
          Create your account
        </h1>
        <p className="text-sm text-[#71717a]">
          Join thousands of developers shipping better code
        </p>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl border border-white/8 p-6 shadow-2xl shadow-black/40">
        <SignupForm />
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-[#71717a] mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
