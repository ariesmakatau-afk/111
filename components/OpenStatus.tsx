"use client";

import { useEffect, useState } from "react";
import { openState, type OpenState } from "@/lib/hours";

/**
 * Live "are the coals lit?" pill, computed in Adelaide time. Renders a
 * neutral placeholder on the server so there's no hydration mismatch.
 */
export default function OpenStatus({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [state, setState] = useState<OpenState | null>(null);

  useEffect(() => {
    const update = () => setState(openState());
    update();
    // Keep the open/closed pill in step with the countdown at the exact
    // Adelaide trading boundary, rather than letting it lag by half a minute.
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  const label = state ? state.label : "Checking the coals…";
  return (
    <span className={`status ${state?.open ? "is-open" : ""} ${className}`} role="status" aria-live="polite">
      <span className="status__dot" aria-hidden="true" />
      <span>{compact && state ? label.replace("Open now · ", "Open · ") : label}</span>
    </span>
  );
}
