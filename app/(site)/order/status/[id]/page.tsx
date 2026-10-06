import type { Metadata } from "next";
import OrderTracker from "@/components/order/OrderTracker";
import CoalBed from "@/components/fire/CoalBed";
import EmberCanvas from "@/components/fire/EmberCanvas";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="surface-dark grain relative min-h-[100svh] overflow-hidden" data-tone="dark" data-header-dark>
      <CoalBed />
      <EmberCanvas tone="dark" rate={26} band={0.12} motes={10} />
      <div className="container-x relative z-10 flex justify-center pb-44 pt-40">
        <OrderTracker id={id} />
      </div>
    </section>
  );
}
