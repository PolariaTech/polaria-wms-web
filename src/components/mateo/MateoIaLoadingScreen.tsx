"use client";

import { MateoIaLoadingMark } from "@/components/mateo/MateoIaLoadingMark";
import { cn } from "@/lib/utils/cn";

/** Pantalla de carga a pantalla completa con marca Mateo IA. */
export function MateoIaLoadingScreen({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  const label = message?.trim() || "Mateo IA cargando";
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center",
        "bg-polaria-bg/92 backdrop-blur-md",
        className,
      )}
    >
      <div className="polaria-card-glow flex flex-col items-center rounded-3xl border border-polaria-t-20 bg-polaria-t-08 px-10 py-12">
        <MateoIaLoadingMark size="xl" tone="teal" showLabel />
        {message?.trim() ? (
          <p className="polaria-text-body mt-6 max-w-xs text-center text-polaria-w-50">
            {message.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
