import { fullAddress, site, directionsHref } from "@/lib/site";
import AdelaideClock from "../widgets/AdelaideClock";
import WeekStrip from "../widgets/WeekStrip";
import SpotlightCard from "../widgets/SpotlightCard";
import CopyAddress from "../widgets/CopyAddress";
import { IconArrow, IconPhone } from "../Icons";
import GreekKey from "../GreekKey";

/**
 * "Today at Yianni's" — the live information panel: the clock, the fire's
 * state, the week of hours, and the time-of-day spotlight with a one-tap
 * order. Facts from lib/site.ts and lib/shop-live.ts; nothing invented.
 */
export default function TodayAtYiannis() {
  return (
    <section className="section surface-porcelain overflow-hidden" aria-labelledby="today-title" id="today">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div data-reveal>
            <p className="eyebrow">Today at the shop</p>
            <h2 id="today-title" className="h-lg mt-5 text-blue-navy">
              Here&rsquo;s <span className="blue-text">today.</span>
            </h2>
          </div>
          <p className="lede max-w-sm" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            Live hours, today&rsquo;s pick and the week ahead. Adelaide time, not Greek time.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
          <div className="tile p-7 sm:p-8" data-reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-blue">Adelaide · Hindley Street</p>
              <AdelaideClock className="font-serif text-[2.1rem] leading-none text-blue-navy" withSeconds />
            </div>

            <h3 className="mt-6 font-serif text-[clamp(1.6rem,2.6vw,2.15rem)] leading-tight text-blue-navy">
              The week at a <span className="fire-text !not-italic">glance</span>.
            </h3>
            <p className="mt-2 max-w-md text-[0.92rem] leading-relaxed text-muted">
              Late nights Friday and Saturday. Mondays we close at 3:30pm.
            </p>

            <div className="mt-7">
              <WeekStrip />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
              <a href={site.phoneHref} className="btn btn-ghost btn-sm">
                <IconPhone /> {site.phone}
              </a>
              <a href={directionsHref} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                Directions <IconArrow />
              </a>
              <CopyAddress text={fullAddress} />
            </div>
          </div>

          <SpotlightCard />
        </div>
      </div>
      <GreekKey tone="faint" className="absolute inset-x-0 bottom-0 !h-2.5 opacity-40" />
    </section>
  );
}
