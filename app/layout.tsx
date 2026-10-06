import type { Metadata, Viewport } from "next";
// Fonts ship with the bundle (self-hosted via fontsource, latin subsets with
// font-display: swap) — no third-party requests at build time or runtime.
import "@fontsource-variable/manrope";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Yianni's Hellenic Yiros — Charcoal yiros on Hindley Street, Adelaide",
    template: "%s · Yianni's Hellenic Yiros",
  },
  description:
    "Lamb, chicken and pork turning over real charcoal, carved to order into warm pita. 270 Hindley Street, Adelaide — since 2002.",
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_AU",
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: "Charcoal yiros meat in front of the spits at Yianni's, Hindley Street" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#07183a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        {/* Mark JS as available before first paint, so reveal-on-scroll never hides content without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
