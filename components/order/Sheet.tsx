"use client";

import { useEffect, useRef } from "react";
import { IconClose } from "../Icons";

/**
 * A dialog that rises from the bottom on phones and sits centred on larger
 * screens. Escape and the backdrop close it; focus moves in on open and
 * back to where it was on close; the page behind doesn't scroll.
 */
export default function Sheet({
  open,
  onClose,
  label,
  children,
  wide = false,
  tone = "light",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  tone?: "light" | "dark";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  // Hold onClose in a ref: parents pass inline arrow functions, and if the
  // effect below depended on that identity it would tear down and re-run on
  // EVERY keystroke — yanking focus off the input (and the on-screen keyboard
  // with it) one character at a time.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => panel.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div className="sheet-backdrop absolute inset-0 bg-blue-navy/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        data-tone={tone === "dark" ? "dark" : undefined}
        className={`sheet-panel relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-[28px] outline-none sm:rounded-[28px] ${
          wide ? "sm:max-w-3xl" : "sm:max-w-xl"
        } ${tone === "dark" ? "surface-dark text-white" : "bg-white"} shadow-[0_40px_120px_-30px_rgba(7,24,58,.7)]`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full ${
            tone === "dark" ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/90 text-blue-navy shadow hover:bg-mist"
          }`}
        >
          <IconClose className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
