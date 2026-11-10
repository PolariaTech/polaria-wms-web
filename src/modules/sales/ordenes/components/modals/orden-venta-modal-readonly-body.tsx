import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** REQ-180: fieldset disabled cuando otro operador tiene el soft-lock. */
export function OrdenVentaModalReadonlyBody({
  soloLectura,
  children,
}: {
  soloLectura: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset
      disabled={soloLectura}
      className={cn(
        "min-w-0 border-0 p-0",
        soloLectura && "pointer-events-none opacity-90",
      )}
    >
      {children}
    </fieldset>
  );
}
