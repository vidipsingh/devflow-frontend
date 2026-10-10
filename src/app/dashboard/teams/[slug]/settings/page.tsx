
"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getTeam, updateTeam, deleteTeam,
  transferOwnership, leaveTeam,
  listTeamMembers, createSubTeam,
  Team, TeamMember,
} from "@/hooks/useTeams";

// ─── Reusable confirm modal ────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d14] shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <div className="text-sm text-white/55 leading-relaxed">{body}</div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 text-sm transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              danger
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-amber-600 hover:bg-amber-500 text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sticky sidebar nav ────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "identity",  label: "Identity" },
  { id: "access",    label: "Access" },
  { id: "subteams",  label: "Sub-Teams" },
  { id: "danger",    label: "Danger Zone" },
];

function SideNav({ activeSection }: { activeSection: string }) {
  return (
    <nav className="hidden lg:flex flex-col gap-1 sticky top-6 self-start w-44 shrink-0">
      {NAV_SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            activeSection === s.id
              ? "bg-violet-500/10 text-violet-300 font-medium"
              : s.id === "danger"
              ? "text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/[0.06]"
              : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
          }`}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TeamSettingsPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [team, setTeam]       = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ text: string; type: "ok" | "err" } | null>(null);

  // Sticky nav active section tracker
  const [activeSection, setActiveSection] = useState("identity");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Form state ─────────────────────────────────────────────────────────────
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [bio, setBio]                 = useState("");
  const [avatar, setAvatar]           = useState("");
  const [banner, setBanner]           = useState("");
  const [visibility, setVisibility]   = useState("public");
  const [joinPolicy, setJoinPolicy]   = useState("invite_only");
  const [tagInput, setTagInput]       = useState("");
  const [tags, setTags]               = useState<string[]>([]);

  // ── Danger zone modals ─────────────────────────────────────────────────────
  const [transferTo, setTransferTo]         = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState("");
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [showLeaveModal, setShowLeaveModal]       = useState(false);
  const [dangerBusy, setDangerBusy]         = useState(false);

  // ── Sub-team creation ───────────────────────────────────────────────────────
  const [subName, setSubName]               = useState("");
  const [subDesc, setSubDesc]               = useState("");
  const [subVisibility, setSubVisibility]   = useState("public");
  const [subJoinPolicy, setSubJoinPolicy]   = useState("invite_only");
  const [creatingSubTeam, setCreatingSubTeam] = useState(false);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    Promise.all([
      getTeam(slug),
      listTeamMembers(slug, "", 100, 0).catch(() => [] as TeamMember[]),
    ]).then(([t, ms]) => {
      setTeam(t);
      setMembers(ms);
      setName(t.name);
      setDescription(t.description || "");
      setBio(t.bio || "");
      setAvatar(t.avatar || "");
      setBanner(t.banner || "");
      setVisibility(t.visibility);
      setJoinPolicy(t.joinPolicy);
      setTags(t.tags || []);
    }).catch(e => {
      setMsg({ text: e.message, type: "err" });
    }).finally(() => setLoading(false));
  }, [slug]);

  // ── Intersection observer for sticky nav ──────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  // Decode userId and username directly from the JWT — this is the only auth
  // value reliably stored in localStorage (as "devflow_token").  The app never
  // writes a "devflow_user" key, so reading it always returns null.
  const { myUserId, myUsername } = (() => {
    if (typeof window === "undefined") return { myUserId: "", myUsername: "" };
    try {
      const token = localStorage.getItem("devflow_token");
      if (!token) return { myUserId: "", myUsername: "" };
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        myUserId:   (payload.userId ?? payload.sub ?? "") as string,
        myUsername: (payload.username ?? "") as string,
      };
    } catch { return { myUserId: "", myUsername: "" }; }
  })();

  // Match by username OR userId so either format in the members list works
  const me = members.find(
    m => (myUsername && m.username === myUsername) || (myUserId && m.userId === myUserId)
  );

  // Also treat the team creator as owner so the gate never fires before the
  // members list finishes resolving roles (race condition guard).
  const isCreator = !!(team && myUserId && team.createdBy === myUserId);
  const isOwner   = me?.role === "owner" || isCreator;
  const isAdmin   = isOwner || me?.role === "admin";

  // The loading guard above ensures we never render the "no permission" screen
  // while data is still in flight.

  // ── Tag helpers ─────────────────────────────────────────────────────────────
  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/,/g, "");
      if (t && !tags.includes(t) && tags.length < 8) setTags(prev => [...prev, t]);
      setTagInput("");
    }
  }

  // ── Save settings ───────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const updated = await updateTeam(slug, {
        name: name || undefined,
        description: description || undefined,
        bio: bio || undefined,
        avatar: avatar || undefined,
        banner: banner || undefined,
        visibility,
        joinPolicy,
        tags,
      });
      setTeam(updated);
      setMsg({ text: "Settings saved successfully!", type: "ok" });
      if (updated.slug !== slug) {
        router.replace(`/dashboard/teams/${updated.slug}/settings`);
      }
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Failed to save", type: "err" });
    } finally {
      setSaving(false);
    }
  }

  // ── Transfer ownership ──────────────────────────────────────────────────────
  async function handleTransfer() {
    if (!transferTo.trim()) return;
    setShowTransferModal(true);
  }

  async function confirmTransfer() {
    setDangerBusy(true);
    setShowTransferModal(false);
    try {
      await transferOwnership(slug, transferTo.trim());
      setMsg({ text: `Ownership transferred to @${transferTo}`, type: "ok" });
      setTransferTo("");
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Transfer failed", type: "err" });
    } finally {
      setDangerBusy(false);
    }
  }

  // ── Leave team ──────────────────────────────────────────────────────────────
  async function confirmLeave() {
    setDangerBusy(true);
    setShowLeaveModal(false);
    try {
      await leaveTeam(slug);
      router.replace("/dashboard/teams");
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Could not leave team", type: "err" });
      setDangerBusy(false);
    }
  }

  // ── Delete team ─────────────────────────────────────────────────────────────
  function handleDeleteClick() {
    if (deleteConfirm !== team?.name) {
      setMsg({ text: `Type the team name "${team?.name}" exactly to confirm deletion`, type: "err" });
      return;
    }
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    setDangerBusy(true);
    setShowDeleteModal(false);
    try {
      await deleteTeam(slug);
      router.replace("/dashboard/teams");
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Delete failed", type: "err" });
      setDangerBusy(false);
    }
  }

  // ── Create sub-team ─────────────────────────────────────────────────────────
  async function handleCreateSubTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!subName.trim()) return;
    setCreatingSubTeam(true);
    setMsg(null);
    try {
      await createSubTeam(slug, {
        name: subName.trim(),
        description: subDesc.trim() || undefined,
        visibility: subVisibility,
        joinPolicy: subJoinPolicy,
      });
      setMsg({ text: `Sub-team "${subName}" created successfully!`, type: "ok" });
      setSubName(""); setSubDesc(""); setSubVisibility("public"); setSubJoinPolicy("invite_only");
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Failed to create sub-team", type: "err" });
    } finally {
      setCreatingSubTeam(false);
    }
  }

  // ── Helper ref setter ───────────────────────────────────────────────────────
  function sectionRef(id: string) {
    return (el: HTMLElement | null) => { sectionRefs.current[id] = el; };
  }

  // ── Shared field class ──────────────────────────────────────────────────────
  const fieldCls = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors";

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Not authorized ─────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-white/60 text-sm">You don&apos;t have permission to access team settings.</p>
        <Link href={`/dashboard/teams/${slug}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          ← Back to Team
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Back link ──────────────────────────────────────────────────── */}
        <Link
          href={`/dashboard/teams/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white/60 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          Back to Team
        </Link>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Team Settings</h1>
            <p className="text-white/35 text-sm font-mono">/{slug}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/dashboard/teams/${slug}/activity`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-white/[0.06] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Activity
            </Link>
            <Link
              href={`/dashboard/teams/${slug}/audit-log`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-amber-500/60 hover:text-amber-400 hover:bg-amber-500/[0.06] border border-amber-500/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Audit Log
            </Link>
          </div>
        </div>

        {/* ── Flash message ──────────────────────────────────────────────── */}
        {msg && (
          <div className={`mb-6 flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${
            msg.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}>
            {msg.type === "ok" ? (
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="ml-auto text-current opacity-50 hover:opacity-100 cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Two-column layout: sticky sidebar + content ─────────────── */}
        <div className="flex gap-8 items-start">
          <SideNav activeSection={activeSection} />

          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">

              {/* ── Identity ──────────────────────────────────────────── */}
              <section
                id="identity"
                ref={sectionRef("identity")}
                className="scroll-mt-6 rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-6 space-y-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Identity</h2>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Team Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={64} className={fieldCls} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Short Description</label>
                  <input
                    type="text" value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={256}
                    placeholder="Brief tagline shown on team cards"
                    className={fieldCls}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">
                    Bio / README
                    <span className="text-white/25 text-[11px] ml-1">(Markdown)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={5}
                    placeholder="Team mission, goals, and how to contribute…"
                    className={`${fieldCls} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Avatar URL</label>
                    <input type="url" value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://…" className={fieldCls} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Banner URL</label>
                    <input type="url" value={banner} onChange={e => setBanner(e.target.value)} placeholder="https://…" className={fieldCls} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">
                    Tags
                    <span className="text-white/25 text-[11px] ml-1">(press Enter or comma · max 8)</span>
                  </label>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                          {tag}
                          <button
                            type="button"
                            onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                            className="text-violet-400 hover:text-rose-400 transition-colors leading-none cursor-pointer"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={tags.length >= 8 ? "Maximum tags reached" : "Add a tag…"}
                    disabled={tags.length >= 8}
                    className={`${fieldCls} disabled:opacity-40`}
                  />
                </div>
              </section>

              {/* ── Access ─────────────────────────────────────────────── */}
              <section
                id="access"
                ref={sectionRef("access")}
                className="scroll-mt-6 rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-6 space-y-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Access</h2>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Visibility</label>
                  <select value={visibility} onChange={e => setVisibility(e.target.value)} className={fieldCls}>
                    <option value="public"  className="bg-[#0d0d14]">Public — anyone can find this team</option>
                    <option value="private" className="bg-[#0d0d14]">Private — only members can see</option>
                    <option value="secret"  className="bg-[#0d0d14]">Secret — hidden from all listings</option>
                  </select>
                  <p className="text-xs text-white/30 mt-1">
                    {visibility === "public"  && "The team name and description are visible to everyone."}
                    {visibility === "private" && "Only members can view team details and discussions."}
                    {visibility === "secret"  && "The team is completely unlisted. Only direct-link access."}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Join Policy</label>
                  <select value={joinPolicy} onChange={e => setJoinPolicy(e.target.value)} className={fieldCls}>
                    <option value="open"        className="bg-[#0d0d14]">Open — anyone can join instantly</option>
                    <option value="request"     className="bg-[#0d0d14]">By Request — admins must approve</option>
                    <option value="invite_only" className="bg-[#0d0d14]">Invite Only — members must be invited</option>
                  </select>
                  <p className="text-xs text-white/30 mt-1">
                    {joinPolicy === "open"        && "Any logged-in user can join without approval."}
                    {joinPolicy === "request"     && "Users submit a request; admins approve or reject it."}
                    {joinPolicy === "invite_only" && "Users can only join if an admin or owner sends them an invite."}
                  </p>
                </div>
              </section>

              {/* ── Save button ──────────────────────────────────────────── */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
            </form>

            {/* ── Sub-Teams ────────────────────────────────────────────── */}
            <section
              id="subteams"
              ref={sectionRef("subteams")}
              className="scroll-mt-6 rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Create Sub-Team</h2>
              </div>
              <p className="text-xs text-white/35 mb-5">
                Sub-teams inherit from <span className="text-white/55 font-medium">{team?.name}</span> and allow fine-grained access partitioning.
              </p>

              <form onSubmit={handleCreateSubTeam} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">
                    Sub-team Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={subName}
                    onChange={e => setSubName(e.target.value)}
                    maxLength={64}
                    placeholder="e.g. Frontend, Infra, Security"
                    className={fieldCls}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Description</label>
                  <input
                    type="text"
                    value={subDesc}
                    onChange={e => setSubDesc(e.target.value)}
                    maxLength={256}
                    placeholder="Brief description"
                    className={fieldCls}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Visibility</label>
                    <select value={subVisibility} onChange={e => setSubVisibility(e.target.value)} className={fieldCls}>
                      <option value="public"  className="bg-[#0d0d14]">Public</option>
                      <option value="private" className="bg-[#0d0d14]">Private</option>
                      <option value="secret"  className="bg-[#0d0d14]">Secret</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Join Policy</label>
                    <select value={subJoinPolicy} onChange={e => setSubJoinPolicy(e.target.value)} className={fieldCls}>
                      <option value="open"        className="bg-[#0d0d14]">Open</option>
                      <option value="request"     className="bg-[#0d0d14]">By Request</option>
                      <option value="invite_only" className="bg-[#0d0d14]">Invite Only</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!subName.trim() || creatingSubTeam}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {creatingSubTeam ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Sub-Team
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* ── Danger Zone ──────────────────────────────────────────── */}
            <section
              id="danger"
              ref={sectionRef("danger")}
              className="scroll-mt-6 rounded-2xl border border-rose-500/25 bg-rose-500/[0.03] p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wide">Danger Zone</h2>
              </div>

              <div className="space-y-0 divide-y divide-rose-500/10">

                {/* Leave Team — available to all non-owner members */}
                {!isOwner && me && (
                  <div className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white/80">Leave Team</p>
                        <p className="text-xs text-white/35 mt-0.5">
                          You will lose access to all team repositories and discussions.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowLeaveModal(true)}
                        disabled={dangerBusy}
                        className="shrink-0 px-4 py-2 rounded-xl border border-amber-500/25 text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        Leave Team
                      </button>
                    </div>
                  </div>
                )}

                {/* Transfer Ownership — owner only */}
                {isOwner && (
                  <div className="py-4">
                    <p className="text-sm font-medium text-white/80 mb-1">Transfer Ownership</p>
                    <p className="text-xs text-white/35 mb-3">
                      Assign the owner role to another member. You will become an admin.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={transferTo}
                        onChange={e => setTransferTo(e.target.value)}
                        placeholder="Username of new owner"
                        className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40"
                      />
                      <button
                        onClick={handleTransfer}
                        disabled={!transferTo.trim() || dangerBusy}
                        className="px-4 py-2 rounded-xl border border-amber-500/20 text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        Transfer
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Team — owner only */}
                {isOwner && (
                  <div className="pt-4">
                    <p className="text-sm font-medium text-white/80 mb-1">Delete Team</p>
                    <p className="text-xs text-white/35 mb-3">
                      This action is <strong className="text-white/55">permanent and cannot be undone</strong>.
                      All members, repositories, discussions, and audit logs will be removed.
                      Type <span className="font-mono bg-white/[0.05] px-1 py-0.5 rounded text-white/60">{team?.name}</span> to confirm.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder={`Type "${team?.name}" to confirm`}
                        className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-rose-500/40"
                      />
                      <button
                        onClick={handleDeleteClick}
                        disabled={dangerBusy}
                        className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          deleteConfirm === team?.name
                            ? "border-rose-500/30 text-rose-300 bg-rose-500/15 hover:bg-rose-500/25"
                            : "border-rose-500/15 text-rose-400/50 bg-rose-500/5 cursor-not-allowed"
                        } disabled:opacity-40`}
                      >
                        Delete Team
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin-only note */}
                {!isOwner && (
                  <div className="pt-4">
                    <p className="text-xs text-white/25 italic">
                      Only the team owner can transfer ownership or permanently delete the team.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {showTransferModal && (
        <ConfirmModal
          title="Transfer Team Ownership"
          body={
            <>
              You are about to transfer ownership of <strong className="text-white">{team?.name}</strong> to{" "}
              <strong className="text-amber-300">@{transferTo}</strong>.<br /><br />
              You will be downgraded to <strong className="text-white">admin</strong>. This action can only be reversed by the new owner.
            </>
          }
          confirmLabel="Yes, transfer ownership"
          cancelLabel="Cancel"
          danger={false}
          onConfirm={confirmTransfer}
          onCancel={() => setShowTransferModal(false)}
        />
      )}

      {showLeaveModal && (
        <ConfirmModal
          title="Leave Team"
          body={
            <>
              Are you sure you want to leave <strong className="text-white">{team?.name}</strong>?<br /><br />
              You will immediately lose access to all team repositories and discussions. An admin can re-invite you later.
            </>
          }
          confirmLabel="Leave Team"
          cancelLabel="Stay"
          danger
          onConfirm={confirmLeave}
          onCancel={() => setShowLeaveModal(false)}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="Permanently Delete Team"
          body={
            <>
              This will <strong className="text-rose-300">permanently delete</strong> the team{" "}
              <strong className="text-white">{team?.name}</strong> along with all its members, repositories, discussions and audit history.<br /><br />
              <span className="text-rose-400/80">This action cannot be undone.</span>
            </>
          }
          confirmLabel="Delete forever"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
