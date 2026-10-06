"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "../Icons";

/** One-tap "copy the address", with honest little feedback. */
export default function CopyAddress({ text, label = "Copy address" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm !min-h-[42px]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked (rare, or older browser) — select-and-hope is worse
          // than telling them. Nothing to do; the link buttons above work.
        }
      }}
      aria-live="polite"
    >
      {copied ? <IconCheck className="text-[#1e7d33]" /> : <IconCopy />}
      {copied ? "Copied" : label}
    </button>
  );
}
