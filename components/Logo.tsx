import Image from "next/image";
import Link from "next/link";

export default function Logo({ tone = "ink", className = "" }: { tone?: "ink" | "white"; className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-3 ${className}`} aria-label="Yianni's Hellenic Yiros — home">
      <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-full shadow-[0_0_0_1.5px_var(--blue),0_6px_16px_-6px_rgba(11,50,120,.6)] transition-transform duration-700 group-hover:rotate-[20deg]">
        <Image src="/images/medallion-192.png" alt="" fill sizes="44px" className="object-cover" priority />
      </span>
      <span className="leading-none">
        <span className={`block font-serif text-[1.7rem] leading-[0.9] ${tone === "white" ? "text-white" : "text-blue-navy"}`}>
          Yianni&rsquo;s
        </span>
        <span
          className={`mt-1 block text-[0.6rem] font-extrabold uppercase tracking-[0.26em] ${
            tone === "white" ? "text-white/60" : "text-blue"
          }`}
        >
          Hellenic Yiros<span className="hidden sm:inline"> · Hindley St</span>
        </span>
      </span>
    </Link>
  );
}
