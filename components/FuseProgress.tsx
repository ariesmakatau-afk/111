"use client";

import { useEffect, useRef } from "react";

/**
 * The scroll progress bar, drawn as a fuse: fire burns from the left and
 * the ember head glows at the live edge. Fixed at the very top of the page,
 * above the header. Pure rAF width updates — no React state per frame.
 */
export default function FuseProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const set = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 10 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const el = bar.current;
      if (el) {
        el.style.width = `${(p * 100).toFixed(2)}%`;
        el.dataset.live = p > 0.004 ? "1" : "0";
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(set);
    };
    set();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fuse-progress" aria-hidden="true">
      <div ref={bar} className="fuse-progress__bar" />
    </div>
  );
}
