/**
 * The meander band. Drawn with a CSS mask, so the key takes any fill —
 * Hellenic blue on white, or a heated ember gradient on charcoal.
 */
const tones = {
  blue: "greek-key--blue",
  ember: "greek-key--ember",
  white: "greek-key--white",
  faint: "greek-key--faint",
} as const;

export default function GreekKey({
  tone = "blue",
  className = "",
}: {
  tone?: keyof typeof tones;
  className?: string;
}) {
  // A <span> (display: block) so it's valid inside paragraphs and headings too.
  return <span aria-hidden="true" className={`greek-key block ${tones[tone]} ${className}`} />;
}
