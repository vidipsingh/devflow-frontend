
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("devflow_token");
    } catch {
      // ignore
    }
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  // Renders nothing
  return null;
}
