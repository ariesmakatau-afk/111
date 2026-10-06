"use client";

import { useEffect, useState } from "react";
import { IconClose } from "../Icons";

const CHIPS = [
  { tag: "all", label: "Everything" },
  { tag: "cheap", label: "Under $15" },
  { tag: "meat", label: "Meat-forward" },
  { tag: "vegie", label: "Vegie" },
  { tag: "late", label: "Late-night fuel" },
  { tag: "crew", label: "Feeds a crew" },
  { tag: "drinks", label: "Coffee & drinks" },
];

/**
 * Search + one-tap filters for the menu board. It works by toggling classes
 * on the server-rendered list (articles carry data-tags / data-text), so the
 * whole menu is in the HTML for readers and crawlers regardless of JS.
 */
export default function MenuFinder() {
  const [tag, setTag] = useState("all");
  const [q, setQ] = useState("");
  const [stats, setStats] = useState<{ shown: number; total: number } | null>(null);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-menu-item]"));
    const norm = q.trim().toLowerCase();
    let shown = 0;
    items.forEach((el) => {
      const tags = (el.dataset.tags ?? "").split(" ");
      const okTag = tag === "all" || tags.includes(tag);
      const okQ = !norm || (el.dataset.text ?? "").includes(norm);
      const show = okTag && okQ;
      el.classList.toggle("is-hidden-item", !show);
      if (show) shown++;
    });
    document.querySelectorAll<HTMLElement>("[data-menu-group]").forEach((g) => {
      const any = g.querySelector("[data-menu-item]:not(.is-hidden-item)");
      g.classList.toggle("is-hidden-item", !any);
    });
    setStats({ shown, total: items.length });
  }, [tag, q]);

  const filtered = stats ? stats.shown !== stats.total : false;

  return (
    <div className="tile finder p-5 sm:p-6" data-reveal>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="finder__search flex-1 lg:max-w-md">
          <span className="sr-only">Search the menu</span>
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the board — “garlic”, “AB”, “coffee”…"
            className="w-full border-0 bg-transparent text-[1rem] text-ink placeholder:text-muted/70 focus:outline-none"
          />
        </label>

        <div className="flex items-center gap-3 overflow-x-auto">
          {stats && (
            <span className="shrink-0 text-[0.78rem] font-bold tabular-nums text-muted" aria-live="polite">
              {filtered ? `${stats.shown} of ${stats.total}` : `${stats.total} items`}
            </span>
          )}
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setTag("all");
                setQ("");
              }}
              className="btn btn-ghost btn-sm !min-h-[36px] shrink-0 !px-3 !text-[0.78rem]"
            >
              <IconClose className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter the menu">
        {CHIPS.map((c) => (
          <button key={c.tag} type="button" className="chip !min-h-[38px] !px-4 !text-[0.82rem]" aria-pressed={tag === c.tag} onClick={() => setTag(c.tag)}>
            {c.label}
          </button>
        ))}
      </div>

      {stats && stats.shown === 0 && (
        <p className="mt-4 rounded-2xl bg-[#fff1e8] px-5 py-4 text-sm font-semibold text-ember-deep" role="status">
          Nothing on the board matches that. Try <b>lamb</b>, <b>chips</b>, <b>coffee</b> — or clear the filters; the kitchen&rsquo;s offer doesn&rsquo;t.
        </p>
      )}
    </div>
  );
}
