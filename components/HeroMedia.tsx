"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { heroVideo } from "@/lib/site";

/**
 * The landing-page background: the spits turning over the coals. The poster
 * is one <picture> (phones download only the tall frame, larger screens only
 * the wide one). Once the page is up, the matching clip is chosen for the
 * screen and eases in over the poster — which is its own first frame, so the
 * handoff reads as the photo coming alive. Reduced-motion and data-saver
 * visitors keep the still.
 */
export default function HeroMedia() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const common = { alt: "", fill: true, priority: true, sizes: "100vw" } as const;
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({ ...common, src: heroVideo.poster });
  const { props: posterProps } = getImageProps({ ...common, src: heroVideo.posterMobile });

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData) return;
    const src = window.matchMedia("(min-width: 640px)").matches ? heroVideo.src : heroVideo.srcMobile;
    if (!src) return;
    v.src = src;
    v.play().catch(() => {});
    // Pause when scrolled away — no point decoding frames nobody sees.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <picture>
        <source media="(min-width: 640px)" srcSet={wideSrcSet} sizes="100vw" />
        <img
          {...posterProps}
          alt=""
          className={`object-cover object-[50%_60%] transition-opacity duration-[1800ms] ease-out sm:object-center ${
            playing ? "opacity-0" : "opacity-100"
          }`}
        />
      </picture>
      <video
        ref={video}
        className={`hero-video absolute inset-0 h-full w-full object-cover object-[50%_60%] sm:object-center ${playing ? "is-playing" : ""}`}
        muted
        loop
        playsInline
        preload="none"
        onPlaying={() => setPlaying(true)}
      />
    </div>
  );
}
