"use client";

import { useEffect, useRef } from "react";
import { BURST_EVENT, EmberEngine, prefersReducedMotion, type BurstDetail } from "@/lib/embers";

/**
 * One fixed, full-viewport canvas above everything (pointer-events: none).
 * It sleeps until something calls `igniteAt()`, runs the burst, then goes
 * back to sleep — no idle animation loop.
 */
export default function SparkLayer() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion()) return;
    const engine = new EmberEngine(canvas, { tone: "light", rate: 0, motes: 0, rise: 150, maxParticles: 260 });
    engine.ambient = false;

    const size = () => engine.resize(window.innerWidth, window.innerHeight);
    size();
    window.addEventListener("resize", size);

    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      engine.step((now - last) / 1000);
      last = now;
      engine.draw();
      if (engine.count > 0) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        engine.draw();
      }
    };

    const onBurst = (e: Event) => {
      const d = (e as CustomEvent<BurstDetail>).detail;
      engine.burst(d.x, d.y, d.count ?? 30, d.power ?? 1, d.onLight ?? true);
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    window.addEventListener(BURST_EVENT, onBurst);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener(BURST_EVENT, onBurst);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="spark-layer" />;
}
