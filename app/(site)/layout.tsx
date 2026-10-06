import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import SparkLayer from "@/components/fire/SparkLayer";
import FuseProgress from "@/components/FuseProgress";
import BackToTop from "@/components/BackToTop";
import StructuredData from "@/components/StructuredData";
import { CartProvider } from "@/components/order/CartProvider";
import CartToast from "@/components/order/CartToast";
import Customiser from "@/components/order/Customiser";
import Checkout from "@/components/order/Checkout";
import CartBar from "@/components/order/CartBar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <StructuredData />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-blue focus:px-5 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      <FuseProgress />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Customiser />
      <Checkout />
      <CartBar />
      <CartToast />
      <BackToTop />
      <SparkLayer />
      <Reveal />
    </CartProvider>
  );
}
