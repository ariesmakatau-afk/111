import { award, directionsHref, faqs, hours, site } from "@/lib/site";
import { menuGroups } from "@/lib/menu";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const money = (n: number) => n.toFixed(2);

/**
 * JSON-LD for the public site only (mounted from the (site) layout, so the
 * staff areas stay out of search engines' structured data). Restaurant,
 * the full Menu with per-size offers, and the FAQ that the pages actually
 * render — everything derived from lib/site.ts + lib/menu.ts, nothing new.
 */
export default function StructuredData() {
  const restaurant = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: site.name,
    image: `${site.url}/images/og.jpg`,
    logo: `${site.url}/images/medallion.png`,
    url: site.url,
    hasMap: directionsHref,
    telephone: site.phoneIntl,
    email: site.email,
    servesCuisine: ["Greek", "Yiros", "Souvlaki"],
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.suburb,
      addressRegion: site.address.state,
      postalCode: site.address.postcode,
      addressCountry: site.address.country,
    },
    openingHoursSpecification: hours.map((h, i) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days[i],
      opens: hhmm(h.open),
      closes: hhmm(h.close),
    })),
    sameAs: [site.instagram, site.facebook],
    hasMenu: `${site.url}/menu`,
    acceptsReservations: false,
    award: `${award.title} — ${award.by}, ${award.date}`,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Wheelchair accessible", value: true },
      { "@type": "LocationFeatureSpecification", name: "Takeaway", value: true },
      { "@type": "LocationFeatureSpecification", name: "Online ordering for pickup", value: true },
    ],
    potentialAction: [
      {
        "@type": "OrderAction",
        target: `${site.url}/menu`,
        deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModePickUp",
      },
      {
        "@type": "ReserveAction",
        target: `${site.url}/catering`,
        name: "Catering enquiry",
      },
    ],
  };

  const menu = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Yianni's menu",
    url: `${site.url}/menu`,
    inLanguage: "en-AU",
    hasMenuSection: menuGroups.map((g) => ({
      "@type": "MenuSection",
      name: g.title,
      description: g.blurb,
      hasMenuItem: g.products.map((p) => ({
        "@type": "MenuItem",
        name: p.name,
        description: p.description,
        suitableForDiet: ["falafel-yiros", "veggie-roll"].includes(p.id) ? "https://schema.org/Vegetarian" : undefined,
        offers: p.sizes.map((s) => ({
          "@type": "Offer",
          name: s.name,
          price: money(s.price),
          priceCurrency: "AUD",
          availability: "https://schema.org/InStock",
          url: `${site.url}/menu#${g.id}`,
        })),
      })),
    })),
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurant) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menu) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
