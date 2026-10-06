// lib/hours.ts
//
// Opening-status maths, always in Adelaide time — someone checking from
// Melbourne or overseas should see whether the *shop* is open, not whether
// it would be open in their own timezone.

import { hours, TIMEZONE } from "./site";

export type OpenState = {
  open: boolean;
  /** Short, human line, e.g. "Open now · until 8pm" */
  label: string;
  /** Minutes until closing (open) or opening (closed). */
  minutesAway: number;
  /** 0 = Monday. */
  todayIndex: number;
  closingSoon: boolean;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function adelaideNow(date = new Date()): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dayIndex = Math.max(0, WEEKDAYS.indexOf(get("weekday").slice(0, 3)));
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return { dayIndex, minutes };
}

export function formatTime(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? "pm" : "am";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return m ? `${h}:${String(m).padStart(2, "0")}${suffix}` : `${h}${suffix}`;
}

export function formatRange(open: number, close: number): string {
  return `${formatTime(open)} – ${formatTime(close)}`;
}

export function openState(date = new Date()): OpenState {
  const { dayIndex, minutes } = adelaideNow(date);
  const today = hours[dayIndex];

  if (minutes >= today.open && minutes < today.close) {
    const left = today.close - minutes;
    return {
      open: true,
      label:
        left <= 45
          ? `Open now · last call in ${left} min`
          : `Open now · until ${formatTime(today.close)}`,
      minutesAway: left,
      todayIndex: dayIndex,
      closingSoon: left <= 45,
    };
  }

  if (minutes < today.open) {
    return {
      open: false,
      label: `Coals are warming · open ${formatTime(today.open)}`,
      minutesAway: today.open - minutes,
      todayIndex: dayIndex,
      closingSoon: false,
    };
  }

  const tomorrowIndex = (dayIndex + 1) % 7;
  const tomorrow = hours[tomorrowIndex];
  return {
    open: false,
    label: `Closed · back tomorrow ${formatTime(tomorrow.open)}`,
    minutesAway: 24 * 60 - minutes + tomorrow.open,
    todayIndex: dayIndex,
    closingSoon: false,
  };
}

/**
 * Pickup slots for the online order form, in Adelaide time: every 15 minutes
 * from 15 minutes out until 15 minutes before close. After today's last slot,
 * it offers the next day's instead, so a late-night visitor can order ahead.
 */
export function pickupSlots(date = new Date()): { value: string; label: string }[] {
  const { dayIndex, minutes } = adelaideNow(date);
  const round = (m: number) => Math.ceil(m / 15) * 15;
  const today = hours[dayIndex];
  const slots: { value: string; label: string }[] = [];

  const open = minutes >= today.open && minutes < today.close;
  if (open) slots.push({ value: "ASAP", label: "As soon as possible" });

  const first = round(Math.max(minutes + 15, today.open + 15));
  for (let m = first; m <= today.close - 15; m += 15) {
    slots.push({ value: `Today ${formatTime(m)}`, label: `Today, ${formatTime(m)}` });
  }
  if (slots.length <= 1) {
    const t = (dayIndex + 1) % 7;
    const next = hours[t];
    for (let m = next.open + 15; m <= next.close - 15; m += 15) {
      slots.push({ value: `Tomorrow ${formatTime(m)}`, label: `Tomorrow (${next.day}), ${formatTime(m)}` });
    }
  }
  return slots;
}
