import type { Metadata } from "next";
import Image from "next/image";
import { parea } from "@/lib/site";
import { readPhotos } from "@/lib/content-store";
import PageHero from "@/components/sections/PageHero";
import FinalCta from "@/components/sections/FinalCta";
import TeamGrid from "@/components/people/TeamGrid";
import CustomerWall from "@/components/people/CustomerWall";
import GreekKey from "@/components/GreekKey";

export const metadata: Metadata = {
  title: "Parea — our people",
  description: "The crew on the spit and the regulars who keep coming back — the people of Yianni's on Hindley Street.",
  alternates: { canonical: "/parea" },
};

// New uploads from /admin appear within a minute, no redeploy.
export const revalidate = 30;

export default async function PareaPage() {
  const [team, customers] = await Promise.all([readPhotos("team", { revalidate: 30 }), readPhotos("customers", { revalidate: 30 })]);
  return (
    <>
      <PageHero
        crumb="Parea"
        title={
          <>
            <span className="hero-line">
              <span>The table,</span>
            </span>
            <span className="hero-line">
              <span style={{ "--d": "120ms" } as React.CSSProperties}>
                not the <span className="fire-text">food</span>.
              </span>
            </span>
          </>
        }
        lede="Your people — the ones who know your order and hold a seat without being asked. English borrowed yiros and stopped there. It never took the word for who you eat it with."
      />

      {/* Each section only exists once it has photos — no empty boxes on the site. */}
      {team.length > 0 && (
      <section className="section bg-white">
        <div className="container-x">
          <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <div data-reveal>
              <p className="eyebrow">The crew</p>
              <h2 className="h-lg mt-5 max-w-2xl text-blue-navy">
                The hands on the <span className="fire-text">spit</span>.
              </h2>
            </div>
            <p className="lede max-w-sm" data-reveal>
              Same faces, most days of the week. Say hello when you&rsquo;re in — they probably already know your order.
            </p>
          </div>
          <div className="mt-12">
            <TeamGrid photos={team} />
          </div>
        </div>
      </section>
      )}

      {customers.length > 0 && (
      <section className="section surface-porcelain overflow-hidden">
        <div className="container-x">
          <GreekKey tone="blue" className="!h-2.5 opacity-40" />
          <div className="mt-12 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <div data-reveal>
              <p className="eyebrow">The wall</p>
              <h2 className="h-lg mt-5 max-w-2xl text-blue-navy">
                Our <span className="blue-text">parea</span>.
              </h2>
            </div>
            <p className="lede max-w-sm" data-reveal>
              Students at closing time, tradies at noon, families who drive past three other shops to get here. This wall is
              theirs.
            </p>
          </div>
          <div className="mt-14">
            <CustomerWall photos={customers} />
          </div>
        </div>
      </section>
      )}

      <section className="section bg-white">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[auto_1fr]">
          <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full shadow-[0_0_0_2px_var(--blue),0_0_0_10px_#fff,0_0_0_11.5px_var(--line)]" data-reveal="scale">
            <Image src="/images/medallion.png" alt="The Yianni's medallion" fill sizes="160px" />
          </div>
          <div data-reveal>
            <p className="font-serif text-[clamp(3.5rem,8vw,6rem)] italic leading-none text-blue">{parea.word}</p>
            <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.24em] text-ember-deep">{parea.pronunciation} · noun</p>
            <p className="lede mt-4 max-w-2xl">
              Want your crew on the wall? Ask at the counter next time you&rsquo;re in — we&rsquo;ll take the photo, you pick the
              caption.
            </p>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
