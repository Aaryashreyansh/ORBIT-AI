import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  openGraph: {
    type: "website",
    siteName: "ProductOS",
    title: "Built with ProductOS",
    description: "AI-native product development platform",
    images: [{ url: "https://productos.dev/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Built with ProductOS",
    images: ["https://productos.dev/og-image.png"],
  },
  title: "ORBIT AI | Your AI workspace",
  description: "An AI workspace that plans, executes, verifies, and records every workflow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}
        <Script src="/productos-badge.js" strategy="afterInteractive" />
        <Script src="/productos-canvas-height.js" strategy="afterInteractive" />
        <Script src="/productos-error-overlay.js" strategy="afterInteractive" />
        <Script src="/productos-screenshot.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
