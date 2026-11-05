import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Opción del menú de Ventas que todavía no existe: se ve apagada, sin enlace y con la etiqueta
 * «Próximamente», para que la persona sepa que viene en vez de llevarla a una pantalla vacía.
 */
export function VentasItemProximamente({
  icono: Icono,
  etiqueta,
  className,
}: {
  icono: LucideIcon;
  etiqueta: string;
  className?: string;
}) {
  return (
    <span
      aria-disabled="true"
      title="Se construye en un próximo paso"
      className={cn(
        "polaria-text-body-sm flex shrink-0 cursor-not-allowed items-center gap-2.5 whitespace-nowrap rounded-xl border border-transparent px-3 py-2 font-medium text-polaria-w-50 opacity-70",
        className,
      )}
    >
      <Icono className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {etiqueta}
      <span className="rounded-md border border-polaria-w-20 px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-none">
        Próximamente
      </span>
    </span>
  );
}
