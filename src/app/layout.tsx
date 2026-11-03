import Script from "next/script";
import type { Metadata } from "next";
import { AuthGate } from "@/components/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBIT AI | Your AI workspace",
  description: "An AI workspace that plans, executes, verifies, and records every workflow.",
  openGraph: {
    type: "website",
    siteName: "ORBIT AI",
    title: "ORBIT AI | Your AI workspace",
    description: "Plan, execute with approval, and verify every workflow."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthGate>{children}</AuthGate>
        <Script src="/productos-badge.js" strategy="afterInteractive" />
        <Script src="/productos-canvas-height.js" strategy="afterInteractive" />
        <Script src="/productos-error-overlay.js" strategy="afterInteractive" />
        <Script src="/productos-screenshot.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
