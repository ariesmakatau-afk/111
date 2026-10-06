"use client";

import { useEffect, useRef, useState } from "react";
import { reviews } from "@/lib/site";
import { IconStar } from "../Icons";

/**
 * The review reel: a scroll-snap carousel that drifts on its own, pauses
 * when a hand is on it, and degrades to a plain swipeable strip without JS.
 */
export default function ReviewDeck() {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touched, setTouched] = useState(false);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = reviews.length;
    const target = ((i % n) + n) % n;
    const slide = el.children[target] as HTMLElement | undefined;
    if (!slide) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2, behavior: reduce ? "auto" : "smooth" });
    setIdx(target);
  };

  // Keep the dot indicator in sync when people swipe by hand.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let t = 0;
    const onScroll = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestD = Infinity;
        Array.from(el.children).forEach((c, i) => {
          const s = c as HTMLElement;
          const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        setIdx(best);
      }, 90);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
  }, []);

  // Drift on its own until the audience starts paying attention.
  useEffect(() => {
    if (paused || touched) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => goTo(idx + 1), 6500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused, touched]);

  return (
    <div
      className="review-deck"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setTouched(true)}
    >
      <div ref={track} className="review-deck__track">
        {reviews.map((r) => (
          <figure key={r.author} className="review-deck__slide">
            <span className="flex gap-1 text-amber drop-shadow-[0_0_8px_rgba(255,160,60,.6)]" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, k) => (
                <IconStar key={k} className="h-4 w-4" />
              ))}
            </span>
            <blockquote className="mt-6 font-serif text-[clamp(1.35rem,2.4vw,1.9rem)] leading-[1.35] text-white">
              &ldquo;{r.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-amber/50 bg-white/[0.06] font-serif text-lg text-amber" aria-hidden="true">
                {r.author.slice(0, 1)}
              </span>
              <span>
                <b className="block text-[0.95rem] text-white">{r.author}</b>
                <span className="text-[0.8rem] text-white/55">
                  {r.source} · {r.date}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="review-deck__controls">
        <div className="flex items-center gap-2.5" aria-hidden="true">
          {reviews.map((r, i) => (
            <button
              key={r.author}
              type="button"
              aria-label={`Show review ${i + 1} of ${reviews.length}`}
              className={`review-deck__dot ${i === idx ? "is-now" : ""}`}
              onClick={() => { setTouched(true); goTo(i); }}
            />
          ))}
        </div>
        <div className="review-deck__arrows">
          <button type="button" aria-label="Previous review" onClick={() => { setTouched(true); goTo(idx - 1); }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button type="button" aria-label="Next review" onClick={() => { setTouched(true); goTo(idx + 1); }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
