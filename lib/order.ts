// lib/order.ts
//
// One source of truth for what an order line *is*, what it costs and how
// it's described. The browser uses it for live prices; the server uses the
// same functions to re-price and re-describe every order it receives, so a
// tampered request can't change a price or smuggle in an option the menu
// doesn't allow — and the kitchen always sees names built from the menu.

import {
  allProducts,
  extraById,
  formatMoney,
  meats,
  sauceCost,
  sauces as SAUCES,
  type ExtraId,
  type MeatId,
  type Product,
} from "./menu";

export type LineConfig = {
  productId: string;
  sizeId: string;
  meats: MeatId[];
  sauces: string[];
  extras: ExtraId[];
  variant?: string;
  /**
   * Salad items to leave OFF (drawn from the product's `salad` list).
   * Everything included by default; this list subtracts. Never priced —
   * taking something off was always free.
   */
  excludes?: string[];
};

export type CartLine = LineConfig & { key: string; qty: number };

/** What gets stored with an order and shown to the kitchen. */
export type OrderItem = {
  name: string;
  detail?: string;
  quantity: number;
  unitPrice: number;
};

export const MAX_QTY = 20;
export const MAX_LINES = 30;

export const productById = (id: string) => allProducts.find((p) => p.id === id);

export function lineKey(c: LineConfig): string {
  return JSON.stringify([
    c.productId,
    c.sizeId,
    [...c.meats].sort(),
    c.sauces,
    [...c.extras].sort(),
    c.variant ?? "",
    [...(c.excludes ?? [])].sort(),
  ]);
}

export function freshConfig(p: Product): LineConfig {
  return {
    productId: p.id,
    sizeId: p.sizes[0].id,
    meats: p.meatChoice ? ["lamb"] : [],
    sauces: p.freeSauces !== undefined && p.freeSauces > 0 && p.id !== "chips" ? ["Garlic"] : [],
    extras: [],
    variant: p.variant?.options[0],
    excludes: [],
  };
}

export function unitPrice(p: Product, c: LineConfig): number {
  const size = p.sizes.find((s) => s.id === c.sizeId) ?? p.sizes[0];
  const lamb = c.meats.includes("lamb") ? size.lambSurcharge ?? 0 : 0;
  const extras = c.extras.reduce((sum, id) => sum + (extraById.get(id)?.price ?? 0), 0);
  const sauce = p.freeSauces !== undefined ? sauceCost(c.sauces.length, p.freeSauces) : 0;
  return size.price + lamb + extras + sauce;
}

export function meatLabel(ids: MeatId[]): string {
  const names = meats.filter((m) => ids.includes(m.id)).map((m) => m.name);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export function describe(p: Product, c: LineConfig): { title: string; detail: string } {
  const size = p.sizes.find((s) => s.id === c.sizeId) ?? p.sizes[0];
  const sizeLabel = p.sizes.length > 1 ? `${size.name} ` : "";
  const meat = p.meatChoice ? meatLabel(c.meats) : "";
  const title = `${sizeLabel}${meat ? meat + " " : ""}${p.name}`.trim();
  const bits: string[] = [];
  // Removals lead: on a kitchen ticket, what's NOT in the wrap is the thing
  // that must not be missed. (Customer-facing, it reads the same way a
  // handwritten docket does.)
  const off = (c.excludes ?? []).filter(Boolean);
  if (off.length) bits.push("NO " + off.map((x) => x.toLowerCase()).join(", "));
  if (c.variant) bits.push(c.variant);
  if (c.sauces.length) bits.push(c.sauces.join(" + ") + (c.sauces.length === 1 ? " sauce" : ""));
  if (c.extras.length) bits.push("with " + c.extras.map((id) => extraById.get(id)?.name.toLowerCase()).join(", "));
  return { title, detail: bits.join(" · ") };
}

export function toOrderItem(p: Product, l: CartLine): OrderItem {
  const d = describe(p, l);
  return { name: d.title, detail: d.detail || undefined, quantity: l.qty, unitPrice: unitPrice(p, l) };
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => {
    const p = productById(l.productId);
    return p ? sum + unitPrice(p, l) * l.qty : sum;
  }, 0);
}

export function orderText(lines: CartLine[]): string {
  return lines
    .map((l) => {
      const p = productById(l.productId);
      if (!p) return "";
      const d = describe(p, l);
      return `${l.qty} × ${d.title}${d.detail ? ` — ${d.detail}` : ""} (${formatMoney(unitPrice(p, l) * l.qty)})`;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Server-side: turn untrusted input into a clean, menu-valid line, or null.
 * Anything the menu doesn't allow is rejected rather than silently fixed.
 */
export function sanitiseLine(raw: unknown): CartLine | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const p = typeof r.productId === "string" ? productById(r.productId) : undefined;
  if (!p || p.dineInOnly) return null;

  const sizeId = typeof r.sizeId === "string" && p.sizes.some((s) => s.id === r.sizeId) ? r.sizeId : null;
  if (!sizeId) return null;

  const qty = Number(r.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;

  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const meatIds = Array.from(new Set(arr(r.meats))) as MeatId[];
  if (p.meatChoice) {
    if (meatIds.length === 0 || meatIds.some((m) => !meats.some((x) => x.id === m))) return null;
  } else if (meatIds.length) return null;

  const sauceList = Array.from(new Set(arr(r.sauces)));
  if (sauceList.length && (p.freeSauces === undefined || sauceList.some((s) => !SAUCES.includes(s)))) return null;

  const extraIds = Array.from(new Set(arr(r.extras))) as ExtraId[];
  if (extraIds.some((e) => !p.allowedExtras.includes(e))) return null;

  let variant: string | undefined;
  if (p.variant) {
    if (typeof r.variant !== "string" || !p.variant.options.includes(r.variant)) return null;
    variant = r.variant;
  }

  // Excludes: only things the product actually serves, only on products
  // that have a subtractable salad at all. A crafted "no lamb surcharge"
  // finds nothing to hit and fails closed.
  let excludes: string[] = [];
  const rawExcludes = Array.from(new Set(arr(r.excludes)));
  const allowedSalad = p.salad ?? [];
  if (rawExcludes.length) {
    if (allowedSalad.length === 0 || rawExcludes.some((x) => !allowedSalad.includes(x))) return null;
    excludes = rawExcludes;
  }

  const cfg: LineConfig = {
    productId: p.id,
    sizeId,
    meats: meatIds,
    sauces: sauceList,
    extras: extraIds,
    variant,
    ...(excludes.length ? { excludes } : {}),
  };
  return { ...cfg, key: lineKey(cfg), qty };
}
