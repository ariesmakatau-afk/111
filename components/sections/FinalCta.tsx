import Link from "next/link";
import { site } from "@/lib/site";
import CoalBed from "../fire/CoalBed";
import EmberCanvas from "../fire/EmberCanvas";
import FireLink from "../FireLink";
import GreekKey from "../GreekKey";
import { IconArrow, IconPhone } from "../Icons";

export default function FinalCta({
  eyebrow = "Come hungry",
  title = (
    <>
      The coals are <span className="fire-text">already</span> going.
    </>
  ),
  body = "270 Hindley Street. Walk in, or order ahead and skip the queue. Ela!",
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  body?: string;
}) {
  return (
    <section className="surface-dark grain relative overflow-hidden" data-tone="dark">
      <GreekKey tone="ember" className="relative z-10 !h-3 opacity-80" />
      <CoalBed className="!h-[clamp(150px,22vw,260px)]" />
      <EmberCanvas tone="dark" rate={44} band={0.14} motes={16} stokeOnPointer stokeOnScroll />
      <div className="container-x relative z-10 flex min-h-[78svh] flex-col items-center justify-center pb-[22vh] pt-24 text-center">
        <p className="eyebrow" data-reveal>
          {eyebrow}
        </p>
        <h2 className="h-xl mt-6 max-w-4xl text-white" data-reveal style={{ "--d": "100ms" } as React.CSSProperties}>
          {title}
        </h2>
        <p className="lede mt-6 max-w-xl" data-reveal style={{ "--d": "200ms" } as React.CSSProperties}>
          {body}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3" data-reveal style={{ "--d": "300ms" } as React.CSSProperties}>
          <FireLink href="/menu" className="btn btn-fire" sparks={40}>
            Order online <IconArrow />
          </FireLink>
          <a href={site.phoneHref} className="btn btn-glass">
            <IconPhone /> {site.phone}
          </a>
          <Link href="/visit" className="btn btn-glass">
            Plan your visit
          </Link>
        </div>
      </div>
    </section>
  );
}
