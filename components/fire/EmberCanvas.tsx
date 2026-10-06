"use client";

import { useEffect, useRef } from "react";
import { EmberEngine, prefersReducedMotion, type EmberOptions } from "@/lib/embers";

type Props = Partial<EmberOptions> & {
  className?: string;
  /** Moving the pointer over the parent section shakes sparks loose. */
  stokeOnPointer?: boolean;
  /** Scrolling feeds the fire. */
  stokeOnScroll?: boolean;
};

/**
 * A spark field that fills its positioned parent. Runs only while on
 * screen and in a visible tab; renders nothing for reduced-motion users.
 */
export default function EmberCanvas({
  className = "",
  stokeOnPointer = false,
  stokeOnScroll = false,
  ...opts
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const optsKey = JSON.stringify(opts);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host || prefersReducedMotion()) return;

    const engine = new EmberEngine(canvas, JSON.parse(optsKey));
    let raf = 0;
    let last = performance.now();
    let onScreen = false;

    const size = () => {
      const r = host.getBoundingClientRect();
      engine.resize(r.width, r.height);
    };
    size();

    const frame = (now: number) => {
      engine.step((now - last) / 1000);
      last = now;
      engine.draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !onScreen || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(size);
    ro.observe(host);

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(host);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    let lastPt: { x: number; y: number } | null = null;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (lastPt) {
        const d = Math.hypot(p.x - lastPt.x, p.y - lastPt.y);
        if (d > 16) {
          engine.trail(p.x, p.y, Math.min(3, Math.floor(d / 16)), opts.tone === "light");
          lastPt = p;
        }
      } else lastPt = p;
    };
    const onLeave = () => (lastPt = null);
    if (stokeOnPointer && fine) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    let lastY = window.scrollY;
    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      if (onScreen) engine.addStoke(Math.min(0.6, dy / 300));
    };
    if (stokeOnScroll) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optsKey, stokeOnPointer, stokeOnScroll]);

  return <canvas ref={ref} aria-hidden="true" className={`ember-canvas ${className}`} />;
}
