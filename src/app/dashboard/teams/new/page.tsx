
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTeam } from "@/hooks/useTeams";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── Option groups ─────────────────────────────────────────────────────────────

const TYPES = [
  { value: "organization", label: "Organization", desc: "A company or open-source org" },
  { value: "project",      label: "Project",      desc: "A focused project team" },
  { value: "department",   label: "Department",   desc: "A division inside an org" },
];

const VISIBILITIES = [
  { value: "public",  label: "Public",  desc: "Anyone can find and view this team", color: "text-emerald-400" },
  { value: "private", label: "Private", desc: "Only members can see this team",     color: "text-amber-400" },
  { value: "secret",  label: "Secret",  desc: "Hidden from all listings",           color: "text-rose-400" },
];

const JOIN_POLICIES = [
  { value: "open",         label: "Open",         desc: "Anyone can join immediately" },
  { value: "request",      label: "By Request",   desc: "Users request and admins approve" },
  { value: "invite_only",  label: "Invite Only",  desc: "Members must be explicitly invited" },
];

// ─── Select card ──────────────────────────────────────────────────────────────

interface SelectCardProps {
  value: string;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}

function SelectCard({ value, label, desc, selected, onClick, color }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
        selected
          ? "border-violet-500/50 bg-violet-500/10"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${color ?? "text-white/80"}`}>{label}</span>
        <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
          selected ? "border-violet-400 bg-violet-400" : "border-white/20"
        }`} />
      </div>
      <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewTeamPage() {
  const router = useRouter();

  const [name, setName]             = useState("");
  const [description, setDescription] = useState("");
  const [bio, setBio]               = useState("");
  const [type, setType]             = useState("organization");
  const [visibility, setVisibility] = useState("public");
  const [joinPolicy, setJoinPolicy] = useState("invite_only");
  const [tagInput, setTagInput]     = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Derived slug preview
  const slugPreview = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/,/g, "");
      if (t && !tags.includes(t) && tags.length < 8) {
        setTags(prev => [...prev, t]);
      }
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    setTags(prev => prev.filter(x => x !== t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Team name is required"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const team = await createTeam({ name: name.trim(), description, bio, type, visibility, joinPolicy, tags });
      router.push(`/dashboard/teams/${team.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create team");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Back link */}
        <Link
          href="/dashboard/teams"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          <IconArrowLeft /> Back to Teams
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Create a New Team</h1>
          <p className="text-white/40 text-sm mt-1">Set up your team's identity, visibility, and membership policy.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              Team Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Acme Engineering"
              maxLength={64}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
            {slugPreview && (
              <p className="text-[11px] text-white/30">
                Slug: <span className="text-violet-400">/{slugPreview}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Short Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description shown on the team card"
              maxLength={256}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Bio / README <span className="text-white/25 text-[11px]">(Markdown)</span></label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Describe your team's mission, goals, and how to contribute…"
              rows={4}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Tags <span className="text-white/25 text-[11px]">(press Enter or comma to add)</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-violet-400 hover:text-rose-400 transition-colors leading-none">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="typescript, backend, devops…"
              disabled={tags.length >= 8}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors disabled:opacity-40"
            />
          </div>

          {/* Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/70">Team Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TYPES.map(t => (
                <SelectCard key={t.value} {...t} selected={type === t.value} onClick={() => setType(t.value)} />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/70">Visibility</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {VISIBILITIES.map(v => (
                <SelectCard key={v.value} {...v} selected={visibility === v.value} onClick={() => setVisibility(v.value)} />
              ))}
            </div>
          </div>

          {/* Join Policy */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/70">Join Policy</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {JOIN_POLICIES.map(p => (
                <SelectCard key={p.value} {...p} selected={joinPolicy === p.value} onClick={() => setJoinPolicy(p.value)} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/teams"
              className="px-6 py-2.5 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:text-white/70 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating…" : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
