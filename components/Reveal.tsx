"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Rises anything marked `data-reveal` into place the first time it scrolls
 * into view. Stagger with `style={{ "--d": "120ms" }}`. Content is only
 * hidden once the `.js` class is on <html>, so nothing is lost without JS.
 *
 * Checked on scroll rather than with IntersectionObserver alone, so that
 * anything jumped past (anchor links, restored scroll) is revealed too —
 * and a MutationObserver picks up elements that mount after page load
 * (the live widgets fill in asynchronously), so nothing can stay hidden.
 */
export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    let pending: HTMLElement[] = [];
    let raf = 0;
    let watching = false;

    const check = () => {
      raf = 0;
      const limit = window.innerHeight * 0.94;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < limit) {
          el.classList.add("is-in");
          return false;
        }
        return true;
      });
      if (pending.length === 0 && watching) {
        watching = false;
        window.removeEventListener("scroll", onScroll);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    const ensureWatching = () => {
      if (!watching) {
        watching = true;
        window.addEventListener("scroll", onScroll, { passive: true });
      }
      if (!raf) raf = requestAnimationFrame(check);
    };
    const refresh = () => {
      const fresh = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
      if (fresh.length) {
        pending = fresh;
        ensureWatching();
      }
    };

    refresh();
    window.addEventListener("resize", ensureWatching);

    let moQueued = false;
    const mo = new MutationObserver(() => {
      if (moQueued) return;
      moQueued = true;
      requestAnimationFrame(() => {
        moQueued = false;
        refresh();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", ensureWatching);
      window.removeEventListener("scroll", onScroll);
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
