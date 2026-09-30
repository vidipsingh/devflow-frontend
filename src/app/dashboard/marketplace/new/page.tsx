
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMySnippets } from "@/hooks/useMarketplace";

const LANGUAGES = [
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java",
  "C++", "C", "C#", "PHP", "Ruby", "Swift", "Kotlin", "Dart",
  "Shell", "SQL", "HTML", "CSS", "Other",
];

const CATEGORIES = [
  "Utility", "Algorithm", "UI Component", "API Client", "Data Structures",
  "Authentication", "Database", "Testing", "DevOps", "Machine Learning", "Other",
];

export default function NewSnippetPage() {
  const router = useRouter();
  const { createSnippet } = useMySnippets();

  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    preview: "",
    language: "",
    tags: "",
    category: "",
    version: "1.0.0",
    pricingType: "free" as "free" | "paid",
    price: "",
    currency: "INR",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  const set = useCallback((k: keyof typeof form, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.code.trim()) { setError("Code is required"); return; }
    if (form.pricingType === "paid" && (!form.price || Number(form.price) <= 0)) {
      setError("Price must be greater than 0 for paid snippets");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const snippet = await createSnippet({
        title: form.title.trim(),
        description: form.description.trim(),
        code: form.code,
        preview: form.preview || form.code.slice(0, 500),
        language: form.language,
        tags,
        category: form.category,
        version: form.version,
        pricingType: form.pricingType,
        price: form.pricingType === "paid" ? Number(form.price) : 0,
        currency: form.currency,
      });
      router.push(`/dashboard/marketplace/${snippet.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create snippet");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, createSnippet, router]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        <Link href="/dashboard/marketplace" className="hover:text-white/60 transition-colors">Marketplace</Link>
        <span>/</span>
        <Link href="/dashboard/marketplace/my-snippets" className="hover:text-white/60 transition-colors">My Snippets</Link>
        <span>/</span>
        <span className="text-white/60">New Snippet</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Publish a Snippet</h1>
        <p className="text-sm text-white/40 mt-1">Share your code with the community. Starts as draft — publish when ready.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest text-[10px]">Basic Info</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. JWT Auth Middleware for Go/Gin"
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does this snippet do? Include any dependencies or setup instructions."
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Language</label>
              <select
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
              >
                <option value="">Select language…</option>
                {LANGUAGES.map((l) => <option key={l} value={l.toLowerCase()}>{l}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Category</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Version</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => set("version", e.target.value)}
                placeholder="1.0.0"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Tags <span className="text-white/30">(comma-separated)</span></label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="auth, middleware, jwt, go"
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Code editor */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2">
            <h2 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mr-auto">Code</h2>
            <div className="flex gap-1">
              {(["code", "preview"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${
                    activeTab === tab
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {tab === "preview" ? "Preview" : "Edit"}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "code" ? (
            <textarea
              rows={16}
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="// Paste your code here…"
              spellCheck={false}
              className="w-full px-4 py-4 bg-[#0a0a12] text-xs font-mono text-white/75 placeholder-white/15 resize-none focus:outline-none leading-relaxed"
            />
          ) : (
            <pre className="w-full px-4 py-4 bg-[#0a0a12] text-xs font-mono text-white/70 leading-relaxed min-h-[256px] overflow-x-auto">
              {form.code || "// Nothing to preview yet"}
            </pre>
          )}

          <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
            <p className="text-[10px] text-white/25">
              {form.code.length} characters · {form.code.split("\n").length} lines
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6 space-y-5">
          <h2 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Pricing</h2>

          <div className="flex gap-3">
            {[
              { value: "free", label: "Free", desc: "Anyone can download", icon: "🆓" },
              { value: "paid", label: "Paid", desc: "Earn from your work", icon: "💰" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("pricingType", opt.value)}
                className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${
                  form.pricingType === opt.value
                    ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                    : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:border-white/20"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{opt.desc}</p>
                </div>
                {form.pricingType === opt.value && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                      <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {form.pricingType === "paid" && (
            <div className="flex gap-4 items-end">
              <div className="space-y-1.5 w-40">
                <label className="text-xs font-medium text-white/60">Price (INR) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="99"
                    className="w-full pl-7 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>
              {form.price && Number(form.price) > 0 && (
                <div className="pb-2.5 text-xs text-white/40 space-y-0.5">
                  <p>Platform fee: <span className="text-white/60">₹{(Number(form.price) * 0.20).toFixed(2)} (20%)</span></p>
                  <p>You earn: <span className="text-emerald-400 font-semibold">₹{(Number(form.price) * 0.80).toFixed(2)}</span></p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <Link
            href="/dashboard/marketplace/my-snippets"
            className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-400 disabled:opacity-50 transition-colors shadow shadow-indigo-500/20 flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isSubmitting ? "Creating…" : "Create Snippet (as Draft)"}
          </button>
        </div>
      </form>
    </div>
  );
}
