"use client";

import { cn } from "@/lib/utils/cn";

export function AutoImprimirSwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-polaria-teal" : "bg-polaria-w-08",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition",
          on ? "translate-x-5 bg-polaria-bg" : "bg-polaria-w-50",
        )}
      />
    </span>
  );
}
