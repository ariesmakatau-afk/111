import Link from "next/link";
import { fullAddress, hours, nav, site, directionsHref } from "@/lib/site";
import { formatRange } from "@/lib/hours";
import GreekKey from "./GreekKey";
import Logo from "./Logo";
import { IconFacebook, IconInstagram, IconPhone, IconPin } from "./Icons";
import ShopTicker from "./widgets/ShopTicker";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-blue-navy text-white" data-tone="dark">
      <GreekKey tone="ember" className="!h-3 opacity-90" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,110,30,.22),transparent_70%)]"
      />
      <div className="container-x relative grid gap-12 pb-10 pt-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo tone="white" />
          <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-white/60">
            Charcoal-spit yiros on Hindley Street since {site.established}. Dine in, take away or order ahead. Kali orexi.
          </p>
          <div className="mt-6 flex gap-2.5">
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition hover:border-amber hover:text-amber"
            >
              <IconInstagram className="h-[18px] w-[18px]" />
            </a>
            <a
              href={site.facebook}
              target="_blank"
              rel="noopener"
              aria-label="Facebook"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition hover:border-amber hover:text-amber"
            >
              <IconFacebook className="h-[18px] w-[18px]" />
            </a>
            <a
              href={site.phoneHref}
              aria-label="Call the shop"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition hover:border-amber hover:text-amber"
            >
              <IconPhone className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-amber">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-white/75">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            {nav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-amber">Hours</h2>
          <ShopTicker className="mt-3" />
          <ul className="mt-4 space-y-1.5 text-[0.9rem] text-white/75">
            {hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.short}</span>
                <span className="tabular-nums text-white/60">{formatRange(h.open, h.close)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-amber">Find us</h2>
          <ul className="mt-4 space-y-3 text-white/75">
            <li>
              <a href={directionsHref} target="_blank" rel="noopener" className="flex gap-2.5 hover:text-white">
                <IconPin className="mt-1 h-4 w-4 shrink-0 text-amber" />
                <span>{fullAddress}</span>
              </a>
            </li>
            <li>
              <a href={site.phoneHref} className="flex gap-2.5 hover:text-white">
                <IconPhone className="mt-1 h-4 w-4 shrink-0 text-amber" />
                {site.phone}
              </a>
            </li>
            <li>
              <Link href="/menu" className="underline decoration-white/25 underline-offset-4 hover:text-white">
                Order online for pickup
              </Link>
            </li>
            <li>
              <a href={site.uberEats} target="_blank" rel="noopener" className="underline decoration-white/25 underline-offset-4 hover:text-white">
                Delivery on Uber Eats
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-x relative">
        <div aria-hidden="true" className="footer-mark -mb-[0.12em] select-none whitespace-nowrap">
          Yianni&rsquo;s
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Yianni&rsquo;s Hellenic Yiros on Hindley Street. Dine in · Takeaway · Delivery.</p>
          <p>
            Prices may change. The board in the shop has the final say, like yia-yia. ·{" "}
            <Link href="/staff" className="hover:text-white">
              Staff
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
