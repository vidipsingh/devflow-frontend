
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getTeam, updateTeam, deleteTeam, transferOwnership, listTeamMembers, createSubTeam, Team, TeamMember } from "@/hooks/useTeams";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

// ─── Danger section ───────────────────────────────────────────────────────────

function DangerAction({ title, description, buttonLabel, onClick, color = "rose" }: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  color?: "rose" | "amber";
}) {
  const cls = color === "amber"
    ? "border-amber-500/20 text-amber-400 bg-amber-500/10 hover:bg-amber-500/15"
    : "border-rose-500/20 text-rose-400 bg-rose-500/10 hover:bg-rose-500/15";
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-white/[0.04] last:border-0">
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="text-xs text-white/35 mt-0.5">{description}</p>
      </div>
      <button onClick={onClick} className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-medium transition-colors ${cls}`}>
        {buttonLabel}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TeamSettingsPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [team, setTeam]         = useState<Team | null>(null);
  const [members, setMembers]   = useState<TeamMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ text: string; type: "ok" | "err" } | null>(null);

  // Form state
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [bio, setBio]                 = useState("");
  const [avatar, setAvatar]           = useState("");
  const [banner, setBanner]           = useState("");
  const [visibility, setVisibility]   = useState("public");
  const [joinPolicy, setJoinPolicy]   = useState("invite_only");
  const [tagInput, setTagInput]       = useState("");
  const [tags, setTags]               = useState<string[]>([]);

  // Danger zone state
  const [transferTo, setTransferTo]   = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Sub-team creation
  const [subName, setSubName]               = useState("");
  const [subDesc, setSubDesc]               = useState("");
  const [subVisibility, setSubVisibility]   = useState("public");
  const [subJoinPolicy, setSubJoinPolicy]   = useState("invite_only");
  const [creatingSubTeam, setCreatingSubTeam] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      getTeam(slug),
      listTeamMembers(slug, "", 100, 0).catch(() => [] as TeamMember[]),
    ]).then(([t, ms]) => {
      setTeam(t);
      setMembers(ms);
      // Populate form
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

  // Auth check
  const storedUser = (() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem("devflow_user") || "null"); } catch { return null; }
  })();
  const myUsername = storedUser?.username ?? "";
  const me = members.find(m => m.username === myUsername);
  const isOwner = me?.role === "owner";
  const isAdmin = isOwner || me?.role === "admin";

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/,/g, "");
      if (t && !tags.includes(t) && tags.length < 8) setTags(prev => [...prev, t]);
      setTagInput("");
    }
  }

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
      // If slug changed (name changed), redirect
      if (updated.slug !== slug) {
        router.replace(`/dashboard/teams/${updated.slug}/settings`);
      }
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Failed to save", type: "err" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTransfer() {
    if (!transferTo.trim()) return;
    if (!confirm(`Transfer ownership to "${transferTo}"? You will become an admin.`)) return;
    try {
      await transferOwnership(slug, transferTo.trim());
      setMsg({ text: `Ownership transferred to ${transferTo}`, type: "ok" });
      setTransferTo("");
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Failed", type: "err" });
    }
  }

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
      setSubName("");
      setSubDesc("");
      setSubVisibility("public");
      setSubJoinPolicy("invite_only");
    } catch (err: unknown) {
      setMsg({ text: err instanceof Error ? err.message : "Failed to create sub-team", type: "err" });
    } finally {
      setCreatingSubTeam(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== team?.name) {
      setMsg({ text: `Type the team name "${team?.name}" to confirm deletion`, type: "err" });
      return;
    }
    try {
      await deleteTeam(slug);
      router.replace("/dashboard/teams");
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : "Failed", type: "err" });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center gap-3">
        <p className="text-rose-400">You don't have permission to access team settings.</p>
        <Link href={`/dashboard/teams/${slug}`} className="text-sm text-white/40 hover:text-white/70">← Back to Team</Link>
      </div>
    );
  }

  const fieldCls = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors";

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Back */}
        <Link href={`/dashboard/teams/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white/60 transition-colors mb-8">
          <IconArrowLeft /> Back to Team
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Team Settings</h1>
            <p className="text-white/40 text-sm">/{slug}</p>
          </div>
          <div className="flex gap-2">
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

        {/* Message */}
        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-xl border text-sm ${msg.type === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-rose-500/10 border-rose-500/20 text-rose-300"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Identity ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Identity</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Team Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={64} className={fieldCls} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Short Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} maxLength={256} placeholder="Brief tagline shown on team cards" className={fieldCls} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Bio / README <span className="text-white/25 text-[11px]">(Markdown)</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={5} placeholder="Team mission, goals, and how to contribute…" className={`${fieldCls} resize-none`} />
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
              <label className="text-sm font-medium text-white/70">Tags <span className="text-white/25 text-[11px]">(press Enter)</span></label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-violet-400 hover:text-rose-400 transition-colors leading-none">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Add tags…"
                disabled={tags.length >= 8}
                className={`${fieldCls} disabled:opacity-40`}
              />
            </div>
          </section>

          {/* ── Access ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Access</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Visibility</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value)} className={fieldCls}>
                <option value="public"  className="bg-[#0d0d14]">Public — anyone can find this team</option>
                <option value="private" className="bg-[#0d0d14]">Private — only members can see</option>
                <option value="secret"  className="bg-[#0d0d14]">Secret — hidden from all listings</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Join Policy</label>
              <select value={joinPolicy} onChange={e => setJoinPolicy(e.target.value)} className={fieldCls}>
                <option value="open"        className="bg-[#0d0d14]">Open — anyone can join instantly</option>
                <option value="request"     className="bg-[#0d0d14]">By Request — admins must approve</option>
                <option value="invite_only" className="bg-[#0d0d14]">Invite Only — members must be invited</option>
              </select>
            </div>
          </section>

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <IconSave />
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>

        {/* ── Sub-Teams ── */}
        <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#0d0d14] p-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-1">Create Sub-Team</h2>
          <p className="text-xs text-white/35 mb-5">
            Sub-teams inherit from <span className="text-white/55">{team?.name}</span> and allow fine-grained access partitioning.
          </p>
          <form onSubmit={handleCreateSubTeam} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Sub-team Name <span className="text-rose-400">*</span></label>
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
                placeholder="Brief description of this sub-team"
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
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {creatingSubTeam ? "Creating…" : "Create Sub-Team"}
            </button>
          </form>
        </section>

        {/* ── Danger Zone ── */}
        <section className="mt-8 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-6">
          <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wide mb-4">Danger Zone</h2>

          {/* Transfer Ownership */}
          {isOwner && (
            <div className="py-4 border-b border-rose-500/10">
              <p className="text-sm font-medium text-white/80 mb-1">Transfer Ownership</p>
              <p className="text-xs text-white/35 mb-3">Assign the owner role to another member. You will become an admin.</p>
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
                  disabled={!transferTo.trim()}
                  className="px-4 py-2 rounded-xl border border-amber-500/20 text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 text-xs font-medium transition-colors disabled:opacity-40"
                >
                  Transfer
                </button>
              </div>
            </div>
          )}

          {/* Delete Team */}
          {isOwner && (
            <div className="pt-4">
              <p className="text-sm font-medium text-white/80 mb-1">Delete Team</p>
              <p className="text-xs text-white/35 mb-3">
                This action is permanent and cannot be undone. Type <span className="font-mono text-white/60">{team?.name}</span> to confirm.
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
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl border border-rose-500/20 text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {!isOwner && (
            <p className="text-xs text-white/30">Only the team owner can perform destructive actions.</p>
          )}
        </section>
      </div>
    </div>
  );
}
