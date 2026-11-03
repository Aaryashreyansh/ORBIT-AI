import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBIT AI | Your AI workspace",
  description: "An AI workspace that plans, executes, verifies, and records every workflow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
