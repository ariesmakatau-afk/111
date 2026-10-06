import Link from "next/link";
import CoalBed from "@/components/fire/CoalBed";
import EmberCanvas from "@/components/fire/EmberCanvas";

export default function NotFound() {
  return (
    <section className="surface-dark grain relative flex min-h-[100svh] items-center overflow-hidden" data-tone="dark" data-header-dark>
      <CoalBed />
      <EmberCanvas tone="dark" rate={38} band={0.12} motes={12} stokeOnPointer />
      <div className="container-x relative z-10 pb-40 pt-40 text-center">
        <p className="eyebrow justify-center">Error 404</p>
        <h1 className="h-xl mx-auto mt-6 max-w-3xl text-white">
          This page went up in <span className="fire-text">smoke</span>.
        </h1>
        <p className="lede mx-auto mt-6 max-w-md">The spit&rsquo;s still turning, though. Let&rsquo;s get you back to it.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-fire">
            Back home
          </Link>
          <Link href="/menu" className="btn btn-glass">
            See the menu
          </Link>
        </div>
      </div>
    </section>
  );
}
