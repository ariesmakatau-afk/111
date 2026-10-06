// lib/embers.ts
//
// A small, dependency-free particle engine for sparks and embers.
//
// Two kinds of particle share one pool:
//   • sparks — tiny hot points with a motion streak. Born white-gold, they
//     cool through orange to deep red as they rise, riding a turbulent
//     updraft that wobbles them sideways, with the odd sudden "jink".
//   • motes  — large, soft, out-of-focus embers drifting slowly upward,
//     which give the dark sections depth of field.
//
// Rendering is additive ("lighter") on dark grounds, so overlapping sparks
// bloom like real light. On white grounds additive light is invisible, so
// particles flagged `onLight` are drawn normally in deeper ember colours.

export type FieldTone = "dark" | "light";

export type EmberOptions = {
  tone: FieldTone;
  /** Ambient sparks per second, per 1000 CSS px of canvas width. */
  rate: number;
  /** Fraction of the canvas height (from the bottom) where sparks are born. */
  band: number;
  /** Upward acceleration, px/s². */
  rise: number;
  /** Sideways turbulence strength. */
  turbulence: number;
  /** Ambient out-of-focus motes kept alive at once (dark tone only). */
  motes: number;
  maxParticles: number;
  /** Size multiplier. */
  scale: number;
};

export const defaultEmberOptions: EmberOptions = {
  tone: "dark",
  rate: 26,
  band: 0.08,
  rise: 70,
  turbulence: 1,
  motes: 12,
  maxParticles: 420,
  scale: 1,
};

type Particle = {
  kind: 0 | 1; // 0 spark, 1 mote
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  ttl: number;
  size: number;
  heat: number; // 1 = white-hot, 0 = dead
  cool: number; // heat lost per second
  seed: number;
  onLight: boolean;
};

// Blackbody-ish ramp, cool → hot.
const RAMP: [number, number, number][] = [
  [70, 10, 2],
  [150, 28, 4],
  [214, 58, 10],
  [255, 104, 24],
  [255, 150, 48],
  [255, 196, 96],
  [255, 228, 160],
  [255, 247, 222],
];
// On white, a white-hot spark would vanish — use a deeper, saturated ramp.
const RAMP_LIGHT: [number, number, number][] = [
  [120, 30, 8],
  [168, 40, 8],
  [206, 56, 10],
  [232, 78, 14],
  [246, 100, 20],
  [252, 122, 28],
  [255, 142, 40],
  [255, 160, 60],
];

function rampColor(heat: number, light: boolean): [number, number, number] {
  const r = light ? RAMP_LIGHT : RAMP;
  const t = Math.min(0.9999, Math.max(0, heat)) * (r.length - 1);
  const i = Math.floor(t);
  const f = t - i;
  const a = r[i];
  const b = r[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

const GLOW_BUCKETS = 8;

function makeGlowSprites(light: boolean): HTMLCanvasElement[] {
  const sprites: HTMLCanvasElement[] = [];
  for (let i = 0; i < GLOW_BUCKETS; i++) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const [r, gg, b] = rampColor((i + 0.5) / GLOW_BUCKETS, light);
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${r | 0},${gg | 0},${b | 0},0.9)`);
    grad.addColorStop(0.18, `rgba(${r | 0},${gg | 0},${b | 0},0.45)`);
    grad.addColorStop(0.5, `rgba(${r | 0},${gg | 0},${b | 0},0.12)`);
    grad.addColorStop(1, `rgba(${r | 0},${gg | 0},${b | 0},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    sprites.push(c);
  }
  return sprites;
}

export class EmberEngine {
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private opts: EmberOptions;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private t = 0;
  private spawnDebt = 0;
  private hotspots: { x: number; drift: number; phase: number }[] = [];
  private glowDark: HTMLCanvasElement[];
  private glowLight: HTMLCanvasElement[];
  /** Extra intensity (e.g. while scrolling or hovering), decays to 0. */
  private stoke = 0;
  /** When false, ambient spawning stops but live particles finish. */
  ambient = true;

  constructor(private canvas: HTMLCanvasElement, opts: Partial<EmberOptions> = {}) {
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.opts = { ...defaultEmberOptions, ...opts };
    this.glowDark = makeGlowSprites(false);
    this.glowLight = makeGlowSprites(true);
    for (let i = 0; i < 6; i++) {
      this.hotspots.push({ x: Math.random(), drift: (Math.random() - 0.5) * 0.02, phase: Math.random() * 10 });
    }
  }

  get count() {
    return this.particles.length;
  }

  resize(width: number, height: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.5 : 2);
    this.w = width;
    this.h = height;
    this.canvas.width = Math.max(1, Math.round(width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(height * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  addStoke(amount: number) {
    this.stoke = Math.min(3, this.stoke + amount);
  }

  private spawnSpark(x: number, y: number, vx: number, vy: number, heat: number, onLight: boolean, size?: number) {
    if (this.particles.length >= this.opts.maxParticles) return;
    const s = this.opts.scale;
    this.particles.push({
      kind: 0,
      x,
      y,
      vx,
      vy,
      age: 0,
      ttl: 1.6 + Math.random() * 2.6,
      size: (size ?? 0.7 + Math.random() * 1.5) * s,
      heat,
      cool: 0.16 + Math.random() * 0.22,
      seed: Math.random() * 1000,
      onLight,
    });
  }

  private spawnMote() {
    const s = this.opts.scale;
    this.particles.push({
      kind: 1,
      x: Math.random() * this.w,
      y: this.h * (0.55 + Math.random() * 0.5),
      vx: (Math.random() - 0.5) * 8,
      vy: -(8 + Math.random() * 18),
      age: 0,
      ttl: 7 + Math.random() * 7,
      size: (5 + Math.random() * 11) * s,
      heat: 0.35 + Math.random() * 0.45,
      cool: 0.02,
      seed: Math.random() * 1000,
      onLight: false,
    });
  }

  /** A fountain of sparks from a point, in canvas-local CSS px. */
  burst(x: number, y: number, count = 28, power = 1, onLight = false) {
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.25;
      const sp = (120 + Math.random() * 260) * power;
      this.spawnSpark(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 6,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        0.85 + Math.random() * 0.15,
        onLight,
        0.9 + Math.random() * 1.8
      );
    }
  }

  /** A few sparks shaken loose at a point (pointer stoking). */
  trail(x: number, y: number, n = 1, onLight = false) {
    for (let i = 0; i < n; i++) {
      this.spawnSpark(
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 60,
        -(40 + Math.random() * 90),
        0.8 + Math.random() * 0.2,
        onLight
      );
    }
  }

  step(dtRaw: number) {
    const dt = Math.min(0.05, Math.max(0.001, dtRaw));
    this.t += dt;
    const { rate, band, rise, turbulence, motes, tone } = this.opts;

    // Ambient spawning — clustered around slowly wandering hot spots, like
    // real coals that flare in patches rather than uniformly.
    if (this.ambient && rate > 0 && this.w > 0) {
      for (const hsp of this.hotspots) {
        hsp.x += hsp.drift * dt;
        if (hsp.x < 0 || hsp.x > 1) hsp.drift *= -1;
      }
      const intensity = 1 + this.stoke;
      this.spawnDebt += (rate * this.w) / 1000 * dt * intensity;
      while (this.spawnDebt >= 1) {
        this.spawnDebt -= 1;
        let fx: number;
        if (Math.random() < 0.7) {
          const hs = this.hotspots[(Math.random() * this.hotspots.length) | 0];
          const flare = 0.5 + 0.5 * Math.sin(this.t * 1.7 + hs.phase);
          fx = hs.x + (Math.random() + Math.random() + Math.random() - 1.5) * (0.06 + 0.08 * flare);
        } else {
          fx = Math.random();
        }
        const x = Math.min(this.w, Math.max(0, fx * this.w));
        const y = this.h - Math.random() * band * this.h;
        this.spawnSpark(
          x,
          y,
          (Math.random() - 0.5) * 40,
          -(60 + Math.random() * 120) * (0.9 + this.stoke * 0.25),
          0.72 + Math.random() * 0.28,
          tone === "light"
        );
      }
      if (tone === "dark") {
        let alive = 0;
        for (const p of this.particles) if (p.kind === 1) alive++;
        if (alive < motes && Math.random() < dt * 2) this.spawnMote();
      }
    }
    this.stoke = Math.max(0, this.stoke - dt * 1.4);

    const t = this.t;
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.age += dt;
      if (p.kind === 0) {
        // Turbulent updraft: layered sines give a cheap curl-like wobble.
        const fx =
          Math.sin(p.y * 0.011 + t * 1.3 + p.seed) +
          0.6 * Math.sin(p.y * 0.029 - t * 2.3 + p.seed * 1.7) +
          0.35 * Math.sin(p.x * 0.02 + t * 0.9);
        p.vx += fx * 70 * turbulence * dt;
        p.vy -= rise * dt;
        if (Math.random() < dt * 0.6) p.vx += (Math.random() - 0.5) * 160; // jink
        p.vx *= 1 - 1.1 * dt;
        p.vy *= 1 - 0.45 * dt;
      } else {
        p.vx += Math.sin(t * 0.6 + p.seed) * 6 * dt;
        p.vy -= 3 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.heat -= p.cool * dt;
      if (p.age > p.ttl || p.heat <= 0.02 || p.y < -40 || p.x < -60 || p.x > this.w + 60) {
        ps[i] = ps[ps.length - 1];
        ps.pop();
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const t = this.t;

    // Pass 1: particles over light grounds (normal blending).
    // Pass 2: particles over dark grounds (additive light).
    for (let pass = 0; pass < 2; pass++) {
      const lightPass = pass === 0;
      ctx.globalCompositeOperation = lightPass ? "source-over" : "lighter";
      const sprites = lightPass ? this.glowLight : this.glowDark;
      for (const p of this.particles) {
        if (p.onLight !== lightPass) continue;
        const life = 1 - p.age / p.ttl;
        const fadeIn = Math.min(1, p.age * 6);
        const flicker = 0.72 + 0.28 * Math.sin(t * 22 + p.seed * 13) * Math.sin(t * 7.3 + p.seed);
        const heat = Math.max(0, p.heat);

        if (p.kind === 1) {
          const a = Math.min(1, life * 2) * fadeIn * 0.16 * (0.7 + 0.3 * Math.sin(t * 1.4 + p.seed));
          const r = p.size * 2.2;
          ctx.globalAlpha = a;
          ctx.drawImage(sprites[Math.min(GLOW_BUCKETS - 1, (heat * GLOW_BUCKETS) | 0)], p.x - r, p.y - r, r * 2, r * 2);
          continue;
        }

        const alpha = Math.min(1, life * 1.6) * fadeIn * flicker;
        if (alpha <= 0.01) continue;
        const [r, g, b] = rampColor(heat, lightPass);

        // Soft halo.
        const halo = p.size * (lightPass ? 3.4 : 5.5) * (0.6 + heat * 0.6);
        ctx.globalAlpha = alpha * (lightPass ? 0.28 : 0.55);
        ctx.drawImage(sprites[Math.min(GLOW_BUCKETS - 1, (heat * GLOW_BUCKETS) | 0)], p.x - halo, p.y - halo, halo * 2, halo * 2);

        // Motion streak — length follows speed, so fast sparks read as lines.
        const k = 0.028;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        ctx.lineWidth = p.size * (0.55 + heat * 0.6);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * k, p.y - p.vy * k);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}

// ---------------------------------------------------------------------------
// Page-wide bursts — any component can throw sparks from a point on screen.
// ---------------------------------------------------------------------------

export const BURST_EVENT = "yiannis:embers";

export type BurstDetail = { x: number; y: number; count?: number; power?: number; onLight?: boolean };

/** Throw a fountain of sparks from an element (or a viewport point). */
export function igniteAt(target: Element | { x: number; y: number }, count = 34, power = 1) {
  if (typeof window === "undefined") return;
  let x: number;
  let y: number;
  let onLight = true;
  if (target instanceof Element) {
    const r = target.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height * 0.35;
    onLight = !target.closest("[data-tone='dark']");
  } else {
    x = target.x;
    y = target.y;
    const el = document.elementFromPoint(x, y);
    onLight = !(el && el.closest("[data-tone='dark']"));
  }
  window.dispatchEvent(new CustomEvent<BurstDetail>(BURST_EVENT, { detail: { x, y, count, power, onLight } }));
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
