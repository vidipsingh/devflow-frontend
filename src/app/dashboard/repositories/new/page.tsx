
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Lock,
  Globe,
  GitBranch,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useRepoActions } from "@/hooks/useRepoActions";

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-white/70 mb-2">
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-white/35">{children}</p>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
      <AlertCircle size={11} /> {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Visibility option
// ---------------------------------------------------------------------------

function VisibilityOption({
  value,
  selected,
  onSelect,
}: {
  value: "public" | "private";
  selected: boolean;
  onSelect: () => void;
}) {
  const isPublic = value === "public";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-start gap-3 w-full rounded-xl border p-4 transition-all text-left cursor-pointer ${
        selected
          ? "border-indigo-500/60 bg-indigo-500/10"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      {/* Radio dot */}
      <span
        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
          selected ? "border-indigo-500" : "border-white/30"
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
      </span>
      {/* Icon */}
      <span className={`flex-shrink-0 mt-0.5 ${isPublic ? "text-emerald-400" : "text-rose-400"}`}>
        {isPublic ? <Globe size={16} /> : <Lock size={16} />}
      </span>
      {/* Text */}
      <div>
        <p className="text-sm font-semibold text-white capitalize">{value}</p>
        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
          {isPublic
            ? "Anyone on DevFlow can see this repository."
            : "Only you and collaborators can access this repository."}
        </p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewRepositoryPage() {
  const router = useRouter();
  const { createRepo, isSubmitting } = useRepoActions();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [autoInit, setAutoInit] = useState(true);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Live slug preview
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Repository name is required.";
    else if (name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    else if (!/^[a-zA-Z0-9._-]+$/.test(name.trim()))
      e.name = "Only letters, numbers, hyphens, dots, and underscores are allowed.";
    if (!defaultBranch.trim()) e.defaultBranch = "Default branch name is required.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const { ok, error } = await createRepo({
      name: name.trim(),
      description: description.trim(),
      visibility,
      defaultBranch: defaultBranch.trim(),
      autoInit,
    });

    if (!ok) {
      setSubmitError(error ?? "Something went wrong.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/dashboard/repositories"), 1200);
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/repositories"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to repositories
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
          <BookOpen size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Create a new repository</h1>
          <p className="text-sm text-white/40 mt-0.5">
            A repository contains all your project files and revision history.
          </p>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 mb-6 text-sm text-emerald-400">
          <CheckCircle2 size={16} />
          Repository created! Redirecting…
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 mb-6 text-sm text-red-400">
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Name */}
        <div>
          <FieldLabel htmlFor="name">
            Repository name <span className="text-red-400">*</span>
          </FieldLabel>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            placeholder="my-awesome-project"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
          />
          {slug && name && (
            <p className="mt-1.5 text-xs text-white/35">
              Slug: <span className="text-indigo-400">{slug}</span>
            </p>
          )}
          <FieldError message={errors.name} />
          <FieldHint>Great repository names are short and memorable.</FieldHint>
        </div>

        {/* Description */}
        <div>
          <FieldLabel htmlFor="description">
            Description{" "}
            <span className="text-white/30 font-normal">(optional)</span>
          </FieldLabel>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description of your repository…"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all resize-none"
          />
        </div>

        <hr className="border-white/8" />

        {/* Visibility */}
        <div>
          <FieldLabel htmlFor="visibility">Visibility</FieldLabel>
          <div className="flex flex-col gap-2">
            <VisibilityOption
              value="public"
              selected={visibility === "public"}
              onSelect={() => setVisibility("public")}
            />
            <VisibilityOption
              value="private"
              selected={visibility === "private"}
              onSelect={() => setVisibility("private")}
            />
          </div>
        </div>

        <hr className="border-white/8" />

        {/* Default branch */}
        <div>
          <FieldLabel htmlFor="defaultBranch">
            <span className="flex items-center gap-1.5">
              <GitBranch size={14} />
              Default branch
            </span>
          </FieldLabel>
          <input
            id="defaultBranch"
            type="text"
            value={defaultBranch}
            onChange={(e) => {
              setDefaultBranch(e.target.value);
              setErrors((p) => ({ ...p, defaultBranch: "" }));
            }}
            placeholder="main"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
          />
          <FieldError message={errors.defaultBranch} />
        </div>

        {/* Auto-init */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={autoInit}
              onChange={(e) => setAutoInit(e.target.checked)}
              className="sr-only"
            />
            <div
              onClick={() => setAutoInit((p) => !p)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                autoInit
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-white/30 bg-transparent"
              }`}
            >
              {autoInit && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white flex items-center gap-1.5">
              <FileText size={14} className="text-white/50" />
              Initialise this repository with a README
            </p>
            <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
              This will let you immediately clone the repository to your computer.
            </p>
          </div>
        </label>

        <hr className="border-white/8" />

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Link
            href="/dashboard/repositories"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/8 transition-all border border-white/10"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Creating…
              </>
            ) : (
              "Create repository"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
