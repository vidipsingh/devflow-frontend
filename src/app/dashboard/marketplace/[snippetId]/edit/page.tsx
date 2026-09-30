
"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSnippet, useMySnippets } from "@/hooks/useMarketplace";

const LANGUAGES = [
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java",
  "C++", "C", "C#", "PHP", "Ruby", "Swift", "Kotlin", "Dart",
  "Shell", "SQL", "HTML", "CSS", "Other",
];

const CATEGORIES = [
  "Utility", "Algorithm", "UI Component", "API Client", "Data Structures",
  "Authentication", "Database", "Testing", "DevOps", "Machine Learning", "Other",
];

export default function EditSnippetPage() {
  const { snippetId } = useParams<{ snippetId: string }>();
  const router = useRouter();
  const { snippet, isLoading, error } = useSnippet(snippetId);
  const { updateSnippet } = useMySnippets();

  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    preview: "",
    language: "",
    tags: "",
    category: "",
    version: "",
    pricingType: "free" as "free" | "paid",
    price: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  // Populate form when snippet loads
  useEffect(() => {
    if (!snippet) return;
    setForm({
      title: snippet.title,
      description: snippet.description ?? "",
      code: snippet.code,
      preview: snippet.preview ?? "",
      language: snippet.language ?? "",
      tags: (snippet.tags ?? []).join(", "),
      category: snippet.category ?? "",
      version: snippet.version ?? "1.0.0",
      pricingType: snippet.pricing?.type ?? "free",
      price: snippet.pricing?.type === "paid" ? String(snippet.pricing.price) : "",
    });
  }, [snippet]);

  const set = useCallback((k: keyof typeof form, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setSubmitError("Title is required"); return; }
    if (!form.code.trim()) { setSubmitError("Code is required"); return; }
    if (form.pricingType === "paid" && (!form.price || Number(form.price) <= 0)) {
      setSubmitError("Price must be greater than 0 for paid snippets");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      await updateSnippet(snippetId, {
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
      });
      setSaved(true);
      setTimeout(() => router.push(`/dashboard/marketplace/${snippetId}`), 1200);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, snippetId, updateSnippet, router]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-64 bg-[#111118] border border-white/[0.07] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 pt-24 text-center">
        <p className="text-white/50 text-sm">{error ?? "Snippet not found"}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-white/[0.06] text-white/70 text-xs rounded-lg border border-white/10">← Go back</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        <Link href="/dashboard/marketplace" className="hover:text-white/60 transition-colors">Marketplace</Link>
        <span>/</span>
        <Link href={`/dashboard/marketplace/${snippetId}`} className="hover:text-white/60 transition-colors truncate max-w-[160px]">{snippet.title}</Link>
        <span>/</span>
        <span className="text-white/60">Edit</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Edit Snippet</h1>
        <p className="text-sm text-white/40 mt-1">
          Status: <span className={snippet.status === "published" ? "text-emerald-400" : "text-amber-400"}>
            {snippet.status}
          </span>
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 8l5 5L14 3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Saved! Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6 space-y-5">
          <h2 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Basic Info</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
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
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Tags <span className="text-white/30">(comma-separated)</span></label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Code editor */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-1 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2">
            <h2 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mr-auto">Code</h2>
            <div className="flex gap-1">
              {(["code", "preview"] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${
                    activeTab === tab ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {tab === "preview" ? "Preview" : "Edit"}
                </button>
              ))}
            </div>
          </div>
          {activeTab === "code" ? (
            <textarea rows={16} value={form.code} onChange={(e) => set("code", e.target.value)}
              spellCheck={false}
              className="w-full px-4 py-4 bg-[#0a0a12] text-xs font-mono text-white/75 resize-none focus:outline-none leading-relaxed"
            />
          ) : (
            <pre className="w-full px-4 py-4 bg-[#0a0a12] text-xs font-mono text-white/70 leading-relaxed min-h-[256px] overflow-x-auto">
              {form.code || "// Nothing to preview"}
            </pre>
          )}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
            <p className="text-[10px] text-white/25">{form.code.length} chars · {form.code.split("\n").length} lines</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6 space-y-5">
          <h2 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Pricing</h2>
          <div className="flex gap-3">
            {[
              { value: "free", label: "Free", icon: "🆓" },
              { value: "paid", label: "Paid", icon: "💰" },
            ].map((opt) => (
              <button key={opt.value} type="button" onClick={() => set("pricingType", opt.value)}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  form.pricingType === opt.value
                    ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                    : "border-white/[0.08] bg-white/[0.02] text-white/50"
                }`}
              >
                <span>{opt.icon}</span>
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
          {form.pricingType === "paid" && (
            <div className="flex gap-4 items-end">
              <div className="space-y-1.5 w-40">
                <label className="text-xs font-medium text-white/60">Price (INR) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">₹</span>
                  <input type="number" min="1" step="1" value={form.price} onChange={(e) => set("price", e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>
              {form.price && Number(form.price) > 0 && (
                <div className="pb-2.5 text-xs text-white/40 space-y-0.5">
                  <p>You earn: <span className="text-emerald-400 font-semibold">₹{(Number(form.price) * 0.80).toFixed(2)}</span></p>
                </div>
              )}
            </div>
          )}
        </div>

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">{submitError}</div>
        )}

        <div className="flex items-center justify-between gap-4 pb-4">
          <Link href={`/dashboard/marketplace/${snippetId}`}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2.5 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-400 disabled:opacity-50 transition-colors shadow shadow-indigo-500/20 flex items-center gap-2"
          >
            {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
