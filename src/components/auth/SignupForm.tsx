
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import {
  OAuthButtons,
  AuthDivider,
  AuthErrorBanner,
  PasswordInput,
  SubmitButton,
} from "@/components/auth/ui/AuthAtoms";

function SuccessScreen() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 10l4 4 8-8" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="text-white font-semibold text-sm">Account created!</p>
        <p className="text-xs text-[#71717a] mt-1">Redirecting to your dashboard…</p>
      </div>
      <span
        className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}

export default function SignupForm() {
  const { loading, error, success, loginWithOAuth, registerWithEmail } = useAuth();

  const [name, setName]               = useState("");
  const [username, setUsername]       = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = usePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerWithEmail({ name, username, email, password });
  };

  if (success) return <SuccessScreen />;

  return (
    <div>
      <OAuthButtons
        loading={loading}
        loginLabel="Sign up with"
        onOAuth={loginWithOAuth}
      />

      <AuthDivider label="or sign up with email" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && <AuthErrorBanner message={error} />}

        {/* Name + Username */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Dev"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-white placeholder-[#52525b] transition-all"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b] text-sm select-none">
                @
              </span>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                }
                placeholder="alex_dev"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-white placeholder-[#52525b] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-white placeholder-[#52525b] transition-all"
          />
        </div>

        {/* Password + strength */}
        <div>
          <label htmlFor="signup-password" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            Password
          </label>
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            placeholder="Min 8 characters"
            autoComplete="new-password"
            strength={strength}
          />
        </div>

        <SubmitButton
          loading={loading === "email"}
          disabled={loading !== null || !name || !username || !email || !password}
          label="Create free account"
          loadingLabel="Creating account…"
        />
      </form>
    </div>
  );
}
