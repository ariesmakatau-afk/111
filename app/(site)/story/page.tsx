import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { reviews, site } from "@/lib/site";
import PageHero from "@/components/sections/PageHero";
import FinalCta from "@/components/sections/FinalCta";
import GreekKey from "@/components/GreekKey";
import Renovation from "@/components/sections/Renovation";
import CoalBed from "@/components/fire/CoalBed";
import EmberCanvas from "@/components/fire/EmberCanvas";
import { IconArrow, IconStar } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Nearly fifty years of yiros on one corner of Hindley Street, and Yianni's since 2002. Why we still cook over charcoal.",
};

const timeline = [
  {
    when: "Nearly fifty years ago",
    title: "A yiros shop on this corner",
    body: "Before it was ours, it was already a yiros shop. Different name, same smoke drifting down Hindley Street.",
  },
  {
    when: "2002",
    title: "Yianni takes the keys",
    body: "Stripped back, rebranded as Yianni's Hellenic Yiros, and rebuilt around one rule: charcoal or nothing.",
  },
  {
    when: "Nov 2023",
    title: "Best Yiros Shop",
    body: "delicious. 100 named us the best yiros shop. We said thank you, then went back to the spit.",
  },
  {
    when: "2025",
    title: "The renovation",
    body: "We took the shop back to the walls and rebuilt it.",
  },
  {
    when: "Tonight",
    title: "The coals are lit",
    body: "You know where we are. Walk in — or order ahead — and it'll be carved while you watch.",
  },
];

export default function StoryPage() {
  const quote = reviews[0];
  return (
    <>
      <PageHero
        crumb="Our story"
        title={
          <>
            <span className="hero-line">
              <span>We didn&rsquo;t set out</span>
            </span>
            <span className="hero-line">
              <span style={{ "--d": "120ms" } as React.CSSProperties}>
                to make a <span className="fire-text">legend</span>.
              </span>
            </span>
          </>
        }
        lede="We just kept the coals on. Adelaide did the rest."
        image={<Image src="/images/storefront.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[50%_65%]" />}
      />

      {/* Opening */}
      <section className="section bg-white">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative" data-reveal="scale">
            <div className="arch-frame mx-auto max-w-[460px]">
              <div className="arch aspect-[4/3]">
                <Image
                  src="/images/storefront.jpg"
                  alt="Yianni's Hellenic Yiros shopfront on Hindley Street — blue and white, Spartan helmets, EST-2002"
                  fill
                  sizes="(min-width: 1024px) 440px, 90vw"
                  className="arch__img !scale-100 object-[50%_40%]"
                />
              </div>
            </div>
          </div>
          <div>
            <p className="eyebrow" data-reveal>
              How it started
            </p>
            <h2 className="h-lg mt-5 text-blue-navy" data-reveal>
              A spit, some coals and a <span className="fire-text">lot</span> of smoke.
            </h2>
            <div className="mt-7 space-y-4" data-reveal>
              <p className="lede">
                There&rsquo;s been a yiros shop on this corner for nearly fifty years. Yianni&rsquo;s has carried the fire
                since {site.established}: Yianni took it on, stripped it back, and rebuilt it around one conviction —
                charcoal or nothing.
              </p>
              <p className="lede">
                The menu is three meats — lamb, chicken, pork — because a fourth would be showing off. The spit turns over
                real charcoal, because gas is faster and worse. What we serve isn&rsquo;t complicated, and that&rsquo;s the
                entire point: simple food is far harder to hide behind.
              </p>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2" data-reveal>
              {["Charcoal only", "Carved to order", "Est. 2002", "Best Yiros Shop 2023", "Renovated 2025"].map((t) => (
                <li key={t} className="rounded-full border border-line bg-porcelain px-4 py-2 text-sm font-bold text-blue-deep">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section surface-porcelain">
        <div className="container-x">
          <div className="max-w-2xl" data-reveal>
            <p className="eyebrow">Milestones</p>
            <h2 className="h-lg mt-5 text-blue-navy">
              Five decades, <span className="blue-text">five moments</span>.
            </h2>
          </div>
          <ol className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            <GreekKey tone="blue" className="absolute -top-7 left-0 right-0 hidden !h-2.5 opacity-40 lg:block" />
            {timeline.map((t, i) => (
              <li key={t.title} className="tile p-7" data-reveal style={{ "--d": `${i * 110}ms` } as React.CSSProperties}>
                <span className={`font-serif text-[2.2rem] leading-none ${i === timeline.length - 1 || t.when.includes("2023") ? "fire-text" : "text-blue"}`}>{t.when}</span>
                <h3 className="mt-5 text-lg font-extrabold text-blue-navy">{t.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Renovation />

      {/* The fire */}
      <section className="surface-dark grain relative overflow-hidden" data-tone="dark">
        <CoalBed />
        <EmberCanvas tone="dark" rate={30} band={0.12} motes={12} stokeOnPointer stokeOnScroll />
        <div className="container-x section relative z-10 grid items-center gap-14 !pb-[clamp(10rem,18vw,13rem)] lg:grid-cols-2">
          <div data-reveal>
            <p className="eyebrow">Why charcoal</p>
            <h2 className="h-xl mt-6 text-white">
              Slower. Fussier. <span className="fire-text">Better.</span>
            </h2>
          </div>
          <div className="space-y-4" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            <p className="lede">
              Charcoal needs tending all day: more raking, more cleaning, more patience than any gas burner. What you get
              back is a crackling edge and smoke through every layer.
            </p>
            <p className="lede">
              The meat turns all day and comes off the spit only when you order it — shaved straight into warm pita. That
              is the whole method. We&rsquo;ve never found a reason to change it.
            </p>
            <Link href="/menu" className="btn btn-glass mt-4">
              See what comes off it <IconArrow />
            </Link>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="section surface-blue relative overflow-hidden" data-tone="dark">
        <div className="container-x max-w-4xl text-center">
          <span className="inline-flex gap-1 text-amber drop-shadow-[0_0_8px_rgba(255,160,60,.6)]" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, k) => (
              <IconStar key={k} className="h-5 w-5" />
            ))}
          </span>
          <blockquote className="display mt-8 text-[clamp(2rem,4.4vw,3.6rem)] !leading-[1.12] text-white" data-reveal>
            &ldquo;{quote.quote}&rdquo;
          </blockquote>
          <p className="mt-8 text-sm font-bold text-white/70" data-reveal>
            {quote.author} · {quote.source} · {quote.date}
          </p>
        </div>
      </section>

      {/* One Yianni's + Parea */}
      <section className="section bg-white">
        <div className="container-x grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div data-reveal>
            <div className="relative h-24 w-24 overflow-hidden rounded-full shadow-[0_0_0_2px_var(--blue),0_0_0_8px_#fff,0_0_0_9.5px_var(--line)]">
              <Image src="/images/medallion-192.png" alt="The Yianni's medallion" fill sizes="96px" />
            </div>
            <h2 className="h-md mt-8 text-blue-navy">There is one Yianni&rsquo;s on Hindley Street.</h2>
            <p className="lede mt-4">
              It&rsquo;s this one, at 270 Hindley Street — and there has never been a second. Similarly named shops
              around Adelaide are not branches of ours and aren&rsquo;t connected to us. If the spit isn&rsquo;t turning
              over charcoal, you&rsquo;re in the wrong place.
            </p>
          </div>
          <div data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            <p className="font-serif text-[clamp(4rem,9vw,7rem)] italic leading-none text-blue">Parea</p>
            <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.24em] text-ember-deep">pa-RE-a · noun</p>
            <p className="lede mt-5">
              Greek for the people you share a table with. Ours are students at closing time, tradies at noon and families
              who drive across town for this.
            </p>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
