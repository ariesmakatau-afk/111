"use client";

import { useEffect, useState } from "react";
import { igniteAt, prefersReducedMotion } from "@/lib/embers";

/** A coal you can press to ride the smoke back up. Appears past the hero. */
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.15);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to the top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={`back-to-top ${show ? "is-in" : ""}`}
      onClick={(e) => {
        igniteAt(e.currentTarget, 26);
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}
