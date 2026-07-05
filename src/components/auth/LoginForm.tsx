
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  OAuthButtons,
  AuthDivider,
  AuthErrorBanner,
  PasswordInput,
  SubmitButton,
} from "@/components/auth/ui/AuthAtoms";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: "OAuth sign-in was cancelled.",
  oauth_failed:    "OAuth sign-in failed. Please try again.",
  no_token:        "Authentication failed — please try again.",
};

export default function LoginForm() {
  const { loading, error, loginWithOAuth, loginWithEmail } = useAuth();
  const searchParams = useSearchParams();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [oauthError, setOAuthError]     = useState<string | null>(null);

  useEffect(() => {
    const errCode = searchParams.get("error");
    if (errCode) {
      setOAuthError(OAUTH_ERROR_MESSAGES[errCode] ?? "Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOAuthError(null);
    await loginWithEmail({ email, password });
  };

  const displayError = error ?? oauthError;

  return (
    <div>
      <OAuthButtons
        loading={loading}
        loginLabel="Continue with"
        onOAuth={loginWithOAuth}
      />

      <AuthDivider label="or continue with email" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {displayError && <AuthErrorBanner message={displayError} />}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-white placeholder-[#52525b] transition-all"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-[#a1a1aa]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            autoComplete="current-password"
          />
        </div>

        <SubmitButton
          loading={loading === "email"}
          disabled={loading !== null || !email || !password}
          label="Sign in"
          loadingLabel="Signing in…"
        />
      </form>
    </div>
  );
}
