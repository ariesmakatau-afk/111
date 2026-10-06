import Link from "next/link";
import { faqs, site } from "@/lib/site";
import { IconArrow, IconPhone, IconPlus } from "../Icons";

/**
 * The counter conversation, written down. The home page shows the top four
 * (maxItems) and points here-in-full at /visit — the same component, so the
 * answers can never say different things in different places.
 */
export default function Faq({ maxItems, moreHref }: { maxItems?: number; moreHref?: string } = {}) {
  const shown = maxItems ? faqs.slice(0, maxItems) : faqs;
  return (
    <section id="faq" className="section bg-white scroll-mt-24" aria-labelledby="faq-title">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div data-reveal className="lg:sticky lg:top-[120px] lg:self-start">
          <p className="eyebrow">Good questions</p>
          <h2 id="faq-title" className="h-lg mt-5 text-blue-navy">
            Everything you wanted to <span className="blue-text">ask</span> at the counter.
          </h2>
          <p className="lede mt-5 max-w-sm">Something we haven&rsquo;t covered? The shop phone gets answered by the people holding the knife.</p>
          <a href={site.phoneHref} className="btn btn-ghost mt-7">
            <IconPhone /> {site.phone}
          </a>
        </div>
        <div className="flex flex-col gap-3">
          {shown.map((f, i) => (
            <details
              key={f.q}
              className="faq group rounded-[22px] border border-line bg-porcelain/60 px-6 transition-colors open:bg-white"
              data-reveal
              style={{ "--d": `${i * 60}ms` } as React.CSSProperties}
            >
              <summary className="flex items-center justify-between gap-6 py-5 text-[1.05rem] font-bold text-blue-navy">
                {f.q}
                <span className="faq__icon grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-blue">
                  <IconPlus />
                </span>
              </summary>
              <p className="-mt-1 pb-6 pr-10 leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
          {moreHref && faqs.length > shown.length && (
            <Link href={moreHref} className="tile flex items-center justify-between gap-4 px-6 py-5" data-reveal>
              <span className="font-serif text-[1.35rem] text-blue-navy">
                {faqs.length - shown.length} more on the Visit page
              </span>
              <IconArrow className="h-5 w-5 shrink-0 text-ember" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
