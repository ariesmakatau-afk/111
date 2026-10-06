import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  extras,
  formatMoney,
  lambSurchargeLabel,
  menuGroups,
  menuSearchText,
  menuTags,
  priceRange,
  sauces,
  SAUCE_PRICE,
  type ProductGroup,
} from "@/lib/menu";
import { groupPhotos, productPhotos } from "@/lib/menu-media";
import { site } from "@/lib/site";
import { isConfigured, readOrderingSettings } from "@/lib/content-store";
import PageHero from "@/components/sections/PageHero";
import MenuNav from "@/components/MenuNav";
import OpenStatus from "@/components/OpenStatus";
import AddButton from "@/components/order/AddButton";
import MenuFinder from "@/components/order/MenuFinder";
import HalalBadge from "@/components/HalalBadge";
import ShopNotice from "@/components/order/ShopNotice";
import OrderTicket from "@/components/order/OrderTicket";
import KitchenStrip from "@/components/widgets/KitchenStrip";
import { DealCard } from "@/components/Deal";
import { IconArrow, IconPhone } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Menu & online order",
  description:
    "Order charcoal yiros, AB Packs, Meat Packs, chips and drinks online for pickup from Yianni's, 270 Hindley Street, Adelaide. Full menu and prices.",
};

// The "online orders paused" switch in /admin shows up within 15 seconds.
export const revalidate = 15;

const food = menuGroups.filter((g) => !["coffee", "drinks"].includes(g.id));
const drinks = menuGroups.filter((g) => ["coffee", "drinks"].includes(g.id));

const navItems = [
  ...food.map((g) => ({ id: g.id, label: g.title })),
  { id: "extras", label: "Extras & sauces" },
  ...drinks.map((g) => ({ id: g.id, label: g.title })),
];

function Group({ g, index }: { g: ProductGroup; index: number }) {
  const photo = groupPhotos[g.id];
  return (
    <section id={g.id} data-menu-group={g.id} className="scroll-mt-40 border-t border-line py-12 first:border-t-0 first:pt-2">
      <div className="flex items-center gap-5" data-reveal>
        {photo && (
          <div className="relative hidden h-24 w-20 shrink-0 overflow-hidden rounded-[999px_999px_14px_14px] shadow-[0_0_0_1.5px_var(--blue),0_0_0_5px_#fff,0_0_0_6.5px_var(--line)] sm:block">
            <Image src={photo.src} alt={photo.alt} fill sizes="80px" className="object-cover" />
          </div>
        )}
        <div>
          <p className="text-sm font-extrabold tracking-widest text-ember">{String(index + 1).padStart(2, "0")}</p>
          <h2 className="h-md mt-1 text-blue-navy">{g.title}</h2>
          {g.blurb && <p className="mt-1.5 max-w-md text-muted">{g.blurb}</p>}
        </div>
      </div>

      <div className="mt-6 divide-y divide-line">
        {g.products.map((p, i) => {
          const lamb = lambSurchargeLabel(p);
          const thumb = productPhotos[p.id];
          return (
            <article
              key={p.id}
              data-menu-item={p.id}
              data-tags={menuTags(g.id, p).join(" ")}
              data-text={menuSearchText(p)}
              className="py-5"
              data-reveal
              style={{ "--d": `${i * 50}ms` } as React.CSSProperties}
            >
              <div className={`flex ${thumb ? "items-center" : "items-baseline"}`}>
                {thumb && (
                  <span className="relative mr-3 block h-11 w-11 shrink-0 overflow-hidden rounded-full shadow-[0_0_0_1.5px_var(--blue),0_0_0_3.5px_#fff,0_0_0_4.5px_var(--line)]">
                    <Image src={thumb.src} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                )}
                <h3 className="font-serif text-[1.8rem] leading-none text-blue-navy">{p.name}</h3>
                <span className="leader" aria-hidden="true" />
                <span className="price whitespace-nowrap">{priceRange(p)}</span>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.dineInOnly && <span className="tag">Dine-in only</span>}
                    {lamb && <span className="tag tag--fire">{lamb}</span>}
                    {p.meatChoice && <HalalBadge label="Halal lamb" />}
                    {p.freeSauces !== undefined && p.freeSauces > 0 && <span className="tag">{p.freeSauces} sauces included</span>}
                  </div>
                  {p.description && <p className="mt-2.5 max-w-lg text-[0.96rem] leading-relaxed text-muted">{p.description}</p>}
                  {p.sizes.length > 1 && (
                    <p className="mt-2 text-sm text-ink">
                      {p.sizes.map((s, k) => (
                        <span key={s.id}>
                          {k > 0 && <span className="mx-1.5 text-muted">·</span>}
                          {s.name} <b className="font-serif text-lg font-normal text-blue">{formatMoney(s.price)}</b>
                        </span>
                      ))}
                    </p>
                  )}
                  {p.variant && (
                    <p className="mt-2 max-w-lg text-[0.85rem] leading-relaxed text-muted">
                      <b className="text-blue-deep">{p.variant.label}: </b>
                      {p.variant.options.join(" · ")}
                    </p>
                  )}
                </div>
                {p.dineInOnly ? (
                  <span className="shrink-0 text-sm font-semibold text-muted">Order at the counter</span>
                ) : (
                  <AddButton productId={p.id} className="self-start sm:self-auto" />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default async function MenuPage() {
  const settings = isConfigured() ? await readOrderingSettings({ revalidate: 15 }) : { paused: false, message: "" };

  return (
    <>
      <PageHero
        compact
        crumb="Menu & order"
        title={
          <>
            <span className="hero-line">
              <span>Short menu.</span>
            </span>
            <span className="hero-line">
              <span style={{ "--d": "120ms" } as React.CSSProperties}>
                <span className="fire-text">No wrong</span> answers.
              </span>
            </span>
          </>
        }
        lede="Tap Add, pick your meat and sauces, and send it through. It'll be ready at your pickup time. Pay at the counter."
      >
        <div className="fade-up mt-6 flex flex-wrap items-center gap-3" style={{ "--d": "380ms" } as React.CSSProperties}>
          <OpenStatus />
          <a href={site.phoneHref} className="btn btn-glass btn-sm">
            <IconPhone /> {site.phone}
          </a>
          <a href={site.uberEats} target="_blank" rel="noopener" className="btn btn-glass btn-sm">
            Delivery on Uber Eats
          </a>
        </div>
      </PageHero>

      <KitchenStrip />

      <MenuNav items={navItems} />

      {settings.paused && (
        <div className="border-b border-ember/25 bg-[#fff1e8]">
          <p className="container-x py-3 text-sm font-semibold text-ember-deep">{settings.message}</p>
        </div>
      )}

      <div className="container-x grid gap-10 pb-24 pt-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <div>
          <DealCard />
          <div className="space-y-5 pt-8">
            <MenuFinder />
            <ShopNotice />
          </div>
          {food.map((g, i) => (
            <Group key={g.id} g={g} index={i} />
          ))}

          <section id="extras" className="scroll-mt-40 border-t border-line py-12">
            <div data-reveal>
              <p className="text-sm font-extrabold tracking-widest text-ember">{String(food.length + 1).padStart(2, "0")}</p>
              <h2 className="h-md mt-1 text-blue-navy">Extras &amp; sauces</h2>
              <p className="mt-1.5 max-w-md text-muted">
                Add these while you build an item. You&rsquo;ll only see the ones that fit.
              </p>
            </div>
            <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
              {extras.map((x) => (
                <li key={x.id} className="flex items-baseline border-b border-line py-3" data-reveal>
                  <span className="font-semibold text-ink">{x.name}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="price !text-xl">+{formatMoney(x.price)}</span>
                </li>
              ))}
            </ul>
            <div className="tile mt-8 p-6 hover:!translate-y-0" data-reveal>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-serif text-[1.9rem] leading-none text-blue-navy">Sauces</h3>
                <p className="text-sm font-semibold text-muted">
                  2 included · 3 on an AB Pack · then {formatMoney(SAUCE_PRICE)} each
                </p>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2">
                {sauces.map((s) => (
                  <li
                    key={s}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${
                      s === "Garlic" ? "text-[#1d0700] shadow-[0_6px_16px_-6px_rgba(255,90,20,.8)]" : "bg-mist text-blue-deep"
                    }`}
                    style={s === "Garlic" ? { background: "var(--fire-btn)" } : undefined}
                  >
                    {s}
                    {s === "Garlic" && " · made in-house"}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {drinks.map((g, i) => (
            <Group key={g.id} g={g} index={food.length + 1 + i} />
          ))}

          <div className="surface-blue mt-6 flex flex-col items-start justify-between gap-5 rounded-[26px] p-7 sm:flex-row sm:items-center" data-tone="dark" data-reveal>
            <div>
              <p className="eyebrow !text-white/85">Catering</p>
              <p className="mt-2 font-serif text-[2rem] leading-tight text-white">Feeding the whole office? The whole family?</p>
            </div>
            <Link href="/catering" className="btn btn-fire shrink-0">
              Catering enquiry <IconArrow />
            </Link>
          </div>
        </div>

        <aside className="hidden lg:block" aria-label="Your order">
          <div className="sticky top-[150px]">
            <OrderTicket />
          </div>
        </aside>
      </div>
    </>
  );
}
