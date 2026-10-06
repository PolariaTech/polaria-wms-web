"use client";

import { MateoIaLoadingMark } from "@/components/mateo/MateoIaLoadingMark";
import { cn } from "@/lib/utils/cn";

/** Pantalla de carga a pantalla completa con marca Mateo IA. */
export function MateoIaLoadingScreen({
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Mateo IA cargando"
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center",
        "bg-polaria-bg/92 backdrop-blur-md",
        className,
      )}
    >
      <div className="polaria-card-glow flex flex-col items-center rounded-3xl border border-polaria-t-20 bg-polaria-t-08 px-10 py-12">
        <MateoIaLoadingMark size="xl" tone="teal" showLabel />
      </div>
    </div>
  );
}
