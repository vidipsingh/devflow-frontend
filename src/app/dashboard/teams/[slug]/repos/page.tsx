
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getMyMembership,
  listTeamRepos,
  addTeamRepo,
  removeTeamRepo,
  TeamRepo,
} from "@/hooks/useTeams";
import { apiFetch } from "@/lib/apiFetch";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconRepo() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 16h5" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

// ─── Add Repo Modal ───────────────────────────────────────────────────────────

interface SimpleRepo { name: string; slug: string; visibility: string; }

function AddRepoModal({
  onAdd,
  onClose,
  existingNames,
}: {
  onAdd: (name: string) => Promise<void>;
  onClose: () => void;
  existingNames: string[];
}) {
  const [allRepos, setAllRepos]   = useState<SimpleRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selected, setSelected]   = useState("");
  const [open, setOpen]           = useState(false);
  const [adding, setAdding]       = useState(false);
  const [err, setErr]             = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: { repositories: { name: string; slug: string; visibility: string }[] } }>(
      "/api/v1/repositories"
    )
      .then(json => {
        const list = (json?.data?.repositories ?? []).filter(
          r => !existingNames.includes(r.name)
        );
        setAllRepos(list);
        if (list.length > 0) setSelected(list[0].name);
      })
      .catch(() => setAllRepos([]))
      .finally(() => setLoadingRepos(false));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const selectedRepo = allRepos.find(r => r.name === selected);

  async function submit() {
    if (!selected) return;
    setAdding(true);
    setErr(null);
    try {
      await onAdd(selected);
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to add repository");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0d0d14] border border-white/[0.08] rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-semibold mb-1">Add Repository to Team</h3>
        <p className="text-white/40 text-sm mb-4">Select one of your repositories to link to this team.</p>

        {loadingRepos ? (
          <div className="h-10 rounded-xl bg-white/[0.04] animate-pulse mb-4" />
        ) : allRepos.length === 0 ? (
          <div className="py-6 text-center text-white/30 text-sm mb-4">
            {existingNames.length > 0
              ? "All your repositories are already in this team."
              : "No repositories found. Create a repository first."}
          </div>
        ) : (
          <div className="mb-4 space-y-2">
            <label className="text-xs text-white/50">Repository</label>
            {/* Custom dropdown — avoids native <select> styling issues */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white hover:border-violet-500/40 focus:outline-none focus:border-violet-500/40 transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{selectedRepo?.name ?? "Select…"}</span>
                  {selectedRepo?.visibility === "private" && (
                    <span className="flex-shrink-0 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">private</span>
                  )}
                </span>
                <svg className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open && (
                <div className="absolute z-10 mt-1 w-full bg-[#0d0d14] border border-white/[0.09] rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                  {allRepos.map(r => (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => { setSelected(r.name); setOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-white/[0.05] transition-colors ${r.name === selected ? "text-violet-300 bg-violet-500/10" : "text-white/80"}`}
                    >
                      <span className="truncate">{r.name}</span>
                      {r.visibility === "private" && (
                        <span className="flex-shrink-0 ml-2 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">private</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {err && <p className="text-rose-400 text-xs mb-3">{err}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!selected || adding || allRepos.length === 0 || loadingRepos}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            {adding ? "Adding…" : "Add Repository"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Remove Confirm Modal ─────────────────────────────────────────────────────

function RemoveConfirmModal({
  repoName,
  onConfirm,
  onCancel,
  removing,
}: {
  repoName: string;
  onConfirm: () => void;
  onCancel: () => void;
  removing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0d0d14] border border-white/[0.08] rounded-2xl p-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <IconTrash />
        </div>
        <h3 className="text-white font-semibold text-center mb-2">Remove Repository</h3>
        <p className="text-white/40 text-sm text-center mb-6">
          Remove <span className="text-white/70 font-medium">{repoName}</span> from this team?
          The repository itself will not be deleted.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={removing}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.04] text-sm transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={removing}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 text-sm font-medium transition-colors disabled:opacity-40"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamReposPage() {
  const { slug } = useParams<{ slug: string }>();
  const [repos, setRepos] = useState<TeamRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ repoSlug: string; repoName: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isAdmin = myRole === "owner" || myRole === "admin" || myRole === "maintainer";

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [membership, repoList] = await Promise.all([
        getMyMembership(slug),
        listTeamRepos(slug, 50, 0),
      ]);
      setMyRole(membership?.role ?? null);
      setRepos(repoList);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(repoName: string) {
    const added = await addTeamRepo(slug, repoName);
    setRepos(prev => [added, ...prev]);
    setSuccessMsg(`✓ "${repoName}" added to team`);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    const { repoSlug, repoName } = removeTarget;
    setRemoving(repoSlug);
    try {
      await removeTeamRepo(slug, repoSlug);
      setRepos(prev => prev.filter(r => r.repoSlug !== repoSlug));
      setSuccessMsg(`"${repoName}" removed from team`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setRemoveTarget(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/dashboard/teams/${slug}`}
            className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            <IconBack />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Repositories</h1>
            <p className="text-white/40 text-sm">/{slug}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              <IconPlus /> Add Repository
            </button>
          )}
        </div>

        {successMsg && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            {successMsg}
          </div>
        )}
        {err && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            {err}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4 text-white/20">
              <IconRepo />
            </div>
            <p className="text-sm">No repositories linked to this team yet.</p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium transition-colors"
              >
                Add the first repository
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {repos.map(repo => (
              <div
                key={repo.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                  <IconRepo />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">{repo.repoName}</span>
                    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      repo.visibility === "public"
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-amber-400 bg-amber-500/10"
                    }`}>
                      {repo.visibility === "public" ? <IconGlobe /> : <IconLock />}
                      {repo.visibility}
                    </span>
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">
                    Added {new Date(repo.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/repositories/${repo.repoFullName || repo.repoSlug.replace("~", "/")}`}
                  className="px-3 py-1.5 rounded-lg text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                >
                  View
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => setRemoveTarget({ repoSlug: repo.repoSlug, repoName: repo.repoName })}
                    disabled={removing === repo.repoSlug}
                    className="p-1.5 rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                    title="Remove from team"
                  >
                    <IconTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddRepoModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          existingNames={repos.map(r => r.repoName)}
        />
      )}

      {removeTarget && (
        <RemoveConfirmModal
          repoName={removeTarget.repoName}
          onConfirm={confirmRemove}
          onCancel={() => { setRemoveTarget(null); }}
          removing={removing === removeTarget.repoSlug}
        />
      )}
    </div>
  );
}
