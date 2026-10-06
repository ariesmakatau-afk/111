import Image from "next/image";

/**
 * A roundel whose ring of text turns slowly, like the spit.
 * The label is symmetric ("A ✦ B ✦") and the textLength equals the circle's
 * exact circumference (2π·47 ≈ 295.31), so the ring closes seamlessly with
 * its two ✦ a hair's width apart — the old trailing space left an uneven
 * gap that made the medallion read off-centre.
 */
export default function SpinBadge({ className = "", text }: { className?: string; text?: string }) {
  const label = text ?? "Real charcoal ✦ Carved to order ✦";
  return (
    <div className={`spin-badge ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="spin-ring">
        <defs>
          <path id="spin-circle" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
        </defs>
        <text fontSize="9.4" fontWeight="800" fill="var(--blue)" style={{ textTransform: "uppercase" }}>
          <textPath href="#spin-circle" textLength="295.31" lengthAdjust="spacing">
            {label}
          </textPath>
        </text>
      </svg>
      <span className="relative block h-[62px] w-[62px] overflow-hidden rounded-full shadow-[0_0_0_2px_#fff,0_0_0_3.5px_var(--blue),0_0_24px_4px_rgba(255,110,30,.45)]">
        <Image src="/images/medallion-192.png" alt="" fill sizes="62px" className="object-cover" />
      </span>
    </div>
  );
}
