
"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

function getToken(): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("devflow_token") : null;
  } catch {
    return null;
  }
}

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

        const token = getToken();
        if (!token) {
          setError("Not authenticated.");
          return;
        }

        // Step 1 — Create order on backend
        const orderRes = await fetch(`${API_BASE}/api/v1/payments/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planKey }),
        });

        if (!orderRes.ok) {
          const j = await orderRes.json().catch(() => ({}));
          setError(j.error ?? "Failed to create payment order.");
          return;
        }

        const { data: order } = await orderRes.json();
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
                const verifyRes = await fetch(`${API_BASE}/api/v1/payments/verify`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    razorpayOrderId:   response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  }),
                });

                if (!verifyRes.ok) {
                  const j = await verifyRes.json().catch(() => ({}));
                  reject(new Error(j.error ?? "Payment verification failed."));
                  return;
                }

                const verifyData = await verifyRes.json();
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
    setHistoryLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/v1/payments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const j = await res.json();
        setHistory(j.data ?? []);
      }
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
