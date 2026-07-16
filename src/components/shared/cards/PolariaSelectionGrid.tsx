import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PolariaSelectionGridProps {
  "aria-label": string;
  children: ReactNode;
  className?: string;
}

/** Fila centrada de tarjetas de selección; máximo ~4 por fila (vía ancho de tarjeta). */
export function PolariaSelectionGrid({
  "aria-label": ariaLabel,
  children,
  className,
}: PolariaSelectionGridProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-wrap justify-center gap-4 px-4 sm:gap-5 sm:px-6 lg:gap-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
