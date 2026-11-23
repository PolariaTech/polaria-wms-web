import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DetalleCypherToggleButtonProps {
  onToggleCypher?: () => void;
  onClose: () => void;
}

/** Botón «+» del encabezado: abre Cypher, o cierra el detalle si no hay Cypher. */
export function DetalleCypherToggleButton({
  onToggleCypher,
  onClose,
}: DetalleCypherToggleButtonProps) {
  return (
    <button
      type="button"
      title={onToggleCypher ? "Ver detalle Cypher" : "Cerrar"}
      aria-label={onToggleCypher ? "Abrir detalle Cypher" : "Cerrar detalle"}
      onClick={() => {
        if (onToggleCypher) {
          onToggleCypher();
          return;
        }
        onClose();
      }}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
        onToggleCypher
          ? "border-polaria-t-20 bg-transparent text-polaria-teal hover:bg-polaria-t-08"
          : "border-polaria-teal bg-polaria-teal text-polaria-on-teal hover:opacity-90",
      )}
    >
      <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </button>
  );
}

export interface DetalleEmitirButtonProps {
  disabled: boolean;
  isEmitting: boolean;
  onEmitir: () => void;
}

/** Botón «Emitir venta» del pie del detalle. */
export function DetalleEmitirButton({
  disabled,
  isEmitting,
  onEmitir,
}: DetalleEmitirButtonProps) {
  return (
    <button
      type="button"
      onClick={onEmitir}
      disabled={disabled}
      className={cn(
        "inline-flex min-w-[7rem] items-center justify-center rounded-xl bg-polaria-teal px-4 py-2.5",
        "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {isEmitting ? "Emitiendo…" : "Emitir venta"}
    </button>
  );
}
