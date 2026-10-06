"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { igniteAt } from "@/lib/embers";

type Props = ComponentProps<typeof Link> & { sparks?: number };

/** A link that throws sparks when pressed — used for primary actions. */
export default function FireLink({ sparks = 30, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        igniteAt(e.currentTarget, sparks);
        onClick?.(e);
      }}
    />
  );
}
