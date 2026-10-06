"use client";

import { useEffect, useRef, useState } from "react";

/** Sticky category bar with scrollspy; keeps the active pill in view. */
export default function MenuNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    // Above the first section, the first pill is the right one.
    const onScroll = () => {
      if (els[0] && window.scrollY + window.innerHeight * 0.45 < els[0].offsetTop) setActive(items[0].id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [items]);

  useEffect(() => {
    const el = track.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (el && track.current) {
      const t = track.current;
      t.scrollTo({ left: el.offsetLeft - t.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
    }
  }, [active]);

  return (
    <nav aria-label="Menu sections" className="sticky top-[76px] z-40 border-b border-line bg-white/85 backdrop-blur-xl">
      <div ref={track} className="container-x flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            data-id={i.id}
            aria-current={active === i.id ? "true" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              active === i.id
                ? "bg-blue text-white shadow-[0_8px_20px_-10px_rgba(20,80,180,.9)]"
                : "text-muted hover:bg-mist hover:text-blue-deep"
            }`}
          >
            {i.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
