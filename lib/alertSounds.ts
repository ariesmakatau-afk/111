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

/** Start a sound; returns a stop function. `loop` repeats it seamlessly until stopped. */
function start(id: AlertSoundId, loop: boolean): () => void {
  let stopped = false;
  let src: AudioBufferSourceNode | null = null;
  void load(id).then((buf) => {
    const ac = ctx();
    if (stopped || !buf || !ac) return;
    const gain = ac.createGain();
    gain.gain.value = getAlertVolume();
    src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
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

/** Loop an alarm until the board silences it. Returns the stop function. */
export function startUrgentLoop(id: AlertSoundId = DEFAULT_SOUND): () => void {
  stopPreview?.();
  stopPreview = null;
  return start(id, true);
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
