export type Item = { name: string; detail?: string; quantity: number; unitPrice?: number; notes?: string };

export type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  pickup_time: string;
  email: string | null;
  order_notes: string | null;
  items: Item[];
  total?: number | null;
  status: "new" | "accepted" | "rejected" | "collected";
  wait_minutes: number | null;
};

export type Patch = (id: string, patch: Record<string, unknown>) => void;

export const WAIT_OPTIONS = [10, 15, 20, 30, 45];
export const DEFAULT_WAIT = 15;

export function bump(pattern: number[] = [12, 30, 18]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

export const itemCount = (o: Order) => o.items.reduce((n, i) => n + i.quantity, 0);
