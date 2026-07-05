
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevFlow — AI-Powered Git Hosting & Code Collaboration",
  description:
    "DevFlow is the next-generation Git hosting platform with AI code review, real-time collaboration, gamification, and a snippet marketplace. Ship better code, faster.",
  keywords: [
    "git hosting",
    "code review",
    "AI code review",
    "developer platform",
    "collaboration",
    "open source",
    "DevFlow",
  ],
  authors: [{ name: "DevFlow Team" }],
  openGraph: {
    title: "DevFlow — AI-Powered Git Hosting",
    description:
      "Ship better code faster with AI-powered reviews, real-time collaboration, and developer gamification.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevFlow — AI-Powered Git Hosting",
    description: "Ship better code faster with AI-powered reviews.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0d0d0f] text-[#f0f0f5]">
        {children}
      </body>
    </html>
  );
}
