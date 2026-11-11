"use client";

import { useEffect, useState } from "react";
import { ALERT_SOUNDS, playAlert, type AlertSoundId } from "@/lib/alertSounds";
import Sheet from "../../order/Sheet";
import KitchenPushToggle from "../../push/KitchenPushToggle";
import { SOLDOUT_QUICK } from "./OrderOptionsSheet";
import { bump } from "./types";

const BUFFER_CHIPS = [0, 5, 10, 15, 20];

/** Shop-wide switches and the alarm, kept off the board until you need them. */
export default function KitchenSettingsSheet({
  open,
  onClose,
  paused,
  onTogglePause,
  busyMinutes,
  onBuffer,
  soldOutNote,
  onSoldOut,
  sound,
  onSound,
  soundOn,
  onToggleSound,
  volume,
  onVolume,
  loudMode,
  onToggleLoud,
}: {
  open: boolean;
  onClose: () => void;
  paused: boolean | null;
  onTogglePause: () => void;
  busyMinutes: number;
  onBuffer: (m: number) => void;
  soldOutNote: string | null;
  onSoldOut: (note: string | null) => void;
  sound: AlertSoundId;
  onSound: (id: AlertSoundId) => void;
  soundOn: boolean;
  onToggleSound: () => void;
  volume: number;
  onVolume: (v: number) => void;
  loudMode: boolean;
  onToggleLoud: () => void;
}) {
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (open) setDraft(soldOutNote ?? "");
  }, [open, soldOutNote]);

  const h = "text-xs font-extrabold uppercase tracking-[0.18em] text-[#3a3a3a]";
  const chip = (on: boolean) =>
    `press-btn rounded-full border px-4 py-2.5 text-sm font-extrabold ${on ? "border-black bg-black text-white" : "border-[#d0d0d0] bg-white text-[#111]"}`;

  return (
    <Sheet open={open} onClose={onClose} label="Kitchen settings" tone="light" wide>
      <div className="space-y-8 overflow-y-auto p-6 pt-7 sm:p-8">
        <h2 className="pr-12 font-serif text-4xl leading-none">Settings</h2>

        {paused !== null && (
          <section>
            <p className={h}>Online orders</p>
            <button
              type="button"
              role="switch"
              aria-checked={!paused}
              onClick={onTogglePause}
              className={`press-btn mt-3 w-full rounded-2xl px-5 py-4 text-left text-lg font-extrabold ${
                paused ? "bg-[#9b1c1c] text-white" : "border border-[#d0d0d0] bg-white"
              }`}
            >
              {paused ? "Paused — tap to turn back on" : "On — tap to pause"}
            </button>
          </section>
        )}

        <section>
          <p className={h}>Pacing — adds to every customer&rsquo;s wait</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BUFFER_CHIPS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  bump([8]);
                  onBuffer(m);
                }}
                className={chip(busyMinutes === m)}
              >
                {m === 0 ? "On time" : `+${m} min`}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className={h}>Sold out</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SOLDOUT_QUICK.map((x) => (
              <button key={x} type="button" onClick={() => setDraft(`${x} is sold out tonight.`)} className={chip(draft.startsWith(x))}>
                {x}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 140))}
              placeholder="e.g. Pork is sold out tonight."
              className="min-w-0 flex-1 rounded-xl border border-[#d0d0d0] bg-white px-4 py-3 text-[#111] placeholder:text-[#5c5c5c] focus:border-black focus:outline-none"
            />
            <button type="button" disabled={!draft.trim()} onClick={() => onSoldOut(draft.trim())} className="press-btn press-btn--light px-5 text-sm">
              Post
            </button>
          </div>
          {soldOutNote && (
            <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-amber">
              Showing now: &ldquo;{soldOutNote}&rdquo;
              <button
                type="button"
                onClick={() => {
                  onSoldOut(null);
                  setDraft("");
                }}
                className="press-btn rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-bold text-[#111]"
              >
                Clear
              </button>
            </p>
          )}
        </section>

        <section>
          <p className={h}>Alarm — tap one to hear it</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ALERT_SOUNDS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSound(opt.id)}
                className={`press-btn rounded-2xl border px-4 py-3 text-left ${sound === opt.id ? "border-black bg-[#f4f4f4]" : "border-[#e4e4e4] bg-white"}`}
              >
                <span className="block text-sm font-bold">{opt.label}</span>
                <span className="block text-xs font-semibold text-[#3a3a3a]">{opt.note}</span>
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm font-bold text-[#111]">
            Volume
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              onPointerUp={() => playAlert(sound)}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#e6e6e6] accent-black"
              aria-label="Alarm volume"
            />
          </label>
          <p className="mt-2 text-xs font-semibold text-[#3a3a3a]">This rides on top of the tablet&rsquo;s own volume — keep that at full.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" role="switch" aria-checked={loudMode} onClick={onToggleLoud} className={chip(loudMode)}>
              {loudMode ? "Repeats until silenced" : "Plays once"}
            </button>
            <button type="button" role="switch" aria-checked={soundOn} onClick={onToggleSound} className={chip(soundOn)}>
              {soundOn ? "Sound on" : "Sound off"}
            </button>
          </div>
        </section>

        <section>
          <p className={h}>Phone alerts</p>
          <div className="mt-3">
            <KitchenPushToggle className="press-btn rounded-full border border-[#d0d0d0] px-4 py-2.5 text-sm font-bold text-[#111]" />
          </div>
        </section>
      </div>
    </Sheet>
  );
}
