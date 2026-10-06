"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { heroVideo } from "@/lib/site";

/**
 * The landing-page background: the looping spit video when one is set in
 * lib/site.ts, otherwise the poster photo drifting slowly. Reduced-motion
 * visitors get the still frame. The video only takes over once it can play
 * smoothly — then it eases in over ~1.5s from a slightly closer scale, so
 * the handoff reads as the photo coming alive, not a cut to a video.
 *
 * The poster is one <picture>: phones download only the portrait photo,
 * larger screens only the wide one (two separate priority images made every
 * phone fetch both).
 */
export default function HeroMedia() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const hasVideo = Boolean(heroVideo.src || heroVideo.webm);

  const common = { alt: "", fill: true, priority: true, sizes: "100vw" } as const;
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({ ...common, src: heroVideo.poster });
  const { props: posterProps } = getImageProps({ ...common, src: heroVideo.posterMobile });

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
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
          className={`object-cover object-[50%_60%] transition-opacity duration-[1800ms] ease-out sm:object-[65%_50%] ${
            hasVideo ? "" : "hero-drift"
          } ${playing ? "opacity-0" : "opacity-100"}`}
        />
      </picture>
      {hasVideo && (
        <video
          ref={video}
          className={`hero-video absolute inset-0 h-full w-full object-cover ${playing ? "is-playing" : ""}`}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          poster={heroVideo.poster}
          onPlaying={() => setPlaying(true)}
        >
          {heroVideo.webm && <source src={heroVideo.webm} type="video/webm" />}
          {heroVideo.src && <source src={heroVideo.src} type="video/mp4" />}
        </video>
      )}
    </div>
  );
}
