"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site, fullAddress } from "@/lib/site";
import Logo from "./Logo";
import OpenStatus from "./OpenStatus";
import BoundaryCountdown from "./widgets/BoundaryCountdown";
import FireLink from "./FireLink";
import EmberCanvas from "./fire/EmberCanvas";
import { useCart } from "./order/CartProvider";
import CoalBed from "./fire/CoalBed";
import { IconArrow, IconClose, IconPhone } from "./Icons";

export default function Header() {
  const pathname = usePathname();
  const { count, pulse } = useCart();
  const [stuck, setStuck] = useState(false);
  const [overDark, setOverDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setStuck(window.scrollY > 24);
      const darkHero = document.querySelector<HTMLElement>("[data-header-dark]");
      setOverDark(!!darkHero && window.scrollY < darkHero.offsetHeight - 90);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const light = overDark && !stuck;

  return (
    <>
      <header className={`site-header ${stuck ? "is-stuck" : ""} ${light ? "is-dark" : ""}`}>
        <div className="topbar bg-blue-navy text-white" data-tone="dark">
          <div className="container-x flex h-10 items-center justify-between gap-4 text-[0.78rem]">
            <OpenStatus compact className="!hidden !border-0 !bg-transparent !p-0 !text-[0.78rem] !font-semibold sm:!inline-flex" />
            <span className="flex items-center gap-1.5 font-semibold text-white/80 sm:hidden">
              <span aria-hidden className="text-amber">✦</span> {site.address.street}
            </span>
            <span className="hidden items-center gap-2 text-white/70 md:flex">
              <span aria-hidden className="text-amber">✦</span> Real charcoal, carved to order · {fullAddress}
            </span>
            <span className="flex items-center gap-4">
              <BoundaryCountdown
                render={(label, urgent) => (
                  <span className={`hidden items-center gap-2 font-bold md:flex ${urgent ? "text-amber" : "text-white/60"}`} role="timer">
                    <span aria-hidden="true" className="text-amber/60">✦</span> {urgent ? "Last call — " : ""}
                    {label}
                  </span>
                )}
              />
              <a href={site.phoneHref} className="flex items-center gap-2 font-semibold text-white/90 hover:text-amber">
                <IconPhone className="h-3.5 w-3.5" /> {site.phone}
              </a>
            </span>
          </div>
        </div>

        <div className="container-x nav-row flex items-center justify-between gap-6">
          <Logo tone={light ? "white" : "ink"} />

          <nav aria-label="Primary" className="hidden items-center gap-7 whitespace-nowrap xl:flex">
            {nav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={site.phoneHref}
              className={`btn btn-sm hidden sm:inline-flex ${light ? "btn-glass" : "btn-ghost"}`}
            >
              <IconPhone /> Call
            </a>
            <FireLink href="/menu" className="btn btn-fire btn-sm">
              Order
              {count > 0 && (
                <span key={pulse} className="badge-bump grid h-5 min-w-5 place-items-center rounded-full bg-[#1d0700] px-1 text-[0.7rem] text-gold">
                  {count}
                </span>
              )}
            </FireLink>
            <button
              type="button"
              className={`ml-1 grid h-11 w-11 place-items-center rounded-full border xl:hidden ${
                light ? "border-white/25 text-white" : "border-line text-blue-navy"
              }`}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="drawer"
              onClick={() => setOpen(true)}
            >
              <span className="flex w-5 flex-col gap-[5px]">
                <span className="h-[2px] w-full rounded bg-current" />
                <span className="h-[2px] w-3/4 rounded bg-current" />
                <span className="h-[2px] w-full rounded bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer: a charcoal room lit from the coals up. */}
      <div id="drawer" className={`drawer ${open ? "is-open" : ""}`} aria-hidden={!open} data-tone="dark">
        <div className="surface-dark grain absolute inset-0 overflow-hidden">
          <CoalBed />
          {open && <EmberCanvas tone="dark" rate={30} band={0.1} motes={10} />}
          <div className="relative z-10 flex h-full flex-col overflow-y-auto overscroll-contain">
            <div className="container-x flex h-[76px] shrink-0 items-center justify-between">
              <Logo tone="white" />
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="container-x mt-4 flex shrink-0 flex-col">
              {[{ href: "/", label: "Home" }, ...nav].map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  tabIndex={open ? 0 : -1}
                  className="drawer__link group flex items-baseline gap-4 border-b border-white/10 py-4 text-white"
                  style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
                  aria-current={pathname === l.href ? "page" : undefined}
                >
                  <span className="w-7 text-xs font-bold tracking-widest text-amber">0{i + 1}</span>
                  <span className="font-serif text-[2.6rem] leading-none group-hover:italic">{l.label}</span>
                  <IconArrow className="ml-auto h-5 w-5 self-center text-white/40 transition group-hover:translate-x-1 group-hover:text-amber" />
                </Link>
              ))}
            </nav>
            <div className="container-x mt-8 flex shrink-0 flex-col gap-3 pb-32">
              <OpenStatus />
              <Link href="/menu" tabIndex={open ? 0 : -1} className="btn btn-fire w-full">
                Order online for pickup
              </Link>
              <a href={site.phoneHref} tabIndex={open ? 0 : -1} className="btn btn-glass w-full">
                <IconPhone /> Call {site.phone}
              </a>
              <a
                href={site.uberEats}
                tabIndex={open ? 0 : -1}
                target="_blank"
                rel="noopener"
                className="btn btn-glass w-full"
              >
                Delivery on Uber Eats
              </a>
              <p className="mt-2 text-sm text-white/55">{fullAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
