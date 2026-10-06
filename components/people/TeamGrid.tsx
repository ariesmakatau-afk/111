import type { WallPhoto } from "@/lib/content-store";

// Uploaded photos only, centred: 1 photo sits in the middle, 4 fill the row.
// No fixed columns, so a short wall never leaves empty space beside it.
const cell = (compact: boolean) => `w-[calc(50%-0.625rem)] ${compact ? "" : "sm:w-[calc(33.333%-0.84rem)] lg:w-[calc(25%-0.94rem)]"}`;

/** Staff portraits in arched frames. Only real uploads — never empty slots. */
export default function TeamGrid({ photos, limit = 4, compact = false }: { photos: WallPhoto[]; limit?: number; compact?: boolean }) {
  const list = photos.filter((p) => p.url).slice(0, limit);
  if (list.length === 0) return null;
  return (
    <ul className={`flex flex-wrap justify-center gap-5 ${compact ? "" : "lg:flex-nowrap"}`}>
      {list.map((p, i) => (
        <li key={p.id} className={cell(compact)} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
          <div className="arch-frame !p-2">
            <div className="arch aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name ? `${p.name}, ${p.caption}` : p.caption} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            </div>
          </div>
          {p.name && <p className="mt-4 text-center font-serif text-2xl leading-none text-blue-navy">{p.name}</p>}
          <p className="mt-1.5 text-center text-sm text-muted">{p.caption}</p>
        </li>
      ))}
    </ul>
  );
}
