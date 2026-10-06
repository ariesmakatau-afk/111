import type { Metadata } from "next";
import Image from "next/image";
import { fullAddress, site } from "@/lib/site";
import PageHero from "@/components/sections/PageHero";
import Visit from "@/components/sections/Visit";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import { IconBag, IconFlame, IconPin } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Visit — hours & location",
  description: `Find Yianni's Hellenic Yiros at ${fullAddress}. Opening hours, directions, pickup and delivery.`,
};

const ways = [
  {
    icon: IconFlame,
    t: "Dine in",
    d: "Counter service. Order, grab a seat, and it comes off the spit while you watch. Platters are dine-in only.",
  },
  {
    icon: IconBag,
    t: "Take away",
    d: `Order online for a pickup time, or call ${site.phone}. It'll be wrapped for when you arrive — pay at the counter.`,
    href: "/menu",
    cta: "Order online",
  },
  {
    icon: IconPin,
    t: "Delivery",
    d: "Can't make it to Hindley Street? We're on Uber Eats.",
    href: site.uberEats,
    cta: "Order on Uber Eats",
    external: true,
  },
];

export default function VisitPage() {
  return (
    <>
      <PageHero
        crumb="Visit"
        title={
          <>
            <span className="hero-line">
              <span>Come and find</span>
            </span>
            <span className="hero-line">
              <span style={{ "--d": "120ms" } as React.CSSProperties}>
                the <span className="fire-text">fire</span>.
              </span>
            </span>
          </>
        }
        lede={`${fullAddress}. Blue and white out front, Spartan helmets on the sign, charcoal smoke on the footpath. You can't miss it.`}
        image={
          <Image src="/images/storefront.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[50%_65%]" />
        }
      />

      <Visit />

      <section className="section bg-white">
        <div className="container-x">
          <div className="max-w-2xl" data-reveal>
            <p className="eyebrow">Three ways in</p>
            <h2 className="h-lg mt-5 text-blue-navy">
              However you eat it, it&rsquo;s the <span className="blue-text">same fire</span>.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {ways.map((w, i) => (
              <article key={w.t} className="tile flex flex-col p-7" data-reveal style={{ "--d": `${i * 100}ms` } as React.CSSProperties}>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-mist text-blue">
                  <w.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-serif text-[2rem] leading-none text-blue-navy">{w.t}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-muted">{w.d}</p>
                {w.href && (
                  <a
                    href={w.href}
                    {...(w.external ? { target: "_blank", rel: "noopener" } : {})}
                    className="mt-6 text-sm font-extrabold text-blue hover:text-ember-deep"
                  >
                    {w.cta} →
                  </a>
                )}
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm text-muted" data-reveal>
            Questions, a big group order, or something you left behind? Email{" "}
            <a href={`mailto:${site.email}`} className="font-bold text-blue underline underline-offset-4">
              {site.email}
            </a>{" "}
            or call {site.phone}.
          </p>
        </div>
      </section>

      <Faq />
      <FinalCta />
    </>
  );
}
