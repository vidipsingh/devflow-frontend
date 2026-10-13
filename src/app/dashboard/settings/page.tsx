
"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserPreferences {
  theme: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyOnMention: boolean;
  notifyOnPRReview: boolean;
  notifyOnIssueAssigned: boolean;
  notifyOnTeamInvite: boolean;
  defaultVisibility: string;
  defaultBranch: string;
  showEmail: boolean;
  weeklyDigest: boolean;
}

interface UserSession {
  sessionId: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastSeen: string;
}

interface ProfileData {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  plan: string;
  isVerified: boolean;
  preferences: UserPreferences;
  createdAt: string;
  stats: { publicRepos: number; followers: number; following: number; totalStars: number };
  subscription: { plan: string; status: string; renewalDate: string | null };
  aiUsage: { reviewsUsed: number; reviewsLimit: number };
  wallet: { balance: number; totalEarned: number; currency: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function parseUA(ua: string): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return ua.slice(0, 40);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/[0.08] rounded-xl bg-[#0d0d14] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description && <p className="text-white/40 text-sm mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">{children}</label>;
}

function TextInput({ value, onChange, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors disabled:opacity-40"
    />
  );
}

function PasswordInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 pr-10 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        {show ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-10 h-5 rounded-full flex-shrink-0 transition-colors ${checked ? "bg-indigo-500" : "bg-white/[0.1]"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
      <div>
        <p className="text-sm text-white/80 group-hover:text-white transition-colors">{label}</p>
        {description && <p className="text-xs text-white/35 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function SaveButton({ loading, onClick, label = "Save changes" }: {
  loading: boolean; onClick: () => void; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
    >
      {loading && (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {label}
    </button>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl animate-in slide-in-from-bottom-4 ${
      type === "success"
        ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300"
        : "bg-red-500/15 border-red-500/25 text-red-300"
    }`}>
      {type === "success" ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = "profile" | "preferences" | "security" | "account";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Profile form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Preferences state
  const [prefs, setPrefs] = useState<UserPreferences>({
    theme: "dark",
    emailNotifications: true,
    pushNotifications: false,
    notifyOnMention: true,
    notifyOnPRReview: true,
    notifyOnIssueAssigned: true,
    notifyOnTeamInvite: true,
    defaultVisibility: "public",
    defaultBranch: "main",
    showEmail: false,
    weeklyDigest: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Account deletion state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load profile
  useEffect(() => {
    apiFetch<{ success: boolean; data: ProfileData }>("/api/v1/settings/profile")
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setProfile(d);
          setName(d.name ?? "");
          setUsername(d.username ?? "");
          setBio(d.bio ?? "");
          setAvatar(d.avatar ?? "");
          if (d.preferences) setPrefs(d.preferences);
        }
      })
      .catch(() => showToast("Failed to load profile", "error"))
      .finally(() => setLoadingProfile(false));
  }, [showToast]);

  // Load sessions when security tab is opened
  useEffect(() => {
    if (activeTab !== "security") return;
    setLoadingSessions(true);
    apiFetch<{ success: boolean; data: { sessions: UserSession[] } }>("/api/v1/settings/security/sessions")
      .then((json) => {
        if (json.success) setSessions(json.data?.sessions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [activeTab]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const json = await apiFetch<{ success: boolean; error?: string }>("/api/v1/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, username, bio, avatar }),
      });
      if (!json.success) throw new Error(json.error ?? "Failed");
      showToast("Profile updated successfully", "success");
      setProfile((p) => p ? { ...p, name, username, bio, avatar } : p);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const json = await apiFetch<{ success: boolean; error?: string }>("/api/v1/settings/preferences", {
        method: "PATCH",
        body: JSON.stringify(prefs),
      });
      if (!json.success) throw new Error(json.error ?? "Failed");
      showToast("Preferences saved", "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to save preferences", "error");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const json = await apiFetch<{ success: boolean; error?: string }>("/api/v1/settings/security/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!json.success) throw new Error(json.error ?? "Failed");
      showToast("Password changed successfully", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to change password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiFetch(`/api/v1/settings/security/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((s) => s.filter((x) => x.sessionId !== sessionId));
      showToast("Session revoked", "success");
    } catch {
      showToast("Failed to revoke session", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      showToast("Type DELETE to confirm", "error");
      return;
    }
    setDeletingAccount(true);
    try {
      const json = await apiFetch<{ success: boolean; error?: string }>("/api/v1/settings/account", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmation }),
      });
      if (!json.success) throw new Error(json.error ?? "Failed");
      // Redirect to home after deletion
      window.location.href = "/";
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to delete account", "error");
      setDeletingAccount(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: "account",
      label: "Account",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-white/40 text-sm mt-1">Manage your account, preferences, and security.</p>
        </div>

        <div className="flex gap-6">

          {/* ── Sidebar nav ─────────────────────────────────────────────── */}
          <aside className="w-48 shrink-0">
            <nav className="space-y-0.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                    activeTab === t.id
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Plan badge */}
            {profile && (
              <div className="mt-6 px-3 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-white/30 text-xs">Current plan</p>
                <p className={`text-sm font-semibold mt-0.5 capitalize ${
                  profile.plan === "pro" ? "text-indigo-300" : profile.plan === "team" ? "text-violet-300" : "text-white/60"
                }`}>
                  {profile.plan}
                </p>
              </div>
            )}
          </aside>

          {/* ── Main content ────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-5">

            {loadingProfile ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.05]" />
                ))}
              </div>
            ) : (

              <>
                {/* ── PROFILE TAB ─────────────────────────────────────── */}
                {activeTab === "profile" && (
                  <div className="space-y-5">
                    <SectionCard title="Public profile" description="This information will be displayed on your public profile.">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Full name</FieldLabel>
                          <TextInput value={name} onChange={setName} placeholder="Your name" />
                        </div>
                        <div>
                          <FieldLabel>Username</FieldLabel>
                          <TextInput value={username} onChange={setUsername} placeholder="username" />
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Bio</FieldLabel>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell people a little about yourself"
                          rows={3}
                          className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors resize-none"
                        />
                      </div>

                      <div>
                        <FieldLabel>Email</FieldLabel>
                        <TextInput value={profile?.email ?? ""} onChange={() => {}} disabled placeholder="email@example.com" />
                        <p className="text-white/25 text-xs mt-1">Email cannot be changed here. Contact support.</p>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-white/[0.05]">
                        <SaveButton loading={savingProfile} onClick={handleSaveProfile} />
                      </div>
                    </SectionCard>

                    {/* Stats card */}
                    {profile && (
                      <SectionCard title="Account overview">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            { label: "Repositories", value: profile.stats?.publicRepos ?? 0 },
                            { label: "Total stars", value: profile.stats?.totalStars ?? 0 },
                            { label: "Followers", value: profile.stats?.followers ?? 0 },
                            { label: "Following", value: profile.stats?.following ?? 0 },
                          ].map((stat) => (
                            <div key={stat.label} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                              <p className="text-2xl font-bold text-white">{stat.value}</p>
                              <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-white/25 text-xs">Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </SectionCard>
                    )}

                    {/* AI + subscription */}
                    {profile && (
                      <SectionCard title="Plan & usage">
                        <div className="flex items-center justify-between py-1">
                          <div>
                            <p className="text-sm text-white/70">Current plan</p>
                            <p className={`text-lg font-bold capitalize ${
                              profile.plan === "pro" ? "text-indigo-300"
                              : profile.plan === "team" ? "text-violet-300"
                              : "text-white/50"
                            }`}>{profile.plan}</p>
                          </div>
                          {profile.plan === "free" && (
                            <a href="/dashboard/upgrade" className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-colors">
                              Upgrade →
                            </a>
                          )}
                        </div>
                        <div className="border-t border-white/[0.06] pt-3">
                          <p className="text-xs text-white/40 mb-2">AI Review usage this month</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (profile.aiUsage.reviewsUsed / Math.max(1, profile.aiUsage.reviewsLimit)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/40 shrink-0">
                              {profile.aiUsage.reviewsUsed} / {profile.aiUsage.reviewsLimit === 999999 ? "∞" : profile.aiUsage.reviewsLimit}
                            </span>
                          </div>
                        </div>
                      </SectionCard>
                    )}
                  </div>
                )}

                {/* ── PREFERENCES TAB ─────────────────────────────────── */}
                {activeTab === "preferences" && (
                  <div className="space-y-5">
                    <SectionCard title="Repository defaults" description="Default settings applied to new repositories.">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Default visibility</FieldLabel>
                          <select
                            value={prefs.defaultVisibility}
                            onChange={(e) => setPrefs((p) => ({ ...p, defaultVisibility: e.target.value }))}
                            className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white/80 appearance-none focus:outline-none focus:border-indigo-400/50 transition-colors"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Default branch name</FieldLabel>
                          <select
                            value={prefs.defaultBranch}
                            onChange={(e) => setPrefs((p) => ({ ...p, defaultBranch: e.target.value }))}
                            className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white/80 appearance-none focus:outline-none focus:border-indigo-400/50 transition-colors"
                          >
                            <option value="main">main</option>
                            <option value="master">master</option>
                          </select>
                        </div>
                      </div>
                      <Toggle checked={prefs.showEmail} onChange={(v) => setPrefs((p) => ({ ...p, showEmail: v }))} label="Show email publicly" description="Your email address will be visible on your public profile" />
                    </SectionCard>

                    <div className="flex justify-end">
                      <SaveButton loading={savingPrefs} onClick={handleSavePreferences} label="Save preferences" />
                    </div>
                  </div>
                )}

                {/* ── SECURITY TAB ─────────────────────────────────────── */}
                {activeTab === "security" && (
                  <div className="space-y-5">
                    {/* Change password */}
                    <SectionCard title="Change password" description="Update the password used to sign in to your account.">
                      {profile?.plan !== undefined && (
                        <div className="space-y-3">
                          <div>
                            <FieldLabel>Current password</FieldLabel>
                            <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="Your current password" />
                          </div>
                          <div>
                            <FieldLabel>New password</FieldLabel>
                            <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" />
                          </div>
                          <div>
                            <FieldLabel>Confirm new password</FieldLabel>
                            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat new password" />
                          </div>
                          {newPassword && confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-red-400 text-xs">Passwords do not match</p>
                          )}
                          <div className="flex justify-end pt-2 border-t border-white/[0.05]">
                            <SaveButton loading={savingPassword} onClick={handleChangePassword} label="Update password" />
                          </div>
                        </div>
                      )}
                    </SectionCard>

                    {/* Active sessions */}
                    <SectionCard title="Active sessions" description="Devices currently signed in to your account.">
                      {loadingSessions ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
                          ))}
                        </div>
                      ) : sessions.length === 0 ? (
                        <p className="text-white/30 text-sm">No active sessions recorded.</p>
                      ) : (
                        <div className="space-y-2">
                          {sessions.map((s) => (
                            <div key={s.sessionId} className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                                  <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm text-white/80">{parseUA(s.userAgent)}</p>
                                  <p className="text-xs text-white/30">{s.ip} · Last seen {timeAgo(s.lastSeen)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRevokeSession(s.sessionId)}
                                className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10 cursor-pointer"
                              >
                                Revoke
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                )}

                {/* ── ACCOUNT TAB ──────────────────────────────────────── */}
                {activeTab === "account" && (
                  <div className="space-y-5">
                    {/* Account info */}
                    {profile && (
                      <SectionCard title="Account information">
                        <div className="space-y-3">
                          {[
                            { label: "User ID", value: profile.id },
                            { label: "Email", value: profile.email },
                            { label: "Username", value: `@${profile.username}` },
                            { label: "Member since", value: new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                              <span className="text-white/40 text-sm">{row.label}</span>
                              <span className="text-white/70 text-sm font-mono">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    {/* Danger zone */}
                    <div className="border border-red-500/20 rounded-xl bg-red-500/[0.03] overflow-hidden">
                      <div className="px-6 py-4 border-b border-red-500/15">
                        <h2 className="text-base font-semibold text-red-400">Danger zone</h2>
                        <p className="text-white/40 text-sm mt-0.5">Irreversible and destructive actions.</p>
                      </div>
                      <div className="px-6 py-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-white/80">Delete this account</p>
                            <p className="text-white/35 text-sm mt-0.5">
                              Permanently delete your account, all repositories, and all data. This action cannot be undone.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-red-500/10">
                          {profile?.plan !== undefined && (
                            <div>
                              <FieldLabel>Confirm your password</FieldLabel>
                              <PasswordInput value={deletePassword} onChange={setDeletePassword} placeholder="Your password" />
                            </div>
                          )}
                          <div>
                            <FieldLabel>Type <span className="text-red-400 font-mono">DELETE</span> to confirm</FieldLabel>
                            <input
                              type="text"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder="DELETE"
                              className="w-full bg-[#0a0a0f] border border-red-500/20 rounded-lg px-3.5 py-2.5 text-sm text-red-300 placeholder-white/20 focus:outline-none focus:border-red-400/50 transition-colors"
                            />
                          </div>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deletingAccount || deleteConfirmation !== "DELETE"}
                            className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-medium hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            {deletingAccount && (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            )}
                            Delete my account permanently
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
