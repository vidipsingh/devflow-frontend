
"use client";

import { use } from "react";
import { DiscussionSocketProvider } from "@/hooks/useDiscussionSocket";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Team slug layout — wraps all sub-pages (discussions, members, repos, etc.)
 * with a single DiscussionSocketProvider so the WebSocket connection is shared
 * and survives navigation between the list and thread pages.
 */
export default function TeamSlugLayout({ children, params }: LayoutProps) {
  const { slug } = use(params);
  return (
    <DiscussionSocketProvider slug={slug}>
      {children}
    </DiscussionSocketProvider>
  );
}
