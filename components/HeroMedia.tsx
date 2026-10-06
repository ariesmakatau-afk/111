"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { heroVideo } from "@/lib/site";

/**
 * The landing-page background: the looping spit video when one is set in
 * lib/site.ts, otherwise the poster photo drifting slowly. Reduced-motion
 * visitors get the still frame. The video only takes over once it can play
 * smoothly — then it eases in over ~1.5s from a slightly closer scale, so
 * the handoff reads as the photo coming alive, not a cut to a video.
 */
export default function HeroMedia() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const hasVideo = Boolean(heroVideo.src || heroVideo.webm);

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
      <Image
        src={heroVideo.poster}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`hidden object-cover object-[65%_50%] transition-opacity duration-[1800ms] ease-out sm:block ${hasVideo ? "" : "hero-drift"} ${playing ? "opacity-0" : "opacity-100"}`}
      />
      <Image
        src={heroVideo.posterMobile}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover object-[50%_60%] transition-opacity duration-[1800ms] ease-out sm:hidden ${playing ? "opacity-0" : "opacity-100"}`}
      />
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
