// lib/menu.ts
//
// Structured, option-based menu — the client-confirmed prices and rules,
// carried over unchanged from the previous site. Drives /menu and the
// yiros builder (/build and the home page).
//
// The shape is option-driven rather than one line per permutation: a
// customer picks a product, then meat, size and extras. Two sets of rules
// live in the data rather than in the UI, so they can't drift apart:
//
//   1. `allowedExtras` per product — e.g. no chips in a Yiros Pack or AB
//      Pack (they already come with chips), no extra meat on a Meat Pack.
//   2. `lambSurcharge` per *size* — the lamb premium is not flat. It's $2
//      on yiros/packs/small meat pack, $3 on the large meat pack and
//      platter for 1, and $4 on platter for 2.
//   3. `freeSauces` per product — two sauces are included on every food
//      item, three on an AB Pack. Anything past the allowance is 50c a
//      sauce.

import { halal } from "./site";

export type MeatId = "lamb" | "chicken" | "pork";

export type Meat = {
  id: MeatId;
  name: string;
  /** Client-confirmed fact shown next to the meat wherever it's offered. */
  note?: string;
};

export const meats: Meat[] = [
  // Keep the selectable-meat note in sync with the compact site badge.
  { id: "lamb", name: "Lamb", note: halal.label },
  { id: "chicken", name: "Chicken" },
  { id: "pork", name: "Pork" },
];

export type ExtraId =
  | "cooked-onion"
  | "chips"
  | "cheese"
  | "extra-meat"
  | "pita"
  | "falafel"
  | "salad-on-ab";

export type Extra = {
  id: ExtraId;
  name: string;
  price: number;
};

export const extras: Extra[] = [
  { id: "cooked-onion", name: "Cooked onion", price: 1 },
  { id: "chips", name: "Chips", price: 1.5 },
  { id: "cheese", name: "Cheese", price: 1.5 },
  { id: "extra-meat", name: "Extra meat", price: 6 },
  { id: "pita", name: "Pita bread", price: 2 },
  { id: "falafel", name: "Falafel", price: 2 },
  { id: "salad-on-ab", name: "Salad on AB Pack", price: 3 },
];

export const extraById = new Map(extras.map((e) => [e.id, e]));

export const sauces = [
  "Garlic",
  "BBQ",
  "Sweet chilli",
  "Hot chilli",
  "Peri peri",
  "Nando's peri-peri",
  "Aioli",
  "Mayonnaise",
  "Mustard",
  "Tomato",
  "Tabasco",
];

export const SAUCE_PRICE = 0.5;

export type ProductSize = {
  id: string;
  name: string;
  price: number;
  /** Premium added once if lamb is part of the meat selection. */
  lambSurcharge?: number;
};

/** A simple pick-one list, e.g. which soft drink flavour. */
export type ProductVariant = {
  label: string;
  options: string[];
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  /** Extra detail shown inside the customiser only. */
  note?: string;
  /** A single size entry means there's no size to choose. */
  sizes: ProductSize[];
  meatChoice: boolean;
  allowedExtras: ExtraId[];
  /**
   * How many sauces are included at no charge. Undefined = this item
   * doesn't take a sauce choice at all (drinks, tubs, bread).
   */
  freeSauces?: number;
  variant?: ProductVariant;
  /** Dine-in only — excluded from the pickup order builder. */
  dineInOnly?: boolean;
  /**
   * The salad that comes IN by default and that a customer can subtract in
   * the builder ("no onion, no lettuce"). Everything on this list ships
   * unless the line explicitly excludes it — nothing is ever missing just
   * because someone didn't tap.
   */
  salad?: string[];
};

export type ProductGroup = {
  id: string;
  title: string;
  blurb?: string;
  products: Product[];
};

export const menuGroups: ProductGroup[] = [
  {
    id: "yiros",
    title: "Yiros",
    blurb: "Carved off the charcoal, wrapped in warm pita.",
    products: [
      {
        id: "yiros",
        name: "Yiros",
        description: "Lettuce, tomato, onion, garlic sauce & lemon.",
        sizes: [
          { id: "regular", name: "Regular", price: 20, lambSurcharge: 2 },
          { id: "mini", name: "Mini", price: 15, lambSurcharge: 2 },
        ],
        meatChoice: true,
        allowedExtras: ["cooked-onion", "chips", "cheese", "extra-meat", "falafel"],
        freeSauces: 2,
        salad: ["Lettuce", "Tomato", "Onion"],
      },
      {
        id: "falafel-yiros",
        name: "Falafel Yiros",
        description:
          "Crispy falafel, lettuce, cheese, tomato, onion, garlic sauce, lemon, salt & pepper.",
        sizes: [{ id: "standard", name: "Standard", price: 15 }],
        meatChoice: false,
        allowedExtras: ["cooked-onion", "chips", "cheese", "falafel"],
        freeSauces: 2,
        salad: ["Lettuce", "Tomato", "Onion", "Cheese"],
      },
      {
        id: "veggie-roll",
        name: "Veggie Roll",
        description:
          "Lettuce, cheese, tomato, onion, garlic sauce, lemon, salt & pepper.",
        sizes: [{ id: "standard", name: "Standard", price: 8 }],
        meatChoice: false,
        allowedExtras: ["cooked-onion", "chips", "cheese", "falafel"],
        freeSauces: 2,
        salad: ["Lettuce", "Tomato", "Onion", "Cheese"],
      },
    ],
  },
  {
    id: "yiros-pack",
    title: "Yiros Pack",
    blurb: "The yiros, unwrapped — half meat, half salad.",
    products: [
      {
        id: "yiros-pack",
        name: "Yiros Pack",
        description: "Half meat, half salad, garlic sauce & lemon.",
        sizes: [{ id: "standard", name: "Standard", price: 18, lambSurcharge: 2 }],
        meatChoice: true,
        allowedExtras: ["cooked-onion", "cheese", "extra-meat", "pita"],
        freeSauces: 2,
        salad: ["Lettuce", "Tomato", "Onion"],
      },
    ],
  },
  {
    id: "ab-pack",
    title: "AB Pack",
    blurb: "Chips on the bottom, meat on top, sauce over everything.",
    products: [
      {
        id: "ab-pack",
        name: "AB Pack",
        description: "Chips, meat & up to 3 sauces.",
        sizes: [
          { id: "small", name: "Small", price: 23, lambSurcharge: 2 },
          { id: "large", name: "Large", price: 28, lambSurcharge: 2 },
        ],
        meatChoice: true,
        allowedExtras: ["cooked-onion", "cheese", "extra-meat", "salad-on-ab"],
        freeSauces: 3,
      },
    ],
  },
  {
    id: "meat-pack",
    title: "Meat Pack",
    blurb: "Straight off the spit. Nothing in the way.",
    products: [
      {
        id: "meat-pack",
        name: "Meat Pack",
        description: "Meat, garlic sauce & lemon.",
        sizes: [
          { id: "small", name: "Small", price: 28, lambSurcharge: 2 },
          { id: "large", name: "Large", price: 35, lambSurcharge: 3 },
        ],
        meatChoice: true,
        allowedExtras: ["cooked-onion", "chips", "cheese", "pita"],
        freeSauces: 2,
      },
    ],
  },
  {
    id: "platters",
    title: "Platters",
    blurb: "Sit down, take your time. Dine-in only.",
    products: [
      {
        id: "platter",
        name: "Platter",
        description: "Meat, salad, pita, garlic sauce & lemon.",
        sizes: [
          { id: "for-1", name: "For 1", price: 35, lambSurcharge: 3 },
          { id: "for-2", name: "For 2", price: 58, lambSurcharge: 4 },
        ],
        meatChoice: true,
        allowedExtras: ["cooked-onion", "cheese", "pita"],
        freeSauces: 2,
        dineInOnly: true,
      },
    ],
  },
  {
    id: "sides",
    title: "Sides & Sauce",
    products: [
      {
        id: "chips",
        name: "Chips",
        sizes: [
          { id: "small", name: "Small", price: 9 },
          { id: "large", name: "Large", price: 12 },
          { id: "family", name: "Family", price: 20 },
        ],
        meatChoice: false,
        allowedExtras: [],
        freeSauces: 2,
      },
      {
        id: "salad-pack",
        name: "Salad Pack",
        description: "Lettuce, onion & tomato, lemon & olive oil dressing.",
        sizes: [{ id: "standard", name: "Standard", price: 5 }],
        meatChoice: false,
        allowedExtras: ["cheese"],
      },
      {
        id: "garlic-sauce",
        name: "Garlic Sauce",
        description: "By the tub.",
        sizes: [
          { id: "xs", name: "X-Small", price: 1 },
          { id: "s", name: "Small", price: 2 },
          { id: "m", name: "Medium", price: 3.5 },
          { id: "l", name: "Large", price: 5 },
        ],
        meatChoice: false,
        allowedExtras: [],
      },
      {
        id: "pita-bread",
        name: "Pita Bread",
        sizes: [{ id: "standard", name: "Standard", price: 2 }],
        meatChoice: false,
        allowedExtras: [],
      },
    ],
  },
  {
    id: "coffee",
    title: "Coffee",
    products: [
      {
        id: "greek-coffee",
        name: "Greek Coffee",
        description: "Short black, one sugar.",
        sizes: [{ id: "standard", name: "Standard", price: 3 }],
        meatChoice: false,
        allowedExtras: [],
      },
    ],
  },
  {
    id: "drinks",
    title: "Drinks",
    products: [
      {
        id: "soft-drink",
        name: "Soft Drink",
        description: "600ml bottle.",
        sizes: [{ id: "600ml", name: "600ml", price: 5 }],
        meatChoice: false,
        allowedExtras: [],
        variant: {
          label: "Flavour",
          options: [
            "Coke",
            "Coke Zero",
            "Coke Vanilla",
            "Coke Vanilla Zero",
            "Fanta",
            "Fanta Raspberry",
            "Sprite",
            "Sprite Zero",
            "Passiona",
          ],
        },
      },
      {
        id: "can",
        name: "Can",
        description: "330ml.",
        sizes: [{ id: "330ml", name: "330ml", price: 3.5 }],
        meatChoice: false,
        allowedExtras: [],
        variant: {
          label: "Flavour",
          options: [
            "Coke",
            "Coke Zero",
            "Fanta",
            "Fanta Lemon",
            "Sprite",
            "Pepsi Max",
            "Kirks Ginger Beer",
            "Kirks Creaming Soda",
          ],
        },
      },
      {
        id: "juice-milk",
        name: "Juice, Milk & Iced Coffee",
        description: "Nippy's range.",
        sizes: [{ id: "standard", name: "Standard", price: 5 }],
        meatChoice: false,
        allowedExtras: [],
        variant: {
          label: "Pick one",
          options: [
            "Orange",
            "Unsweetened Orange",
            "Orange & Mango",
            "Breakfast Juice",
            "Apple",
            "Apple Blackcurrant",
            "Chocolate Milk",
            "Iced Coffee",
          ],
        },
      },
      {
        id: "water",
        name: "Water",
        description: "Mount Franklin, 600ml.",
        sizes: [{ id: "600ml", name: "600ml", price: 4 }],
        meatChoice: false,
        allowedExtras: [],
        variant: {
          label: "Style",
          options: ["Still", "Lightly sparkling", "Lightly sparkling lime"],
        },
      },
      {
        id: "sports-energy",
        name: "Pump, Powerade & Energy",
        sizes: [{ id: "standard", name: "Standard", price: 5.5 }],
        meatChoice: false,
        allowedExtras: [],
        variant: {
          label: "Pick one",
          options: [
            "Pump 750ml",
            "Pump Berry 750ml",
            "Powerade Mountain Berry Blast",
            "Powerade Berry Ice",
            "Powerade Lemon Lime",
            "Powerade Grape",
            "Powerade Gold Rush",
            "Monster White Zero",
            "Monster Mango Loco",
          ],
        },
      },
    ],
  },
];

export const allProducts: Product[] = menuGroups.flatMap((g) => g.products);

/** Pickup order builder excludes dine-in-only products. */
export const orderableGroups: ProductGroup[] = menuGroups
  .map((g) => ({ ...g, products: g.products.filter((p) => !p.dineInOnly) }))
  .filter((g) => g.products.length > 0);

export function formatMoney(amount: number): string {
  return amount % 1 === 0 ? `$${amount}` : `$${amount.toFixed(2)}`;
}

/** Human label for a meat selection: one meat, or "Mix (Lamb + Pork)". */
export function describeMeats(selected: MeatId[]): string {
  const names = meats.filter((m) => selected.includes(m.id)).map((m) => m.name);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `Mix (${names.join(" + ")})`;
}

/** Price span across a product's sizes, for the menu listing. */
export function priceRange(product: Product): string {
  const prices = product.sizes.map((s) => s.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
}

/** The distinct lamb premiums a product charges, e.g. "+$2" or "+$3 – +$4". */
export function lambSurchargeLabel(product: Product): string | null {
  const values = Array.from(
    new Set(product.sizes.map((s) => s.lambSurcharge ?? 0).filter((v) => v > 0))
  ).sort((a, b) => a - b);
  if (values.length === 0) return null;
  if (values.length === 1) return `Lamb +${formatMoney(values[0])}`;
  return `Lamb +${formatMoney(values[0])} – +${formatMoney(values[values.length - 1])}`;
}

/** Cost of a sauce selection: free up to the allowance, then 50c each. */
export function sauceCost(selectedCount: number, freeSauces: number): number {
  return Math.max(0, selectedCount - freeSauces) * SAUCE_PRICE;
}

// ---------------------------------------------------------------------------
// Tags for the menu finder on /menu. Derived from the menu itself so they
// can never claim something the menu doesn't support.
// ---------------------------------------------------------------------------

const VEGIE_IDS = new Set(["falafel-yiros", "veggie-roll", "salad-pack", "pita-bread"]);
const LATE_IDS = new Set(["yiros", "yiros-pack", "ab-pack", "meat-pack", "chips"]);
const CREW_IDS = new Set(["ab-pack", "meat-pack", "platter", "chips", "salad-pack", "pita-bread"]);
const MEAT_IDS = new Set(["yiros", "yiros-pack", "ab-pack", "meat-pack", "platter"]);

/** Cheap eats = the lowest size on the menu is $15 or under. */
export const CHEAP_MAX = 15;

export function menuTags(groupId: string, p: Product): string[] {
  const t: string[] = [];
  if (MEAT_IDS.has(p.id)) t.push("meat");
  if (Math.min(...p.sizes.map((s) => s.price)) <= CHEAP_MAX) t.push("cheap");
  if (VEGIE_IDS.has(p.id)) t.push("vegie");
  if (LATE_IDS.has(p.id)) t.push("late");
  if (CREW_IDS.has(p.id)) t.push("crew");
  if (groupId === "coffee") t.push("coffee");
  if (groupId === "drinks" || groupId === "coffee") t.push("drinks");
  if (p.dineInOnly) t.push("dinein");
  return t;
}

/** Lower-cased haystack for the search box: name, description, options, sizes. */
export function menuSearchText(p: Product): string {
  return [
    p.name,
    p.description ?? "",
    p.note ?? "",
    ...p.sizes.map((s) => `${s.name} ${s.price}`),
    p.variant ? `${p.variant.label} ${p.variant.options.join(" ")}` : "",
    // Everything that takes meat takes halal lamb — make "halal" findable.
    p.meatChoice ? meats.map((m) => `${m.name} ${m.note ?? ""}`.trim()).join(" ") : "",
    p.salad ? `includes ${p.salad.join(" ")} — take any off` : "",
  ]
    .join(" ")
    .toLowerCase();
}
