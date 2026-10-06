"use client";

import { useEffect, useState } from "react";
import { hours } from "@/lib/site";
import { adelaideNow, formatRange } from "@/lib/hours";

export default function HoursTable({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(adelaideNow().dayIndex), []);

  const dark = tone === "dark";
  return (
    <table className="w-full border-collapse text-[0.95rem]">
      <caption className="sr-only">Opening hours, Adelaide time</caption>
      <tbody>
        {hours.map((h, i) => (
          <tr
            key={h.day}
            className={`hours-row ${today === i ? "is-today" : ""} border-b ${dark ? "border-white/10" : "border-line"}`}
          >
            <th scope="row" className="py-3 pl-4 text-left font-semibold">
              {h.day}
              {today === i && (
                <span className="ml-2 rounded-full bg-ember px-2 py-0.5 align-middle text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white">
                  Today
                </span>
              )}
            </th>
            <td className={`py-3 pr-4 text-right tabular-nums ${dark ? "text-white/75" : "text-muted"}`}>
              {formatRange(h.open, h.close)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
