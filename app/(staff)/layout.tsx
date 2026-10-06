import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  // Adding a staff page to the Home Screen opens the kitchen board, not the
  // public site — that installed copy is what iPhone push needs.
  manifest: "/kitchen.webmanifest",
};

/** Staff screens: no public header/footer, nothing indexed. */
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100svh] bg-porcelain">{children}</div>;
}
