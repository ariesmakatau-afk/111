import { IconFlame } from "./Icons";

const DEFAULT = [
  "Carved to order",
  "Real charcoal, never gas",
  "Garlic sauce made in the shop",
  "Lamb · Chicken · PORK — three spits, no ranking",
  "Late on Fridays & Saturdays",
  "Hindley Street since 2002",
];

export default function Marquee({ items = DEFAULT }: { items?: string[] }) {
  const row = (hidden: boolean) => (
    <div className="marquee__track" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <span key={t} className="flex items-center gap-10 whitespace-nowrap">
          <span className="font-serif text-[1.65rem] italic leading-none sm:text-[2.1rem]">{t}</span>
          <IconFlame className="h-5 w-5 text-amber drop-shadow-[0_0_8px_rgba(255,140,40,.9)]" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="surface-blue relative overflow-hidden py-5 sm:py-6" data-tone="dark">
      <div className="marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
