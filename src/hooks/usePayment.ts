
"use client";

import { useState, useCallback } from "react";
import { apiFetch, getToken } from "@/lib/apiFetch";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PaymentRecord {
  id: string;
  planKey: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  currency: string;
  status: "created" | "paid" | "failed";
  createdAt: string;
  paidAt?: string;
}

export type PlanKey = "pro" | "team";

// Razorpay type shim
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void };
  }
}

// ── Script loader ─────────────────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UsePaymentReturn {
  paying: PlanKey | null;
  error: string | null;
  success: string | null;
  history: PaymentRecord[];
  historyLoading: boolean;
  startCheckout: (planKey: PlanKey, userEmail: string, userName: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  clearMessages: () => void;
}

export function usePayment(): UsePaymentReturn {
  const [paying, setPaying] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // ── Step 1+2+3: create order → open checkout → verify ──────────────────────
  const startCheckout = useCallback(
    async (planKey: PlanKey, userEmail: string, userName: string) => {
      setError(null);
      setSuccess(null);
      setPaying(planKey);

      try {
        // Load Razorpay SDK
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setError("Failed to load payment gateway. Check your internet connection.");
          return;
        }

        if (!getToken()) {
          setError("Not authenticated.");
          return;
        }

        // Step 1 — Create order on backend (apiFetch handles 401 → redirect)
        const orderJson = await apiFetch<{ data: { orderId: string; amount: number; currency: string; keyId: string } }>(
          "/api/v1/payments/orders",
          { method: "POST", body: JSON.stringify({ planKey }) }
        );
        const order = orderJson.data;
        // order = { orderId, amount, currency, keyId }

        // Step 2 — Open Razorpay checkout
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,         // paise, e.g. 99900
            currency: order.currency,     // "INR"
            order_id: order.orderId,
            name: "DevFlow",
            description: planKey === "pro" ? "Pro Plan — ₹999/month" : "Team Plan — ₹2999/month",
            image: "/logo.png",           // optional, shows in checkout modal
            prefill: {
              name: userName,
              email: userEmail,
            },
            theme: {
              color: "#6366f1",           // indigo — matches the UI
            },
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              // Step 3 — Verify on backend
              try {
                const verifyData = await apiFetch<{ message?: string }>(
                  "/api/v1/payments/verify",
                  {
                    method: "POST",
                    body: JSON.stringify({
                      razorpayOrderId:   response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature,
                    }),
                  }
                );
                setSuccess(
                  verifyData.message ??
                    `You are now on the ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} plan!`
                );
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              // Called when user closes the modal without paying
              ondismiss: () => reject(new Error("DISMISSED")),
            },
          });

          rzp.open();
        });
      } catch (err) {
        if (err instanceof Error && err.message !== "DISMISSED") {
          setError(err.message);
        }
        // If dismissed, just silently stop paying spinner
      } finally {
        setPaying(null);
      }
    },
    []
  );

  // ── Fetch payment history ─────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!getToken()) return;
    setHistoryLoading(true);
    try {
      const j = await apiFetch<{ data: PaymentRecord[] }>("/api/v1/payments/history");
      setHistory(j.data ?? []);
    } catch {
      // silently ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  return {
    paying,
    error,
    success,
    history,
    historyLoading,
    startCheckout,
    fetchHistory,
    clearMessages,
  };
}
