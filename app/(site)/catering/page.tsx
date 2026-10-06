import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/lib/site";
import PageHero from "@/components/sections/PageHero";
import CateringForm from "@/components/CateringForm";
import FeedingCrowd from "@/components/widgets/FeedingCrowd";
import FinalCta from "@/components/sections/FinalCta";
import { IconPhone } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Catering",
  description:
    "Charcoal yiros catering in Adelaide — trays of lamb, chicken and pork off the spit, salad, pita, chips and garlic sauce for offices, parties and family nights.",
};

const trays = [
  { t: "Off the spit", d: "Lamb, chicken and pork carved from the charcoal spit — pick one, or mix all three." },
  { t: "Salad & pita", d: "Fresh salad, lemon and warm pita to wrap it all up, however your crowd likes it." },
  { t: "Chips & sauces", d: "Hot chips by the tray, and more garlic sauce than seems reasonable. It never is." },
  { t: "Vegetarians sorted", d: "Crispy falafel and all the trimmings, so nobody's left picking at the salad." },
];

const steps = [
  { n: "01", t: "Tell us", d: "The date, the headcount and roughly what you're after — use the form or call the shop." },
  { n: "02", t: "We'll call back", d: "We'll suggest what to order for your numbers and give you a price." },
  { n: "03", t: "Collect it hot", d: "Pick it up on Hindley Street, carved and packed. Need delivery? Ask us." },
];

export default function CateringPage() {
  return (
    <>
      <PageHero
        crumb="Catering"
        title={
          <>
            <span className="hero-line">
              <span>Feeding a crowd?</span>
            </span>
            <span className="hero-line">
              <span style={{ "--d": "120ms" } as React.CSSProperties}>
                Bring the <span className="fire-text">fire</span>.
              </span>
            </span>
          </>
        }
        lede="Office lunches, birthdays, footy nights, wakes and big family dinners. The same charcoal yiros Hindley Street queues for, by the tray."
        image={<Image src="/images/spread-hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />}
      >
        <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ "--d": "380ms" } as React.CSSProperties}>
          <a href="#enquire" className="btn btn-fire">
            Make an enquiry
          </a>
          <a href={site.phoneHref} className="btn btn-glass">
            <IconPhone /> {site.phone}
          </a>
        </div>
      </PageHero>

      <section className="section bg-white">
        <div className="container-x">
          <div className="max-w-2xl" data-reveal>
            <p className="eyebrow">What we bring</p>
            <h2 className="h-lg mt-5 text-blue-navy">
              The whole shop, <span className="blue-text">on a tray</span>.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trays.map((x, i) => (
              <article key={x.t} className="tile p-6" data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                <span className="block h-1.5 w-10 rounded-full" style={{ background: "var(--fire-ink)" }} />
                <h3 className="mt-5 font-serif text-[1.9rem] leading-none text-blue-navy">{x.t}</h3>
                <p className="mt-3 leading-relaxed text-muted">{x.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section surface-porcelain">
        <div className="container-x">
          <FeedingCrowd />
        </div>
      </section>

      <section className="section bg-white" id="enquire">
        <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div data-reveal>
            <p className="eyebrow">How it works</p>
            <h2 className="h-lg mt-5 text-blue-navy">
              Three steps, then it&rsquo;s <span className="fire-text">sorted</span>.
            </h2>
            <ol className="mt-8 grid gap-5">
              {steps.map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="font-serif text-4xl leading-none text-ember">{s.n}</span>
                  <span>
                    <b className="block text-lg text-blue-navy">{s.t}</b>
                    <span className="text-muted">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-muted">
              Rather talk it through? Call{" "}
              <a href={site.phoneHref} className="font-bold text-blue">
                {site.phone}
              </a>{" "}
              or email{" "}
              <a href={`mailto:${site.email}`} className="font-bold text-blue">
                {site.email}
              </a>
              .
            </p>
          </div>
          <div data-reveal>
            <CateringForm />
          </div>
        </div>
      </section>

      <FinalCta
        eyebrow="Just hungry?"
        title={
          <>
            Order for one. Or <span className="fire-text">five</span>.
          </>
        }
        body="Everyday orders go through the menu — pick a pickup time and pay at the counter."
      />
    </>
  );
}
