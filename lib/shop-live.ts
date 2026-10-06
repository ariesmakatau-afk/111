// lib/shop-live.ts
//
// The "right now at the shop" maths behind the live widgets: the hero
// pulse card, the Today panel, the kitchen strip, the last-call chips.
//
// Everything is Adelaide time and derived purely from trading hours and the
// menu — a widget can only say things the shop has actually committed to in
// lib/site.ts. Pure functions only, no server APIs, so the same code runs
// in the browser on a 1-second tick and in a server render.

import { hours, TIMEZONE } from "./site";
import type { LineConfig } from "./order";
import { formatTime } from "./hours";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MIN = 60;

export type Clock = {
  /** 0 = Monday. */
  dayIndex: number;
  /** Seconds since midnight, Adelaide. */
  secOfDay: number;
};

export function adelaideClock(date = new Date()): Clock {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const dayIndex = Math.max(0, WEEKDAYS.indexOf(get("weekday").slice(0, 3)));
  const secOfDay = Number(get("hour")) * 3600 + Number(get("minute")) * MIN + Number(get("second"));
  return { dayIndex, secOfDay };
}

/** "7:12 pm" from a seconds-of-day value. */
export function formatClockTime(secOfDay: number): string {
  return formatTime(Math.floor(secOfDay / MIN));
}

/** A countdown that breathes: "2h 14m", or "9m 04s" once the hour is gone. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

export type ShopNow = {
  clock: Clock;
  open: boolean;
  today: (typeof hours)[number];
  tomorrow: (typeof hours)[number];
  /** "closes" while trading, "opens" while dark. */
  verb: "closes" | "opens";
  /** Boundary time, minutes after midnight — of the close or the next open. */
  boundaryMin: number;
  /** Seconds until that boundary. */
  secondsTo: number;
  /** Within 45 minutes of the close, while open. */
  lastCallSoon: boolean;
  /**
   * The last *timed* pickup slot still bookable online (matches the 15-minute
   * slot grid in lib/hours.ts), or null when only "as soon as possible" is
   * left (open) or nothing is (closed past today's last slot).
   */
  lastSlotMin: number | null;
  /** Whether "as soon as possible" is currently on the table. */
  asapAvailable: boolean;
  /** e.g. "9:15am" — the first slot of the next trading session. */
  firstSlotLabel: string;
};

export function shopNow(date = new Date()): ShopNow {
  const clock = adelaideClock(date);
  const today = hours[clock.dayIndex];
  const tomorrow = hours[(clock.dayIndex + 1) % 7];
  const min = clock.secOfDay / MIN;
  const SLOT = 15; // pickup slots run on a 15-minute grid (see lib/hours.ts)

  if (min >= today.open && min < today.close) {
    // A timed slot at time T needs now + SLOT <= T, and T <= close - SLOT.
    const timedStillOpen = min + SLOT <= today.close - SLOT;
    return {
      clock,
      open: true,
      today,
      tomorrow,
      verb: "closes",
      boundaryMin: today.close,
      secondsTo: today.close * MIN - clock.secOfDay,
      lastCallSoon: today.close - min <= 45,
      lastSlotMin: timedStillOpen ? today.close - SLOT : null,
      asapAvailable: true,
      firstSlotLabel: formatTime(tomorrow.open + SLOT),
    };
  }

  if (min < today.open) {
    return {
      clock,
      open: false,
      today,
      tomorrow,
      verb: "opens",
      boundaryMin: today.open,
      secondsTo: today.open * MIN - clock.secOfDay,
      lastCallSoon: false,
      lastSlotMin: null,
      asapAvailable: false,
      firstSlotLabel: formatTime(today.open + SLOT),
    };
  }

  return {
    clock,
    open: false,
    today,
    tomorrow,
    verb: "opens",
    boundaryMin: tomorrow.open,
    secondsTo: 24 * 3600 - clock.secOfDay + tomorrow.open * MIN,
    lastCallSoon: false,
    lastSlotMin: null,
    asapAvailable: false,
    firstSlotLabel: formatTime(tomorrow.open + SLOT),
  };
}

/** "Closes in 2h 14m" / "Opens in 47m 02s". */
export function countdownLabel(now: ShopNow, withSeconds = false): string {
  const secs = withSeconds ? now.secondsTo : Math.floor(now.secondsTo / MIN) * MIN;
  return `${now.verb === "closes" ? "Closes" : "Opens"} in ${formatCountdown(secs)}`;
}

// ---------------------------------------------------------------------------
// The moment — what the day is asking for, right now.
// ---------------------------------------------------------------------------

export type Moment = {
  key: string;
  kicker: string;
  title: string;
  body: string;
  /** Real menu lines, priced by lib/order — never invented prices. */
  lines: { cfg: LineConfig; qty: number }[];
  /** Label for the action, e.g. "Put it on the spit". */
  cta: string;
};

const cfg = (
  productId: string,
  sizeId: string,
  meats: LineConfig["meats"],
  sauces: string[],
  extras: LineConfig["extras"] = [],
  variant?: string
): { cfg: LineConfig; qty: number } => ({
  cfg: { productId, sizeId, meats, sauces, extras, ...(variant ? { variant } : {}) },
  qty: 1,
});

/**
 * A time-of-day spotlight. The copy is house voice, the facts (hours, slots,
 * menu lines, prices) all come from the data.
 */
export function momentOf(now: ShopNow): Moment {
  const min = now.clock.secOfDay / MIN;
  const { dayIndex } = now.clock;

  if (!now.open) {
    const beforeTodayOpen = min < now.today.open;
    return {
      key: "banked",
      kicker: `The coals are banked · back at ${formatTime(now.boundaryMin)}`,
      title: beforeTodayOpen ? "First fire at nine." : "The fire is sleeping.",
      body: beforeTodayOpen
        ? "We open at nine. Order now and the first wrap comes off the spit at the first knock — pay at the counter when you're here."
        : `We're back at ${formatTime(now.today.open)}. Send tomorrow's lunch through now and skip the queue it always creates.`,
      lines: beforeTodayOpen
        ? [cfg("yiros", "regular", ["lamb"], ["Garlic"]), cfg("greek-coffee", "standard", [], [])]
        : [cfg("ab-pack", "small", ["lamb", "pork"], ["Garlic", "BBQ", "Hot chilli"])],
      cta: "Order ahead",
    };
  }

  if (dayIndex === 0 && min >= 13 * MIN) {
    return {
      key: "monday",
      kicker: "Monday's last call",
      title: "Mondays we bank the coals at 3:30pm.",
      body: "If the day has gone sideways, an AB Pack fixes that. Order now, collect it on your way through Hindley, pay at the counter.",
      lines: [cfg("ab-pack", "small", ["chicken"], ["Garlic", "BBQ", "Hot chilli"])],
      cta: "Fix the day",
    };
  }

  if (min >= 21 * MIN) {
    return {
      key: "late",
      kicker: "The late shift · until closing",
      title: "Late on Hindley.",
      body: "This is the hour the AB Pack was invented for: chips down the bottom, charcoal meat over the top, three sauces buried in it.",
      lines: [cfg("ab-pack", "large", ["lamb", "pork"], ["Garlic", "BBQ", "Hot chilli"]), cfg("soft-drink", "600ml", [], [], [], "Coke")],
      cta: "Send one through",
    };
  }

  if (min >= 17 * MIN) {
    return {
      key: "dinner",
      kicker: "Dinner service",
      title: "Carved late, eaten fast.",
      body: "The after-work rush. Order ahead, pick a time, and your yiros is off the fire the minute you walk in — pay at the counter.",
      lines: [cfg("yiros", "regular", ["lamb", "chicken"], ["Garlic", "BBQ"]), cfg("chips", "small", [], [])],
      cta: "Order for tonight",
    };
  }

  if (min >= 14.5 * MIN) {
    return {
      key: "quiet",
      kicker: "The quiet hours",
      title: "Between lunch and dinner, the shop is yours.",
      body: "The best window to walk in without a wait — or to send an order through for a table that's already yours. Falafel, chips, a Greek coffee, no theatre.",
      lines: [cfg("falafel-yiros", "standard", [], ["Garlic"]), cfg("greek-coffee", "standard", [], [])],
      cta: "Enjoy the quiet",
    };
  }

  if (min >= 11 * MIN) {
    return {
      key: "lunch",
      kicker: "The lunch rush",
      title: "Half of Hindley's offices order at once.",
      body: "This is the hour to be online, not in line. Add it now, pick twelve-fifteen, and it's wrapped and waiting — you pay at the counter.",
      lines: [cfg("yiros", "regular", ["chicken"], ["Garlic"]), cfg("chips", "small", [], [])],
      cta: "Skip the lunch queue",
    };
  }

  return {
    key: "early",
    kicker: "Early doors",
    title: "Nine o'clock on Hindley.",
    body: "Coffee first, then whatever you like. The spits are up, the shop's quiet, and nobody has judged your 9am yiros yet.",
    lines: [cfg("greek-coffee", "standard", [], []), cfg("veggie-roll", "standard", [], ["Garlic"])],
    cta: "Start the day",
  };
}
