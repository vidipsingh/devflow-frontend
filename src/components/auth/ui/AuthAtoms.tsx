
"use client";

import type { AuthProvider, AuthLoadingState } from "@/hooks/useAuth";
import type { PasswordStrength } from "@/hooks/usePasswordStrength";

export function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
    </svg>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />;
}

interface OAuthButtonsProps {
  loading: AuthLoadingState;
  loginLabel?: string;
  onOAuth: (provider: AuthProvider) => void;
}

export function OAuthButtons({ loading, loginLabel = "Continue with", onOAuth }: OAuthButtonsProps) {
  const disabled = loading !== null;

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => onOAuth("github")}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading === "github" ? <Spinner /> : <GitHubIcon />}
        {loginLabel} GitHub
      </button>

      <button
        type="button"
        onClick={() => onOAuth("google")}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading === "google" ? <Spinner /> : <GoogleIcon />}
        {loginLabel} Google
      </button>
    </div>
  );
}

export function AuthDivider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/[0.07]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#16161a] px-3 text-[11px] text-[#52525b] rounded select-none">
          {label}
        </span>
      </div>
    </div>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6.5 4v3M6.5 9h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {message}
    </div>
  );
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  autoComplete?: string;
  strength?: PasswordStrength;
}

export function PasswordInput({
  id,
  value,
  onChange,
  showPassword,
  onToggleShow,
  placeholder = "••••••••",
  autoComplete = "current-password",
  strength,
}: PasswordInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-white placeholder-[#52525b] transition-all"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors cursor-pointer"
          tabIndex={-1}
        >
          {showPassword ? (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M13 7.5S10.5 12 7.5 12 2 7.5 2 7.5 4.5 3 7.5 3 13 7.5 13 7.5Z" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 2l11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M13 7.5S10.5 12 7.5 12 2 7.5 2 7.5 4.5 3 7.5 3 13 7.5 13 7.5Z" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>
      </div>

      {/* Optional strength bar */}
      {strength && value.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength.score ? strength.barColor : "bg-white/[0.07]"
                }`}
              />
            ))}
          </div>
          <span className={`text-[10px] font-medium ${strength.labelColor}`}>
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}


interface SubmitButtonProps {
  loading: boolean;
  disabled: boolean;
  label: string;
  loadingLabel: string;
}

export function SubmitButton({ loading, disabled, label, loadingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold mt-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Spinner />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
