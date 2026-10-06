import { directionsHref, fullAddress, mapEmbedSrc, site } from "@/lib/site";
import HoursTable from "../HoursTable";
import OpenStatus from "../OpenStatus";
import { IconAccessible, IconArrow, IconPhone, IconPin } from "../Icons";

export default function Visit({ headingLevel = 2, compact = false }: { headingLevel?: 1 | 2; compact?: boolean }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="section surface-porcelain overflow-hidden" aria-labelledby="visit-title" id="visit">
      <div className="container-x grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div data-reveal>
          <p className="eyebrow">Find us</p>
          <H id="visit-title" className="h-lg mt-5 text-blue-navy">
            Middle of Hindley. Follow the <span className="fire-text">smoke</span>.
          </H>
          <p className="lede mt-5 max-w-md">
            Walk in, point at the spit and watch it carved. Dine in, take away, or get it delivered on Uber Eats.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <OpenStatus />
            <span className="status">
              <IconAccessible className="h-4 w-4 text-blue" /> Wheelchair accessible
            </span>
          </div>
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener"
            className="mt-6 flex items-start gap-3 text-lg font-semibold text-blue-navy hover:text-blue"
          >
            <IconPin className="mt-1 h-5 w-5 shrink-0 text-ember" />
            {fullAddress}
          </a>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={directionsHref} target="_blank" rel="noopener" className="btn btn-blue">
              Get directions <IconArrow />
            </a>
            <a href={site.phoneHref} className="btn btn-ghost">
              <IconPhone /> {site.phone}
            </a>
          </div>

          {compact ? (
            <p className="mt-10 text-sm text-muted">
              Full trading hours are on the{" "}
              <a href="/visit" className="font-bold text-blue underline underline-offset-4">
                Visit page
              </a>
              .
            </p>
          ) : (
            <div className="tile mt-10 overflow-hidden !rounded-[22px] p-0 hover:!translate-y-0">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-blue">Trading hours</span>
                <span className="text-xs text-muted">Adelaide time</span>
              </div>
              <HoursTable />
            </div>
          )}
        </div>

        <div className="relative lg:sticky lg:top-[110px]" data-reveal="scale">
          <div className="relative overflow-hidden rounded-[30px] bg-white p-2.5 shadow-[0_0_0_1.5px_var(--blue),0_40px_80px_-40px_rgba(11,50,120,.55)]">
            {/* Shown until (or if) the map loads. */}
            <div
              aria-hidden="true"
              className="absolute inset-2.5 grid place-items-center rounded-[22px] bg-mist bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-[size:44px_44px]"
            >
              <span className="flex flex-col items-center gap-3 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full text-[#1d0700] shadow-[0_0_30px_rgba(255,110,30,.55)]" style={{ background: "var(--fire-btn)" }}>
                  <IconPin className="h-6 w-6" />
                </span>
                <span className="font-serif text-2xl text-blue-navy">{site.address.street}</span>
              </span>
            </div>
            <iframe
              title={`Map showing Yianni's at ${fullAddress}`}
              src={mapEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="relative block aspect-[4/5] w-full rounded-[22px] border-0 grayscale-[0.35] sm:aspect-[5/4] lg:aspect-[4/5]"
            />
          </div>
          <div className="absolute -bottom-5 left-6 right-6 flex items-center gap-3 rounded-2xl bg-blue-navy p-4 text-white shadow-2xl sm:left-auto sm:w-80" data-tone="dark">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#1d0700] shadow-[0_0_20px_rgba(255,110,30,.6)]" style={{ background: "var(--fire-btn)" }}>
              <IconPin className="h-5 w-5" />
            </span>
            <span className="text-sm leading-snug">
              <b className="block">Yianni&rsquo;s Hellenic Yiros</b>
              <span className="text-white/65">{site.address.street}, Adelaide</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
