
import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import AuthRedirect from "@/components/shared/AuthRedirect";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your DevFlow account.",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md py-8">
      <AuthRedirect />
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-[#71717a]">
          Sign in to continue to DevFlow
        </p>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl border border-white/8 p-6 shadow-2xl shadow-black/40">
        <LoginForm />
      </div>

      {/* Footer link */}
      <p className="text-center text-sm text-[#71717a] mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
}
