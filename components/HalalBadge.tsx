import { halal } from "@/lib/site";

/** A compact sticker shown only alongside lamb or lamb options. */
export default function HalalBadge({
  className = "",
  label = halal.label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className={`halal-sticker ${className}`.trim()} title="Lamb is halal">
      {label}
    </span>
  );
}
