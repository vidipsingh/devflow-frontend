
"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSnippet,
  useMySnippets,
  createPurchaseOrder,
  verifyPurchase,
  downloadSnippet,
  submitReview,
  type SnippetReview,
} from "@/hooks/useMarketplace";
import { getToken } from "@/lib/apiFetch";

// Decode the user ID from the stored JWT without a library
function getCurrentUserID(): string {
  try {
    const token = getToken();
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId ?? payload.sub ?? "";
  } catch {
    return "";
  }
}

// ─── Star rating display ───────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i} width={size} height={size} viewBox="0 0 12 12"
          className={rating >= i ? "text-amber-400" : rating >= i - 0.5 ? "text-amber-400/50" : "text-white/15"}
          fill="currentColor"
        >
          <path d="M6 1l1.2 2.4L10 3.8l-2 1.95.47 2.76L6 7.4l-2.47 1.1.47-2.76L2 3.8l2.8-.4L6 1z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Interactive star input ────────────────────────────────────────────────────

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i} type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <svg width="20" height="20" viewBox="0 0 12 12"
            className={(hover || value) >= i ? "text-amber-400" : "text-white/20"}
            fill="currentColor"
          >
            <path d="M6 1l1.2 2.4L10 3.8l-2 1.95.47 2.76L6 7.4l-2.47 1.1.47-2.76L2 3.8l2.8-.4L6 1z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: SnippetReview }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
  return (
    <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
            {(review.authorUsername || "?")[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-white">@{review.authorUsername}</span>
        </div>
        <div className="flex items-center gap-2">
          <Stars rating={review.rating} size={12} />
          <span className="text-[10px] text-white/30">{date}</span>
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-white/60 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SnippetDetailPage() {
  const { snippetId } = useParams<{ snippetId: string }>();
  const router = useRouter();
  const { snippet, reviews, isLoading, error, refetch } = useSnippet(snippetId);
  const { publishSnippet } = useMySnippets();

  const currentUserID = getCurrentUserID();

  const [activeTab, setActiveTab] = useState<"preview" | "reviews">("preview");
  const [purchasing, setPurchasing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadedCode, setDownloadedCode] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  // Whether the current user has already purchased this snippet (persists across refreshes)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Shared fetch logic used by both download paths.
  const fetchCode = useCallback(async (): Promise<{ code: string; language: string; title: string } | null> => {
    try {
      const data = await downloadSnippet(snippetId);
      setDownloadedCode(data.code);
      setAlreadyPurchased(true);
      setActiveTab("preview");
      return data;
    } catch (e) {
      // Swallow 402 "payment required" silently — not purchased yet.
      const msg = e instanceof Error ? e.message : "";
      const isPaymentRequired = msg.includes("purchase this snippet") || msg.includes("402");
      if (!isPaymentRequired) {
        setPurchaseError(msg || "Download failed");
      }
      return null;
    }
  }, [snippetId]);

  // Called by the Download/Re-download button — fetches code AND saves a file to disk.
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const data = await fetchCode();
      if (data) {
        const LANG_EXT: Record<string, string> = {
          // Web
          javascript: "js",
          typescript: "ts",
          jsx: "jsx",
          tsx: "tsx",
          html: "html",
          css: "css",
          scss: "scss",
          sass: "sass",
          less: "less",
          // Backend / systems
          python: "py",
          ruby: "rb",
          go: "go",
          rust: "rs",
          java: "java",
          kotlin: "kt",
          swift: "swift",
          "c#": "cs",
          csharp: "cs",
          "c++": "cpp",
          cpp: "cpp",
          c: "c",
          // Shell / config
          bash: "sh",
          shell: "sh",
          sh: "sh",
          zsh: "sh",
          powershell: "ps1",
          yaml: "yaml",
          yml: "yaml",
          toml: "toml",
          json: "json",
          xml: "xml",
          // Data / query
          sql: "sql",
          graphql: "graphql",
          // Docs
          markdown: "md",
          md: "md",
          // Functional
          haskell: "hs",
          scala: "scala",
          elixir: "ex",
          erlang: "erl",
          clojure: "clj",
          // Other
          php: "php",
          perl: "pl",
          lua: "lua",
          r: "r",
          dart: "dart",
          dockerfile: "dockerfile",
        };
        const lang = (data.language || "").toLowerCase().trim();
        const ext = LANG_EXT[lang] ?? (lang || "txt");
        const filename = `${(data.title || "snippet").replace(/\s+/g, "_")}.${ext}`;
        const blob = new Blob([data.code], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  }, [fetchCode]);

  // Silent variant — only fetches into state, no file-save prompt.
  // Used by: auto-check on mount, post-payment verify.
  const handleSilentDownload = useCallback(async () => {
    await fetchCode();
  }, [fetchCode]);

  // On mount (or after snippet loads), silently probe whether the user has already
  // purchased this paid snippet. The backend returns 200+code if purchased, 402 if not.
  // 402 is swallowed silently — no error shown, no file prompt.
  // This makes purchase state persist across page refreshes without a dedicated API call.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (snippet && snippet.pricing?.type === "paid" && !downloadedCode) {
      handleSilentDownload();
    }
  // Fire only once when snippet first loads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippet?.id]);

  const handlePurchase = useCallback(async () => {
    if (!snippet) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const order = await createPurchaseOrder(snippetId);

      // Load Razorpay script lazily
      if (!window.Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => res();
          s.onerror = () => rej(new Error("Failed to load Razorpay"));
          document.head.appendChild(s);
        });
      }

      new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "DevFlow Marketplace",
        description: snippet.title,
        order_id: order.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPurchase(snippetId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            // Payment verified — silently fetch code so the UI switches from
            // "Buy" to the code viewer. User can then click Download to save.
            // Also refetch snippet metadata (stats, etc.) in parallel.
            await Promise.all([handleSilentDownload(), refetch()]);
          } catch (e) {
            setPurchaseError(e instanceof Error ? e.message : "Verification failed");
          }
        },
        prefill: {},
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setPurchasing(false) },
      }).open();
    } catch (e) {
      setPurchaseError(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setPurchasing(false);
    }
  }, [snippet, snippetId, refetch, handleSilentDownload]);

  const handleCopyCode = useCallback(() => {
    if (downloadedCode) navigator.clipboard.writeText(downloadedCode);
  }, [downloadedCode]);

  const handleSubmitReview = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) { setReviewError("Please select a rating"); return; }
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await submitReview(snippetId, { rating: reviewRating, comment: reviewComment });
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment("");
      await refetch();
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }, [snippetId, reviewRating, reviewComment, refetch]);

  const handlePublish = useCallback(async (action: "publish" | "unpublish") => {
    setPublishBusy(true);
    setPublishError(null);
    try {
      await publishSnippet(snippetId, action);
      await refetch();
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setPublishBusy(false);
    }
  }, [snippetId, publishSnippet, refetch]);

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-64 bg-[#111118] border border-white/[0.07] rounded-xl animate-pulse" />
        <div className="h-96 bg-[#111118] border border-white/[0.07] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 pt-24 text-center">
        <p className="text-white/50 text-sm">{error ?? "Snippet not found"}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-white/[0.06] text-white/70 text-xs rounded-lg border border-white/10">
          ← Go back
        </button>
      </div>
    );
  }

  const isPaid = snippet.pricing?.type === "paid";
  const hasCode = !!downloadedCode;
  const isCreator = !!currentUserID && currentUserID === snippet.creatorId;
  // canDownload: free snippets, creator, already-downloaded this session, or previously purchased (auto-detected on mount)
  const canDownload = !isPaid || hasCode || alreadyPurchased || isCreator;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        <Link href="/dashboard/marketplace" className="hover:text-white/70 transition-colors">Marketplace</Link>
        <span>/</span>
        <span className="text-white/60 truncate max-w-xs">{snippet.title}</span>
      </div>

      {/* Creator action bar */}
      {isCreator && (
        <div className="flex items-center gap-3 flex-wrap bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400 flex-shrink-0">
              <circle cx="8" cy="8" r="5.5"/>
              <path d="M8 5v3l2 2" strokeLinecap="round"/>
            </svg>
            <span className="text-xs text-indigo-300 font-medium">You own this snippet</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              snippet.status === "published"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-amber-500/20 text-amber-400"
            }`}>
              {snippet.status}
            </span>
          </div>
          {publishError && (
            <span className="text-xs text-red-400">{publishError}</span>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/dashboard/marketplace/${snippetId}/edit`}
              className="px-3 py-1.5 text-xs font-medium text-white/60 bg-white/[0.06] border border-white/10 rounded-lg hover:bg-white/10 hover:text-white/80 transition-all"
            >
              Edit
            </Link>
            <button
              onClick={() => handlePublish(snippet.status === "published" ? "unpublish" : "publish")}
              disabled={publishBusy}
              className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all disabled:opacity-50 ${
                snippet.status === "published"
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20"
                  : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {publishBusy ? "…" : snippet.status === "published" ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                isPaid ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"
              }`}>
                {isPaid ? `₹${snippet.pricing.price}` : "FREE"}
              </span>
              {snippet.language && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-400/10 text-blue-400">
                  {snippet.language}
                </span>
              )}
              {snippet.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-white/40 border border-white/[0.06]">
                  {snippet.category}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{snippet.title}</h1>
            <p className="text-sm text-white/50 leading-relaxed">{snippet.description}</p>
            <p className="text-xs text-white/30">by <span className="text-indigo-400">@{snippet.creatorUsername}</span></p>
          </div>

          {/* Action panel */}
          <div className="flex flex-col items-end gap-2 min-w-[160px]">
            {purchaseError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 text-right">
                {purchaseError}
              </p>
            )}

            {canDownload ? (
              /* Free snippet, creator, or already purchased */
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-400 disabled:opacity-50 transition-colors shadow shadow-indigo-500/20"
              >
                {downloading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M8 2v9M4 7l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 13h12" strokeLinecap="round" />
                  </svg>
                )}
                {downloading ? "Loading…" : hasCode ? "Re-download" : isPaid ? "Download" : "Download Free"}
              </button>
            ) : (
              /* Paid snippet — not yet purchased */
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow shadow-emerald-500/20 cursor-pointer"
              >
                {purchasing ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="5" width="12" height="9" rx="1.5" />
                    <path d="M5 5V4a3 3 0 016 0v1" strokeLinecap="round" />
                  </svg>
                )}
                {purchasing ? "Processing…" : `Buy ₹${snippet.pricing.price}`}
              </button>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 text-[10px] text-white/30 mt-1">
              <span>{snippet.stats?.downloads ?? 0} downloads</span>
              <span>{snippet.stats?.views ?? 0} views</span>
              {isPaid && <span>{snippet.stats?.purchases ?? 0} purchases</span>}
            </div>
          </div>
        </div>

        {/* Rating summary */}
        {snippet.stats?.ratingCount > 0 && (
          <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
            <Stars rating={snippet.stats.rating} />
            <span className="text-sm font-semibold text-white">{snippet.stats.rating.toFixed(1)}</span>
            <span className="text-xs text-white/30">{snippet.stats.ratingCount} review{snippet.stats.ratingCount !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Tags */}
        {snippet.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
            {snippet.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.06]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#111118] cursor-pointer border border-white/[0.07] rounded-xl p-1 w-fit">
        {[
          { id: "preview" as const, label: "Code Preview" },
          { id: "reviews" as const, label: `Reviews (${reviews.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code tab */}
      {activeTab === "preview" && (
        <div className="bg-[#0a0a12] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
              <span className="text-[10px] text-white/30 font-mono">
                {snippet.language || "code"} {snippet.version ? `v${snippet.version}` : ""}
              </span>
            </div>
            {hasCode && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" />
                  <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" strokeLinecap="round" />
                </svg>
                Copy
              </button>
            )}
          </div>
          <div className="relative">
            <pre className="p-4 text-xs leading-relaxed font-mono text-white/70 overflow-x-auto max-h-[480px] overflow-y-auto">
              {hasCode
                ? downloadedCode
                : (snippet.preview || snippet.code?.slice(0, 600) || "// Preview not available")
              }
            </pre>
            {/* Blur overlay for paid/locked snippets */}
            {isPaid && !hasCode && (
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/80 to-transparent">
                <div className="flex flex-col items-center gap-3 text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
                      <rect x="2" y="7" width="12" height="8" rx="1.5" />
                      <path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-xs text-white/50">Purchase to unlock full code</p>
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Buy ₹{snippet.pricing.price}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews tab */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {/* Submit review */}
          {!reviewSuccess ? (
            <div className="bg-[#111118] border border-white/[0.07] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Leave a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Your Rating</label>
                  <StarInput value={reviewRating} onChange={setReviewRating} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Comment (optional)</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this snippet…"
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>
                {reviewError && (
                  <p className="text-xs text-red-400">{reviewError}</p>
                )}
                <button
                  type="submit"
                  disabled={submittingReview || reviewRating === 0}
                  className="px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-400 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  {submittingReview ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400 text-center">
              ✓ Review submitted! Thank you.
            </div>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              No reviews yet — be the first to review this snippet.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
