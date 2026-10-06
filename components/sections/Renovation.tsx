import { renovation } from "@/lib/site";
import CoalBed from "../fire/CoalBed";
import GreekKey from "../GreekKey";
import { IconAccessible } from "../Icons";

/** The 2025 renovation as a two-sided ledger: what's new, what never changes. */
export default function Renovation() {
  return (
    <section className="section bg-white" aria-labelledby="reno-title">
      <div className="container-x">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div data-reveal>
            <p className="eyebrow">The {renovation.year} renovation</p>
            <h2 id="reno-title" className="h-lg mt-5 max-w-3xl text-blue-navy">
              New everything. Same <span className="fire-text">everything that matters</span>.
            </h2>
          </div>
          <p className="lede max-w-sm" data-reveal>
            We took the shop back to the walls and rebuilt it. Then we lit the same fire.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="tile p-7 hover:!translate-y-0 sm:p-9" data-reveal>
            <GreekKey tone="blue" className="!h-2.5 opacity-70" />
            <p className="mt-6 font-serif text-[2.6rem] leading-none text-blue">New</p>
            <ul className="mt-6 grid gap-3">
              {renovation.new.map((item) => (
                <li key={item} className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0">
                  <span className="font-serif text-[1.7rem] leading-none text-blue-navy">
                    {item === "Wheelchair access" ? (
                      <>
                        Wheelchair access <IconAccessible className="ml-1 inline h-6 w-6 align-[-0.1em] text-blue" />
                      </>
                    ) : (
                      `New ${item.toLowerCase()}`
                    )}
                  </span>
                  <span className="tag">{renovation.year}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-dark grain relative overflow-hidden rounded-[var(--radius)] p-7 sm:p-9" data-tone="dark" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            <CoalBed className="!h-24 opacity-80" />
            <div className="relative z-10 pb-16">
              <GreekKey tone="ember" className="!h-2.5" />
              <p className="mt-6 font-serif text-[2.6rem] leading-none">
                <span className="fire-text">Same</span>
              </p>
              <ul className="mt-6 grid gap-3">
                {renovation.same.map((item) => (
                  <li key={item} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-0">
                    <span className="font-serif text-[1.7rem] leading-none text-white">Same {item.toLowerCase()}</span>
                    <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber">Unchanged</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
