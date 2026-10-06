// lib/site.ts
//
// Every real-world fact the site states lives here: address, phone, hours,
// links, reviews. Copy elsewhere can be written freely, but a fact that
// isn't in this file shouldn't appear on the site.

export const site = {
  name: "Yianni's Hellenic Yiros",
  shortName: "Yianni's",
  tagline: "Real charcoal. Carved to order. Hindley Street since 2002.",
  // Set once the domain is registered — used for canonical URLs & sitemap.
  url: "https://yiannisonhindley.com.au",
  address: {
    street: "270 Hindley Street",
    suburb: "Adelaide",
    state: "SA",
    postcode: "5000",
    country: "AU",
  },
  phone: "(08) 8212 5552",
  phoneIntl: "+61 8 8212 5552",
  phoneHref: "tel:+61882125552",
  email: "yiannisyiros2020@gmail.com",
  facebook: "https://www.facebook.com/share/19LY4HbBXJ/?mibextid=wwXIfr",
  instagram: "https://www.instagram.com/yiannisyiroshindley",
  uberEats:
    "https://www.ubereats.com/au/store/yiannis-on-hindley/_NoeJbsUQAyXKfiOujUcfw",
  // A yiros shop has stood on this corner for nearly fifty years. Yianni took
  // it over and rebranded it around 2002 (the shopfront reads EST-2002).
  established: 2002,
  renovated: 2025,
};

/** Client-confirmed: the 2025 renovation — what changed, and what didn't. */
export const renovation = {
  year: 2025,
  new: ["Counter", "Floor", "Wheelchair access", "Spit", "Fryer"],
  same: ["Staff", "Fire", "Recipe", "Care in every yiros"],
};

/** Client-confirmed: average review rating. */
export const rating = { value: 4.7, outOf: 5 };

/** Client-confirmed: delicious. 100, November 2023. */
export const award = {
  title: "Best Yiros Shop",
  by: "delicious. 100",
  date: "November 2023",
};

/**
 * The landing-page background. Drop the looping spit video into
 * /public/video/spits.mp4 (ideally a spits.webm alongside) and it takes
 * over the hero once it can play smoothly — until the file exists, the
 * poster shows and nothing looks broken.
 * Best results: 1920×1080, 8–15 seconds, seamless loop, no audio, under 8MB.
 */
export const heroVideo: { src: string | null; webm: string | null; poster: string; posterMobile: string } = {
  src: "/video/spits.mp4",
  webm: null, // e.g. "/video/spits.webm"
  poster: "/images/lamb-plate.jpg",
  // Phones get a portrait photo: a wide one cropped to a tall screen shows only a sliver.
  posterMobile: "/images/meat-pack.jpg",
};

/** Client-confirmed: only the lamb is claimed as halal; show it as a compact sticker. */
export const halal = {
  label: "Halal",
};

export const fullAddress = `${site.address.street}, ${site.address.suburb} ${site.address.state} ${site.address.postcode}`;

export const mapsQuery = encodeURIComponent(`Yianni's Hellenic Yiros, ${fullAddress}`);
export const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
export const mapEmbedSrc = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;

/**
 * Trading hours, in minutes after midnight, Adelaide time.
 * Index 0 = Monday. Client-confirmed.
 */
export const hours: { day: string; short: string; open: number; close: number }[] = [
  { day: "Monday", short: "Mon", open: 9 * 60, close: 15 * 60 + 30 },
  { day: "Tuesday", short: "Tue", open: 9 * 60, close: 20 * 60 },
  { day: "Wednesday", short: "Wed", open: 9 * 60, close: 20 * 60 },
  { day: "Thursday", short: "Thu", open: 9 * 60, close: 20 * 60 },
  { day: "Friday", short: "Fri", open: 9 * 60, close: 22 * 60 + 30 },
  { day: "Saturday", short: "Sat", open: 9 * 60, close: 22 * 60 + 30 },
  { day: "Sunday", short: "Sun", open: 9 * 60, close: 20 * 60 },
];

export const TIMEZONE = "Australia/Adelaide";

/** Client-confirmed reviews (Tripadvisor + Google), lightly trimmed. */
export const reviews = [
  {
    quote:
      "An institution for a long time. Charcoal-roasted spit meat — best yiros in town. Highly recommend the pork and lamb, no lettuce, extra garlic sauce and onion.",
    author: "brianhissy",
    source: "Tripadvisor",
    date: "April 2022",
  },
  {
    quote:
      "Lamb yiros were sensational and fully loaded with so much meat. Super delicious — the only ones as nice were when travelling around Greece.",
    author: "David Maddison",
    source: "Google",
    date: "February 2025",
  },
  {
    quote:
      "Awesome yiros, flavoured over the charcoal grill. Best I've had without a doubt. Got the lot and so worth it — good value even for the mini. Service was pretty quick considering the crowd.",
    author: "Andrew Jones",
    source: "Google",
    date: "January 2025",
  },
];

/**
 * House numbers — deliberately tongue-in-cheek. The millions are the owner's
 * own (conservative) estimate; the rest are true by definition.
 */
export const houseNumbers = [
  { value: 3, suffix: "", label: "Meats, total", aside: "Lamb, chicken, pork. Ask for a fourth and yia-yia gets involved." },
  { value: 0, suffix: "", label: "Recipe changes", aside: "Right the first time. Don't tell the cousins." },
  { value: 0, suffix: "%", label: "Garlic restraint", aside: "Your colleagues will know. Tomorrow." },
];

export const faqs = [
  {
    q: "Is this the only Yianni's?",
    a: "Yes. There is one Yianni's Hellenic Yiros, at 270 Hindley Street, and there has never been a second. Similarly named shops around Adelaide are not branches of ours.",
  },
  {
    q: "Can I order ahead for pickup?",
    a: "Yes — order online from the menu page, pick a pickup time, and pay at the counter when you collect. You'll get a link that shows your wait time once the kitchen accepts. Prefer the phone? Call (08) 8212 5552. For delivery, we're on Uber Eats.",
  },
  {
    q: "Is your lamb halal?",
    a: "Yes — all the lamb we carve is halal. It's not an add-on or a request; it's simply the lamb on the spit. Anything else you want certified, sourced or explained — ask at the counter. We'll tell you straight.",
  },
  {
    q: "Do you do catering?",
    a: "We do — office lunches, birthdays, wakes, big family nights. Tell us the date and headcount on the catering page (or call the shop) and we'll put together trays of charcoal meat, salad, pita, chips and garlic sauce.",
  },
  {
    q: "What's the difference between a Yiros Pack, an AB Pack and a Meat Pack?",
    a: "A Yiros Pack is the yiros unwrapped — half meat, half salad. An AB Pack is chips on the bottom, meat on top and up to three sauces over everything. A Meat Pack is just the meat, straight off the spit, with garlic sauce and lemon.",
  },
  {
    q: "Why does lamb cost a little more?",
    a: "Lamb costs us more than chicken or pork, so it carries a small premium — +$2 on yiros, packs and the small meat pack, +$3 on the large meat pack and platter for one, +$4 on the platter for two. Mixing meats? The premium applies once if lamb is in the mix.",
  },
  {
    q: "Is the shop wheelchair accessible?",
    a: "Yes. Wheelchair access was part of the 2025 renovation, along with a new counter, floor, spit and fryer. Come on in.",
  },
  {
    q: "Do you have vegetarian options?",
    a: "Yes — the Falafel Yiros and the Veggie Roll. Both can take chips, cooked onion, cheese and extra falafel.",
  },
  {
    q: "How many sauces do I get?",
    a: "Two sauces are included on every food item, three on an AB Pack. After that it's 50c a sauce. Garlic is made in the shop; the recipe is not for sale.",
  },
  {
    q: "Can I get a platter to take away?",
    a: "Platters are dine-in only — they're built to be eaten at the table, slowly, with people you like. For takeaway, a Meat Pack with pita does the same job.",
  },
];

export const nav = [
  { href: "/menu", label: "Menu & order" },
  { href: "/catering", label: "Catering" },
  { href: "/story", label: "Our story" },
  { href: "/parea", label: "Parea" },
  { href: "/visit", label: "Visit" },
];

/** The word, for the Parea page (from the previous site). */
export const parea = {
  word: "Parea",
  pronunciation: "pa-RE-a",
  meaning:
    "The table, not the food. Your people — the ones who know your order and hold a seat without being asked. English borrowed yiros and stopped there. It never took the word for who you eat it with.",
};
