"use client";

import { useCart } from "./CartProvider";
import { IconPlus } from "../Icons";

export default function AddButton({ productId, label = "Add", className = "" }: { productId: string; label?: string; className?: string }) {
  const { customise } = useCart();
  return (
    <button
      type="button"
      onClick={() => customise(productId)}
      className={`btn btn-blue btn-sm shrink-0 ${className}`}
      aria-haspopup="dialog"
    >
      <IconPlus className="h-4 w-4" /> {label}
    </button>
  );
}
