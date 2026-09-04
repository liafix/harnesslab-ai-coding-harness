import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HarnessLab — AI Coding Harness",
    template: "%s · HarnessLab",
  },
  description: "Synthetic AI-first engineering candidate demonstration by Dušan Cabala for the Apertia Tech AI-First Developer role.",
  applicationName: "HarnessLab",
  authors: [{ name: "Dušan Cabala" }],
  category: "technology",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#071019",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
