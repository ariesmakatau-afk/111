import type { MetadataRoute } from "next";

/**
 * The PWA manifest. Its main job is unlock­ing phone alerts for iPhone:
 * iOS only allows Web Push from an installed web app, and "Add to Home
 * Screen" offers itself once a manifest exists. Android and desktop get
 * push with no install at all; everyone else just gets a nicer bookmark.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yianni's Hellenic Yiros",
    short_name: "Yianni's",
    description: "Charcoal yiros on Hindley Street — order ahead, pay at the counter.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#07183a",
    theme_color: "#0b3278",
    icons: [
      { src: "/images/medallion-192.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
