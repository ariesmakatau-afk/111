// lib/alertSounds.ts
//
// Kitchen alarms: the shop's own recordings in /public/sounds, levelled so
// even the quiet ones are loud (quiet files boosted, loud ones untouched).
// Played through Web Audio so the volume slider and a seamless loop work.

export type AlertSoundId =
  | "disturbance"
  | "screaming"
  | "la-la-la"
  | "yo-tu"
  | "alarm"
  | "alarm-clock-bell"
  | "alarm-clock"
  | "cuckoo"
  | "laugh";

export const ALERT_SOUNDS: { id: AlertSoundId; label: string; note: string }[] = [
  { id: "disturbance", label: "Absolute disturbance", note: "Default. Relentless, impossible to tune out." },
  { id: "screaming", label: "Screaming", note: "Loudest file. Nobody sleeps through it." },
  { id: "la-la-la", label: "La la la la", note: "Loud and maddening." },
  { id: "yo-tu", label: "Yo-tu alarm", note: "Sharp alarm pattern." },
  { id: "alarm", label: "Alarm", note: "Classic alarm, boosted." },
  { id: "alarm-clock-bell", label: "Alarm clock bell", note: "Ringing bell, boosted." },
  { id: "alarm-clock", label: "Alarm clock", note: "Bedside beeping, boosted." },
  { id: "cuckoo", label: "Cuckoo clock", note: "Hard to ignore." },
  { id: "laugh", label: "Annoying laugh", note: "Exactly what it says." },
];

export const DEFAULT_SOUND: AlertSoundId = "disturbance";

const fileFor = (id: AlertSoundId) => `/sounds/${id}.mp3`;

const VOL_KEY = "yiannis_alert_vol";

export function getAlertVolume(): number {
  try {
    const v = Number(localStorage.getItem(VOL_KEY));
    if (Number.isFinite(v) && v > 0) return Math.min(1, Math.max(0.05, v));
  } catch {}
  return 1;
}

export function setAlertVolume(v: number): void {
  try {
    localStorage.setItem(VOL_KEY, String(Math.min(1, Math.max(0.05, v))));
  } catch {}
}

let shared: AudioContext | null = null;

function ctx(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!shared || shared.state === "closed") shared = new Ctor();
    if (shared.state === "suspended") void shared.resume();
    return shared;
  } catch {
    return null;
  }
}

// Decoded files, fetched once each.
const buffers = new Map<AlertSoundId, Promise<AudioBuffer | null>>();

function load(id: AlertSoundId): Promise<AudioBuffer | null> {
  let p = buffers.get(id);
  if (!p) {
    p = (async () => {
      const ac = ctx();
      if (!ac) return null;
      const res = await fetch(fileFor(id));
      if (!res.ok) throw new Error(`alarm ${id}: ${res.status}`);
      return ac.decodeAudioData(await res.arrayBuffer());
    })().catch(() => {
      buffers.delete(id); // try again next time
      return null;
    });
    buffers.set(id, p);
  }
  return p;
}

/** Fetch and decode a sound ahead of time, so the first order isn't silent while it downloads. */
export function preloadAlert(id: AlertSoundId = DEFAULT_SOUND): void {
  void load(id);
}

/** Peak level of a decoded file, sampled so a long clip stays cheap to measure. */
function peakOf(buf: AudioBuffer): number {
  let peak = 0;
  const step = 48;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < data.length; i += step) {
      const a = Math.abs(data[i]);
      if (a > peak) peak = a;
    }
  }
  return peak || 1;
}

/**
 * The saved recordings stay as they are. Playback is what changes: quiet
 * files are lifted to the same peak, a compressor keeps them from clipping,
 * and a little top end helps them cut through a busy shop.
 */
function chain(ac: AudioContext, src: AudioBufferSourceNode, buf: AudioBuffer): void {
  const peak = peakOf(buf);
  const makeup = Math.min(3.4, 0.92 / peak);
  const shelf = ac.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 2200;
  shelf.gain.value = 4.5;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 6;
  comp.ratio.value = 8;
  comp.attack.value = 0.002;
  comp.release.value = 0.16;
  const gain = ac.createGain();
  gain.gain.value = getAlertVolume() * makeup;
  src.connect(shelf);
  shelf.connect(comp);
  comp.connect(gain);
  gain.connect(ac.destination);
}

/** Start a sound; returns a stop function. `loop` repeats it seamlessly until stopped. */
function start(id: AlertSoundId, loop: boolean, delay = 0): () => void {
  let stopped = false;
  let src: AudioBufferSourceNode | null = null;
  void load(id).then((buf) => {
    const ac = ctx();
    if (stopped || !buf || !ac) return;
    src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    chain(ac, src, buf);
    src.start(ac.currentTime + delay);
  });
  return () => {
    stopped = true;
    try {
      src?.stop();
    } catch {}
  };
}

let stopPreview: (() => void) | null = null;

/** Play a sound once (a preview, or a single alert). Starting another stops the last. */
export function playAlert(id: AlertSoundId = DEFAULT_SOUND): void {
  stopPreview?.();
  stopPreview = start(id, false);
}

/** Stop whatever playAlert started. */
export function stopAlert(): void {
  stopPreview?.();
  stopPreview = null;
}

/**
 * A short pager-style sting, the same every time, so the kitchen hears
 * "new order" before whichever saved tune they picked starts looping.
 */
function playNotifySting(): void {
  try {
    const ac = ctx();
    if (!ac) return;
    const dest = ac.createGain();
    dest.gain.value = Math.min(1, getAlertVolume());
    dest.connect(ac.destination);
    const t = ac.currentTime + 0.01;
    tone(ac, dest, t, 784, 0.11, "square", 0.45);
    tone(ac, dest, t + 0.13, 988, 0.11, "square", 0.5);
    tone(ac, dest, t + 0.26, 1318, 0.22, "square", 0.55);
    tone(ac, dest, t + 0.42, 1568, 0.18, "triangle", 0.4);
  } catch {}
}

/** Loop an alarm until the board silences it. Returns the stop function. */
export function startUrgentLoop(id: AlertSoundId = DEFAULT_SOUND): () => void {
  stopPreview?.();
  stopPreview = null;
  playNotifySting();
  return start(id, true, 0.7);
}

function tone(ac: AudioContext, dest: AudioNode, at: number, freq: number, duration: number, type: OscillatorType, peak: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  osc.connect(gain);
  gain.connect(dest);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.05, peak), at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.start(at);
  osc.stop(at + duration + 0.03);
}

/** A short, bright "done" for a confirmed tap — the reward, not the alarm. */
export function playConfirm(): void {
  try {
    const ac = ctx();
    if (!ac) return;
    const dest = ac.createGain();
    dest.gain.value = getAlertVolume();
    dest.connect(ac.destination);
    const t = ac.currentTime + 0.01;
    tone(ac, dest, t, 1047, 0.12, "triangle", 0.7);
    tone(ac, dest, t + 0.08, 1568, 0.28, "triangle", 0.75);
    tone(ac, dest, t + 0.08, 2093, 0.22, "sine", 0.3);
  } catch {}
}
