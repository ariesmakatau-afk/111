import { award, rating, site } from "@/lib/site";
import ReviewDeck from "./ReviewDeck";
import { IconStar } from "../Icons";

export default function Reviews() {
  return (
    <section className="section surface-blue relative overflow-hidden" data-tone="dark" aria-labelledby="reviews-title">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-[260px] w-[260px] rounded-full border border-white/10"
      />
      <div className="container-x relative">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl" data-reveal>
            <p className="eyebrow !text-white/85">Word on the street</p>
            <h2 id="reviews-title" className="h-lg mt-5 text-white">
              Don&rsquo;t take our word for it. <span className="fire-text">Yia-yia&rsquo;s biased.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-4" data-reveal>
            <div className="rounded-[22px] border border-white/15 bg-white/[0.07] px-6 py-4 backdrop-blur-sm">
              <p className="flex items-center gap-3">
                <span className="font-serif text-5xl leading-none text-white">{rating.value}</span>
                <span className="flex gap-0.5 text-amber drop-shadow-[0_0_8px_rgba(255,160,60,.6)]" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <IconStar key={k} className="h-4 w-4" />
                  ))}
                </span>
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/60">Average rating</p>
            </div>
            <div className="rounded-[22px] border border-amber/40 bg-white/[0.07] px-6 py-4 backdrop-blur-sm">
              <p className="font-serif text-3xl leading-none text-white">{award.title}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-amber">
                {award.by} · {award.date}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14" data-reveal>
          <ReviewDeck />
        </div>

        <p className="mt-10 text-sm text-white/70" data-reveal>
          Been in? Tell us how it went on{" "}
          <a href={site.instagram} target="_blank" rel="noopener" className="font-bold text-white underline decoration-amber/60 underline-offset-4 hover:decoration-amber">
            Instagram
          </a>{" "}
          or{" "}
          <a href={site.facebook} target="_blank" rel="noopener" className="font-bold text-white underline decoration-amber/60 underline-offset-4 hover:decoration-amber">
            Facebook
          </a>
          .
        </p>
      </div>
    </section>
  );
}
