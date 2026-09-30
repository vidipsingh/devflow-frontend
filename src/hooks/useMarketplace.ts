
"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface SnippetPricing {
  type: "free" | "paid";
  price: number;
  currency: string;
}

export interface SnippetStats {
  downloads: number;
  views: number;
  rating: number;
  ratingCount: number;
  purchases: number;
}

export interface SnippetEarnings {
  totalRevenue: number;
  creatorEarnings: number;
  platformFee: number;
}

export interface Snippet {
  id: string;
  creatorId: string;
  creatorUsername: string;
  title: string;
  description: string;
  code: string;
  preview: string;
  language: string;
  tags: string[];
  category: string;
  status: "draft" | "published";
  version: string;
  pricing: SnippetPricing;
  stats: SnippetStats;
  earnings: SnippetEarnings;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface SnippetReview {
  id: string;
  snippetId: string;
  authorId: string;
  authorUsername: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SnippetPurchase {
  id: string;
  snippetId: string;
  buyerId: string;
  sellerId: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: "created" | "paid" | "failed";
  createdAt: string;
  paidAt?: string;
}

export interface PurchaseOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

// ─── Browse hook ──────────────────────────────────────────────────────────────

export function useMarketplaceBrowse(sort = "downloads", limit = 20) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: Snippet[] }>(
        `/api/v1/marketplace/snippets?limit=${limit}&sort=${sort}`
      );
      setSnippets(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load snippets");
    } finally {
      setIsLoading(false);
    }
  }, [sort, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { snippets, isLoading, error, refetch: fetch };
}

// ─── Single snippet hook ──────────────────────────────────────────────────────

export function useSnippet(id: string) {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [reviews, setReviews] = useState<SnippetReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [sRes, rRes] = await Promise.all([
        apiFetch<{ success: boolean; data: Snippet }>(`/api/v1/marketplace/snippets/${id}`),
        apiFetch<{ success: boolean; data: SnippetReview[] }>(`/api/v1/marketplace/snippets/${id}/reviews`),
      ]);
      setSnippet(sRes.data);
      setReviews(rRes.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load snippet");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { snippet, reviews, isLoading, error, refetch: fetch };
}

// ─── My snippets hook ─────────────────────────────────────────────────────────

export function useMySnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: Snippet[] }>(
        `/api/v1/marketplace/my-snippets`
      );
      setSnippets(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load snippets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createSnippet = useCallback(async (input: {
    title: string; description: string; code: string; preview?: string;
    language: string; tags: string[]; category: string; version?: string;
    pricingType: "free" | "paid"; price?: number; currency?: string;
  }) => {
    const res = await apiFetch<{ success: boolean; data: Snippet }>(
      `/api/v1/marketplace/snippets`,
      { method: "POST", body: JSON.stringify(input) }
    );
    setSnippets((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const updateSnippet = useCallback(async (id: string, input: Partial<{
    title: string; description: string; code: string; preview: string;
    language: string; tags: string[]; category: string; version: string;
    pricingType: string; price: number;
  }>) => {
    await apiFetch(`/api/v1/marketplace/snippets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...input } : s))
    );
  }, []);

  const publishSnippet = useCallback(async (id: string, action: "publish" | "unpublish") => {
    await apiFetch(`/api/v1/marketplace/snippets/${id}/publish?action=${action}`, {
      method: "PATCH",
    });
    setSnippets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: action === "publish" ? "published" : "draft" } : s
      )
    );
  }, []);

  const deleteSnippet = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/marketplace/snippets/${id}`, { method: "DELETE" });
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    snippets, isLoading, error,
    createSnippet, updateSnippet, publishSnippet, deleteSnippet,
    refetch: fetch,
  };
}

// ─── Purchases hook ───────────────────────────────────────────────────────────

export function useMyPurchases() {
  const [purchases, setPurchases] = useState<SnippetPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; data: SnippetPurchase[] }>(
        `/api/v1/marketplace/purchases`
      );
      setPurchases(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load purchases");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { purchases, isLoading, error, refetch: fetch };
}

// ─── Purchase flow ────────────────────────────────────────────────────────────

export async function createPurchaseOrder(snippetId: string): Promise<PurchaseOrderResponse> {
  const res = await apiFetch<{ success: boolean; data: PurchaseOrderResponse }>(
    `/api/v1/marketplace/snippets/${snippetId}/purchase/order`,
    { method: "POST" }
  );
  return res.data;
}

export async function verifyPurchase(
  snippetId: string,
  payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
): Promise<void> {
  await apiFetch(`/api/v1/marketplace/snippets/${snippetId}/purchase/verify`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function downloadSnippet(snippetId: string): Promise<{
  code: string; language: string; title: string; version: string;
}> {
  const res = await apiFetch<{ success: boolean; data: { code: string; language: string; title: string; version: string } }>(
    `/api/v1/marketplace/snippets/${snippetId}/download`
  );
  return res.data;
}

export async function submitReview(
  snippetId: string,
  input: { rating: number; comment: string }
): Promise<SnippetReview> {
  const res = await apiFetch<{ success: boolean; data: SnippetReview }>(
    `/api/v1/marketplace/snippets/${snippetId}/reviews`,
    { method: "POST", body: JSON.stringify(input) }
  );
  return res.data;
}
