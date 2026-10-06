import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { award, houseNumbers, rating, site } from "@/lib/site";
import { allProducts, priceRange } from "@/lib/menu";
import { readPhotos } from "@/lib/content-store";
import CoalBed from "@/components/fire/CoalBed";
import EmberCanvas from "@/components/fire/EmberCanvas";
import CountUp from "@/components/CountUp";
import FireLink from "@/components/FireLink";
import GreekKey from "@/components/GreekKey";
import HeroMedia from "@/components/HeroMedia";
import HalalBadge from "@/components/HalalBadge";
import Marquee from "@/components/Marquee";
import OpenStatus from "@/components/OpenStatus";
import SpinBadge from "@/components/SpinBadge";
import AddButton from "@/components/order/AddButton";
import UsualCard, { type Usual } from "@/components/order/UsualCard";
import YirosBuilder from "@/components/order/YirosBuilder";
import TeamGrid from "@/components/people/TeamGrid";
import CustomerWall from "@/components/people/CustomerWall";
import Reviews from "@/components/sections/Reviews";
import TodayAtYiannis from "@/components/sections/TodayAtYiannis";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import ShopPulse from "@/components/widgets/ShopPulse";
import BoundaryCountdown from "@/components/widgets/BoundaryCountdown";
import SpinForIt from "@/components/widgets/SpinForIt";
import OrderLookup from "@/components/widgets/OrderLookup";
import { IconArrow, IconStar } from "@/components/Icons";
import { DealBanner } from "@/components/Deal";

// Staff and customer photos uploaded in /admin show up within a minute.
export const revalidate = 30;

export const metadata: Metadata = { alternates: { canonical: "/" } };

const byId = (id: string) => allProducts.find((p) => p.id === id)!;

const signatures = [
  {
    product: byId("yiros"),
    img: "/images/yiros-wrap.jpg",
    alt: "A charcoal yiros with tomato and lettuce, wrapped in Yianni's paper",
    tag: "The signature",
    line: "Lettuce, tomato, onion, garlic sauce and lemon, wrapped around meat carved straight off the spit.",
  },
  {
    product: byId("ab-pack"),
    img: "/images/ab-pack-box.jpg",
    alt: "An AB Pack in its box: charcoal meat over chips with garlic and chilli sauce",
    tag: "Three sauces",
    line: "Chips on the bottom, meat on top, three sauces over everything. Adelaide's gift to the world.",
  },
  {
    product: byId("platter"),
    img: "/images/platter-blue.jpg",
    alt: "A platter of charcoal meat and salad with pita on a blue Greek-key plate",
    tag: "Dine-in",
    line: "Meat, salad, pita, garlic sauce and lemon — for sitting down, taking your time and sharing badly.",
  },
  {
    product: byId("greek-coffee"),
    img: "/images/greek-coffee.jpg",
    alt: "A Greek coffee in a meander-patterned cup reading Kalimera Ellada",
    tag: "Kalimera",
    line: "Short black, one sugar. The way it's made at home — and yes, we open at nine.",
  },
];

// The "why charcoal" story is told once: the section headline carries the
// charcoal claim itself, so the cards under it only have to say what happens
// next — carve, sauce, generosity. (No fourth card; the old one just
// repeated the headline back at you.)
const fireSteps = [
  { n: "01", title: "Carved to order", body: "Shaved off the spit the moment you order, into warm pita and straight into your hands." },
  { n: "02", title: "The garlic sauce", body: "Made in the shop the way it has always been made. No, we won't tell you. Yes, people have asked." },
  { n: "03", title: "Generous by default", body: "Lamb, chicken or pork. Have one or mix all three. Nobody leaves hungry. It's the Greek way." },
];

const usuals: Usual[] = [
  {
    name: "The Regular",
    items: ["Regular Chicken Yiros, garlic sauce", "Small Chips"],
    note: "Lunch, sorted. Swap to lamb for +$2.",
    lines: [
      { cfg: { productId: "yiros", sizeId: "regular", meats: ["chicken"], sauces: ["Garlic"], extras: [] }, qty: 1 },
      { cfg: { productId: "chips", sizeId: "small", meats: [], sauces: [], extras: [] }, qty: 1 },
    ],
  },
  {
    name: "The Late Shift",
    items: ["Large AB Pack, lamb & pork", "Garlic, BBQ & hot chilli — all three included"],
    note: "Built for Friday nights on Hindley.",
    lines: [
      {
        cfg: { productId: "ab-pack", sizeId: "large", meats: ["lamb", "pork"], sauces: ["Garlic", "BBQ", "Hot chilli"], extras: [] },
        qty: 1,
      },
    ],
  },
  {
    name: "The Parea Pack",
    items: ["Large Meat Pack — lamb, chicken & pork", "Family Chips", "Salad Pack", "Four pita breads"],
    note: "Wrap your own at home. Feeds three or four.",
    lines: [
      { cfg: { productId: "meat-pack", sizeId: "large", meats: ["lamb", "chicken", "pork"], sauces: ["Garlic"], extras: [] }, qty: 1 },
      { cfg: { productId: "chips", sizeId: "family", meats: [], sauces: [], extras: [] }, qty: 1 },
      { cfg: { productId: "salad-pack", sizeId: "standard", meats: [], sauces: [], extras: [] }, qty: 1 },
      { cfg: { productId: "pita-bread", sizeId: "standard", meats: [], sauces: [], extras: [] }, qty: 4 },
    ],
  },
  {
    name: "The Pork Purist",
    items: ["Regular Pork Yiros, garlic sauce", "Small Chips"],
    note: "For the pork loyalists. Pork all the way down.",
    lines: [
      { cfg: { productId: "yiros", sizeId: "regular", meats: ["pork"], sauces: ["Garlic"], extras: [] }, qty: 1 },
      { cfg: { productId: "chips", sizeId: "small", meats: [], sauces: [], extras: [] }, qty: 1 },
    ],
  },
];

function Stars({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <span className="flex gap-0.5 text-amber" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} className={className} />
      ))}
    </span>
  );
}

export default async function HomePage() {
  const [team, customers] = await Promise.all([readPhotos("team", { revalidate: 30 }), readPhotos("customers", { revalidate: 30 })]);

  return (
    <>
      {/* ============================ HERO ============================ */}
      {/* The looping spit video (or its poster) fills the screen; the intro
          sits over it, lit by the coals and live sparks. */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-char-950" data-tone="dark" data-header-dark>
        <HeroMedia />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,16,38,.82)_0%,rgba(6,16,38,.55)_45%,rgba(6,16,38,.35)_70%,rgba(6,16,38,.75)_100%)] sm:bg-[linear-gradient(90deg,rgba(6,16,38,.92)_0%,rgba(6,16,38,.72)_38%,rgba(6,16,38,.25)_70%,rgba(6,16,38,.35)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,24,58,.75)_0%,rgba(7,24,58,0)_28%,rgba(4,10,23,0)_60%,rgba(4,10,23,.95)_100%)]"
        />
        <div className="firelight !mix-blend-soft-light" aria-hidden="true" />
        <EmberCanvas tone="dark" rate={38} band={0.14} motes={16} stokeOnPointer stokeOnScroll />

        <div className="container-x relative z-10 flex min-h-[100svh] flex-col justify-end pb-[clamp(9rem,17vw,13rem)] pt-40">
          <DealBanner />
          <div className="fade-up flex flex-wrap items-center gap-2.5">
            <OpenStatus />
            <BoundaryCountdown />
            {/* Phones already get the award in the stats row below; one mention is enough. */}
            <span className="status !hidden !pl-3 sm:!inline-flex">
              <span aria-hidden="true" className="text-amber">✦</span> {award.by} · {award.title} · {award.date.replace("November", "Nov")}
            </span>
          </div>
          <h1 className="h-hero mt-7 max-w-4xl text-white">
            <span className="hero-line">
              <span style={{ "--d": "60ms" } as React.CSSProperties}>Greek soul.</span>
            </span>
            <span className="hero-line">
              <span style={{ "--d": "180ms" } as React.CSSProperties}>
                <span className="fire-text">Charcoal</span> heart.
              </span>
            </span>
          </h1>
          <p className="lede fade-up mt-6 max-w-[34rem] !text-white/75" style={{ "--d": "420ms" } as React.CSSProperties}>
            Lamb, chicken and pork turned over real charcoal, carved to order and wrapped in warm pita. On Hindley Street
            since {site.established}.
          </p>
          <div className="fade-up mt-9 flex flex-wrap gap-3" style={{ "--d": "560ms" } as React.CSSProperties}>
            <FireLink href="/menu" className="btn btn-fire" sparks={40}>
              Order online <IconArrow />
            </FireLink>
            <Link href="/visit" className="btn btn-glass">
              Plan your visit
            </Link>
          </div>

          <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
            <dl className="fade-up grid grid-cols-2 gap-x-8 gap-y-5 border-t border-white/15 pt-6 sm:grid-cols-4" style={{ "--d": "720ms" } as React.CSSProperties}>
              <div>
                <dt className="sr-only">Rating</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-serif text-3xl leading-none text-white">{rating.value}</span>
                  <Stars />
                </dd>
                <dd className="mt-1 text-xs font-semibold text-white/55">average rating</dd>
              </div>
              <div>
                <dt className="sr-only">Award</dt>
                <dd className="font-serif text-xl leading-tight text-white">{award.title}</dd>
                <dd className="mt-1 text-xs font-semibold text-white/55">
                  {award.by}, {award.date}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Yiros served</dt>
                <dd className="font-serif text-3xl leading-none text-white">1M+</dd>
                <dd className="mt-1 text-xs font-semibold text-white/55">yiros served (roughly)</dd>
              </div>
              <div>
                <dt className="sr-only">Established</dt>
                <dd className="font-serif text-3xl leading-none text-white">{site.established}</dd>
                <dd className="mt-1 text-xs font-semibold text-white/55">on Hindley Street</dd>
              </div>
            </dl>
            <div className="fade-up hidden xl:block" style={{ "--d": "900ms" } as React.CSSProperties}>
              <ShopPulse />
            </div>
          </div>
        </div>

        <a href="#story" className="scroll-cue absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 text-white/60 sm:block" aria-label="Scroll down">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      <Marquee />

      {/* ================= TODAY AT THE SHOP (live) ================= */}
      <TodayAtYiannis />

      {/* ====================== PHILOSOPHY + NUMBERS ====================== */}
      <section className="section whitewash overflow-hidden" id="story">
        <div className="container-x">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="h-xl text-blue-navy" data-reveal>
                Three meats. <br />
                One <span className="fire-text">fire</span>. <br />
                <span className="text-blue">No shortcuts.</span>
              </h2>
              <div data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
                <p className="lede mt-8 max-w-xl">
                  Yianni took over this corner in {site.established} and rebuilt it around one rule: charcoal or nothing. In
                  2023 the delicious. 100 named us Best Yiros Shop. In {site.renovated} we rebuilt the shop — and lit the
                  same fire.
                </p>
                <Link href="/story" className="mt-6 inline-flex items-center gap-2 font-bold text-blue hover:text-ember-deep">
                  Read our story <IconArrow />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[440px]" data-reveal="scale">
              <div className="pointer-events-none absolute inset-x-[26%] -top-[30%] h-[32%]">
                <EmberCanvas tone="light" rate={8} band={0.02} rise={40} turbulence={1.2} scale={1.1} />
              </div>
              <div className="arch-frame">
                <div className="arch aspect-[4/5]" data-tone="dark">
                  <Image
                    src="/images/saucing-pita.jpg"
                    alt="Garlic sauce going onto a loaded pita on the counter at Yianni's"
                    fill
                    sizes="(min-width: 1024px) 420px, 90vw"
                    className="arch__img object-[50%_60%]"
                  />
                  <div className="arch__shade" />
                  <EmberCanvas tone="dark" rate={34} band={0.14} motes={5} stokeOnPointer />
                </div>
              </div>
              <SpinBadge className="-left-4 bottom-[16%] scale-[0.82] sm:-left-12 sm:scale-100" />
            </div>
          </div>

          <dl className="mt-24 grid grid-cols-1 gap-x-6 gap-y-12 border-t border-line pt-12 sm:grid-cols-3">
            {houseNumbers.map((n, i) => (
              <div key={n.label} className="relative pl-5" data-reveal style={{ "--d": `${(i % 3) * 100}ms` } as React.CSSProperties}>
                <span aria-hidden="true" className="absolute left-0 top-2 h-[calc(100%-0.5rem)] w-px bg-line" />
                <span aria-hidden="true" className="absolute -left-[3px] top-2 h-[7px] w-[7px] rounded-full bg-ember shadow-[0_0_10px_2px_rgba(255,100,30,.6)]" />
                <dt className="text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-blue">{n.label}</dt>
                <dd className="mt-2 font-serif text-[clamp(2.3rem,5.2vw,4.6rem)] leading-[0.95] text-blue-navy">
                  <CountUp value={n.value} suffix={n.suffix} duration={n.value > 1000 ? 2200 : 1400} />
                </dd>
                <dd className="mt-3 max-w-[16rem] text-[0.92rem] leading-relaxed text-muted">{n.aside}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ========================= SIGNATURES ========================= */}
      <section className="section surface-porcelain overflow-hidden" aria-labelledby="sig-title">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div data-reveal>
              <p className="eyebrow">Signatures</p>
              <h2 id="sig-title" className="h-lg mt-5 max-w-2xl text-blue-navy">
                The ones people <span className="blue-text">come back for.</span>
              </h2>
            </div>
            <Link href="/menu" className="btn btn-ghost self-start md:self-auto" data-reveal>
              Full menu &amp; ordering <IconArrow />
            </Link>
          </div>

          <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {signatures.map((s, i) => (
              <article
                key={s.product.id}
                className="tile group flex w-[78vw] max-w-[330px] shrink-0 snap-start flex-col overflow-hidden sm:w-auto sm:max-w-none"
                data-reveal
                style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
              >
                <div className="relative aspect-[5/4] overflow-hidden sm:aspect-[4/5]">
                  <Image
                    src={s.img}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 78vw"
                    className="object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-char-900/70 via-transparent to-transparent" />
                  <div
                    className="absolute inset-x-0 bottom-0 h-1 opacity-0 shadow-[0_0_24px_6px_rgba(255,110,30,.55)] transition duration-500 group-hover:opacity-100"
                    style={{ background: "var(--fire)" }}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-blue backdrop-blur">
                    {s.tag}
                  </span>
                  <span className="absolute bottom-4 right-4 rounded-full bg-white px-3.5 py-1.5 font-serif text-xl leading-none text-blue-navy shadow-lg">
                    {priceRange(s.product).replace(" – ", "–")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-[1.8rem] leading-none text-blue-navy">{s.product.name}</h3>
                  <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-muted">{s.line}</p>
                  {s.product.dineInOnly ? (
                    <Link href="/menu#platters" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-blue hover:text-ember-deep">
                      Dine-in only — see platters <IconArrow />
                    </Link>
                  ) : (
                    <AddButton productId={s.product.id} label="Add to order" className="mt-5 self-start" />
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== THE FIRE ========================== */}
      <section className="surface-dark grain relative overflow-hidden" data-tone="dark" aria-labelledby="fire-title">
        <CoalBed className="!h-[clamp(140px,20vw,240px)]" />
        <EmberCanvas tone="dark" rate={30} band={0.12} motes={14} stokeOnPointer stokeOnScroll />
        <div className="container-x section relative z-10 !pb-[clamp(10rem,20vw,15rem)]">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="eyebrow" data-reveal>
                Why charcoal still wins
              </p>
              <h2 id="fire-title" className="h-xl mt-6 text-white" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
                Gas is faster. <br />
                Charcoal is <span className="fire-text">better</span>.
              </h2>
              <p className="lede mt-7 max-w-xl" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
                Charcoal gives you two things gas can&rsquo;t fake: a proper browned, crackling edge on the meat, and smoke that
                works its way into every layer. It&rsquo;s slower, fussier and far more work. That&rsquo;s the point.
              </p>
            </div>
            <div className="relative" data-reveal="scale">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[30px] shadow-[0_0_0_1px_rgba(255,255,255,.12),0_40px_80px_-30px_rgba(255,90,20,.45)]">
                <Image
                  src="/images/fire-plate.jpg"
                  alt="A plate of charcoal meat and salad in front of the spits turning over open flame"
                  fill
                  sizes="(min-width: 1024px) 560px, 92vw"
                  className="object-cover object-[50%_60%]"
                />
                <div className="firelight" />
                <div className="absolute inset-0 bg-gradient-to-t from-char-900/60 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-4 rounded-2xl border border-white/10 bg-char-800/90 px-5 py-4 backdrop-blur sm:-left-8">
                <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.22em] text-amber">On the banner</p>
                <p className="mt-1 font-serif text-2xl italic leading-tight text-white">&ldquo;If it&rsquo;s not charcoal&hellip;&rdquo;</p>
              </div>
            </div>
          </div>

          <ol className="mt-24 grid gap-4 sm:grid-cols-3">
            {fireSteps.map((s, i) => (
              <li key={s.n} className="char-card p-6 backdrop-blur-[2px]" data-reveal style={{ "--d": `${i * 110}ms` } as React.CSSProperties}>
                <span className="font-serif text-5xl leading-none text-amber/90">{s.n}</span>
                <h3 className="mt-5 text-lg font-extrabold text-white">{s.title}</h3>
                <p className="mt-2 text-[0.93rem] leading-relaxed text-white/60">{s.body}</p>
              </li>
            ))}
          </ol>

          {/* Three meats, three tiles, no ranking. The prices are the menu's
              own — including the lamb premium, said out loud. */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3" data-reveal>
            <div className="char-card flex items-center justify-between gap-3 px-5 py-4">
              <span className="font-serif text-2xl text-white">Chicken</span>
              <span className="text-sm font-bold text-white/60">from $15 · the everyday pick</span>
            </div>
            <div className="char-card flex items-center justify-between gap-3 px-5 py-4">
              <span className="font-serif text-2xl text-white">Pork</span>
              <span className="text-sm font-bold text-white/60">from $15 · no premium, no upsell</span>
            </div>
            <div className="char-card flex items-center justify-between gap-3 px-5 py-4">
              <span className="font-serif text-2xl text-white">Lamb</span>
              <span className="flex items-center gap-2 text-sm font-bold text-white/60">
                <HalalBadge /> from $17
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== BUILD IT · WIN IT ====================== */}
      <section className="section bg-white overflow-hidden" aria-labelledby="builder-title">
        <div className="container-x">
          <div className="max-w-2xl" data-reveal>
            <p className="eyebrow">The builder</p>
            <h2 id="builder-title" className="h-lg mt-5 text-blue-navy">
              Build your yiros. <span className="fire-text">Right here.</span>
            </h2>
            <p className="lede mt-5">
              Real menu, real prices. Pick your meat, take off any salad, choose your sauces, and add it to your order in one
              tap.
            </p>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-muted">
              <span className="text-ember-deep">1</span> Build it
              <span aria-hidden="true" className="text-line">—</span>
              <span className="text-ember-deep">2</span> Pick a time
              <span aria-hidden="true" className="text-line">—</span>
              <span className="text-ember-deep">3</span> Collect &amp; pay
            </p>
          </div>

          <div className="mt-12" data-reveal="scale">
            <YirosBuilder />
          </div>

          <div className="mt-24 grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div data-reveal>
              <p className="eyebrow">The wheel of Hindley</p>
              <h3 className="h-md mt-4 text-blue-navy">
                Can&rsquo;t decide? <span className="blue-text">Spin for it.</span>
              </h3>
              <p className="lede mt-5 max-w-md">
                Six house favourites. Spin, add it to your order, or spin again. No plate-smashing required.
              </p>
              <p className="mt-6 flex flex-wrap gap-3">
                <Link href="/menu" className="btn btn-ghost btn-sm">
                  Or just browse the menu <IconArrow />
                </Link>
              </p>
            </div>
            <div data-reveal="scale">
              <SpinForIt />
            </div>
          </div>
        </div>
      </section>

      {/* ======================== ORDER ONLINE ======================== */}
      <section className="section surface-porcelain" aria-labelledby="order-title">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div data-reveal>
              <p className="eyebrow">Order online</p>
              <h2 id="order-title" className="h-lg mt-5 text-blue-navy">
                Order ahead. <span className="fire-text">Skip</span> the queue.
              </h2>
              <p className="lede mt-5 max-w-lg">Pickup only. Pay at the counter, no card or app needed.</p>
            </div>
            <FireLink href="/menu" className="btn btn-fire self-start md:self-auto" data-reveal>
              Start your order <IconArrow />
            </FireLink>
          </div>

          <div className="mt-20 max-w-2xl" data-reveal>
            <p className="eyebrow">The usuals</p>
            <h3 className="h-md mt-4 text-blue-navy">
              Four orders that <span className="blue-text">never</span> go wrong. One tap each.
            </h3>
          </div>
          {/* Phones swipe through the four, like the signatures above, instead of scrolling past four tall cards. */}
          <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4">
            {usuals.map((u, i) => (
              <div
                key={u.name}
                className="w-[82vw] max-w-[340px] shrink-0 snap-start md:w-auto md:max-w-none"
                data-reveal
                style={{ "--d": `${i * 110}ms` } as React.CSSProperties}
              >
                <UsualCard usual={u} featured={i === 1} />
              </div>
            ))}
          </div>

          <div id="track" className="lookup-panel mt-20 scroll-mt-32" data-tone="dark" data-reveal="scale">
            <div className="grid items-center gap-8 p-7 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
              <div>
                <p className="eyebrow">Already sent one through?</p>
                <h3 className="mt-4 font-serif text-[clamp(1.7rem,2.8vw,2.3rem)] leading-tight text-white">
                  Track your <span className="fire-text">order.</span>
                </h3>
                <p className="lede mt-3 text-[0.95rem]">
                  Paste your order code to see where it&rsquo;s up to and how long the kitchen needs.
                </p>
              </div>
              <OrderLookup />
            </div>
          </div>
        </div>
      </section>

      {/* ============================ PAREA ============================ */}
      {(team.length > 0 || customers.length > 0) && (
      <section className="section bg-white" aria-labelledby="parea-title">
        <div className="container-x">
          <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <div data-reveal>
              <p className="eyebrow">Parea · our people</p>
              <h2 id="parea-title" className="h-lg mt-5 max-w-3xl text-blue-navy">
                The crew on the spit, and the <span className="blue-text">regulars</span> who keep coming back.
              </h2>
              <p className="mt-4 max-w-xl text-muted">
                More photos of the crew and our regulars are up on the{" "}
                <Link href="/parea" className="font-bold text-blue hover:text-blue-deep">
                  Parea page
                </Link>
                . Have a look — you might already be on the wall.
              </p>
            </div>
            <Link href="/parea" className="btn btn-ghost self-start lg:self-auto" data-reveal>
              Meet the parea <IconArrow />
            </Link>
          </div>
          <div className={`mt-14 grid gap-14 ${team.length && customers.length ? "lg:grid-cols-2 lg:gap-16" : ""}`}>
            {team.length > 0 && (
            <div>
              <p className="mb-6 flex items-center gap-3 text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-blue">
                <GreekKey tone="blue" className="!h-2 !w-12 opacity-60" /> The crew
              </p>
              <TeamGrid photos={team} limit={4} compact />
            </div>
            )}
            {customers.length > 0 && (
            <div>
              <p className="mb-6 flex items-center gap-3 text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-blue">
                <GreekKey tone="ember" className="!h-2 !w-12" /> The wall
              </p>
              <CustomerWall photos={customers} limit={4} compact />
            </div>
            )}
          </div>
        </div>
      </section>
      )}

      <Reviews />

      {/* =========================== CATERING =========================== */}
      <section className="section bg-white overflow-hidden" aria-labelledby="catering-title">
        <div className="container-x grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative" data-reveal="scale">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[30px] shadow-[0_0_0_1.5px_var(--blue),0_0_0_10px_#fff,0_0_0_11.5px_var(--line),0_40px_80px_-40px_rgba(11,50,120,.55)]">
              <Image src="/images/catering-spread.jpg" alt="Trays of charcoal meat, chips, salad and pita laid out for a group" fill sizes="(min-width: 1024px) 520px, 92vw" className="object-cover" />
            </div>
          </div>
          <div data-reveal>
            <p className="eyebrow">Catering</p>
            <h2 id="catering-title" className="h-lg mt-5 text-blue-navy">
              Catering, by the <span className="fire-text">tray</span>.
            </h2>
            <p className="lede mt-5 max-w-lg">
              Office lunches, birthdays, footy nights and family dinners. Trays of charcoal meat, salad, pita, chips and
              plenty of garlic sauce. Give us the date and headcount and we&rsquo;ll handle the rest. Like a Greek wedding,
              minus the 400 cousins.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/catering" className="btn btn-blue">
                Catering enquiry <IconArrow />
              </Link>
              <a href={site.phoneHref} className="btn btn-ghost">
                Call {site.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Faq maxItems={4} moreHref="/visit" />
      <FinalCta />
    </>
  );
}
