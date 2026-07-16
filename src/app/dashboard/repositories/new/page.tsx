
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRepoActions } from "@/hooks/useRepoActions";

export default function NewRepositoryPage() {
  const router = useRouter();
  const { createRepo, isCreating, actionError } = useRepoActions();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [autoInit, setAutoInit] = useState(true);
  const [nameError, setNameError] = useState("");

  // Validate repo name
  const validateName = (v: string) => {
    if (!v.trim()) return "Repository name is required";
    if (!/^[a-zA-Z0-9._-]+$/.test(v)) return "Only letters, numbers, hyphens, underscores, and dots are allowed";
    if (v.length > 100) return "Name must be 100 characters or less";
    return "";
  };

  const handleNameChange = (v: string) => {
    setName(v);
    setNameError(validateName(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateName(name);
    if (err) { setNameError(err); return; }

    const result = await createRepo({
      name: name.trim(),
      description: description.trim(),
      visibility,
      defaultBranch: defaultBranch.trim() || "main",
      autoInit,
    });

    if (result) {
      router.push(`/dashboard/repositories/${result.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
            <Link href="/dashboard/repositories" className="hover:text-white transition-colors">
              Repositories
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/70">New</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create a new repository</h1>
          <p className="text-white/40 text-sm">
            A repository contains all project files, including the revision history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">
              Repository name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="my-awesome-project"
              required
              className={`w-full bg-[#161b22] border rounded-lg px-4 py-2.5 text-white/90 text-sm placeholder-white/20 focus:outline-none transition-colors ${
                nameError
                  ? "border-red-400/50 focus:border-red-400"
                  : "border-white/10 focus:border-emerald-400/50"
              }`}
            />
            {nameError ? (
              <p className="text-red-400 text-xs">{nameError}</p>
            ) : name && (
              <p className="text-white/30 text-xs">
                Your repository will be at{" "}
                <span className="text-white/50 font-mono">
                  devflow/{name.toLowerCase().replace(/\s+/g, "-")}
                </span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">
              Description <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of what this project does"
              className="w-full bg-[#161b22] border border-white/10 rounded-lg px-4 py-2.5 text-white/90 text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Visibility */}
          <div className="space-y-3">
            <label className="text-white/70 text-sm font-medium">Visibility</label>
            <div className="space-y-2">
              {[
                {
                  value: "public" as const,
                  label: "Public",
                  desc: "Anyone on the internet can see this repository",
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  value: "private" as const,
                  label: "Private",
                  desc: "Only you and collaborators you add can see this repository",
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    visibility === opt.value
                      ? "border-emerald-400/40 bg-emerald-400/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.value}
                    checked={visibility === opt.value}
                    onChange={() => setVisibility(opt.value)}
                    className="sr-only"
                  />
                  <span className={visibility === opt.value ? "text-emerald-400" : "text-white/30"}>
                    {opt.icon}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${visibility === opt.value ? "text-white" : "text-white/60"}`}>
                      {opt.label}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">{opt.desc}</p>
                  </div>
                  <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    visibility === opt.value ? "border-emerald-400" : "border-white/20"
                  }`}>
                    {visibility === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Default branch */}
          <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">Default branch</label>
            <input
              type="text"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-[#161b22] border border-white/10 rounded-lg px-4 py-2.5 text-white/90 text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50 max-w-xs"
            />
          </div>

          {/* Auto init */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={autoInit}
                onChange={(e) => setAutoInit(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                autoInit ? "bg-emerald-500 border-emerald-500" : "border-white/20 group-hover:border-white/40"
              }`}>
                {autoInit && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Initialize with a README</p>
              <p className="text-white/30 text-xs mt-0.5">
                This will let you immediately clone the repository
              </p>
            </div>
          </label>

          {/* Global error */}
          {actionError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {actionError}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isCreating || !!nameError || !name.trim()}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                "Create repository"
              )}
            </button>
            <Link
              href="/dashboard/repositories"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
