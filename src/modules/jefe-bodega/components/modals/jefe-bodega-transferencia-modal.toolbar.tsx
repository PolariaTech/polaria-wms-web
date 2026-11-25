import { cn } from "@/lib/utils/cn";
import type { OrigenZona } from "./jefe-bodega-transferencia-modal.types";

export function JefeBodegaTransferenciaOrigenToolbar({
  origenZona,
  onChange,
}: {
  origenZona: OrigenZona;
  onChange: (zona: OrigenZona) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(
        [
          ["almacenamiento", "Almacenamiento"],
          ["procesamiento", "Procesamiento"],
        ] as const
      ).map(([zona, label]) => (
        <button
          key={zona}
          type="button"
          onClick={() => onChange(zona)}
          className={cn(
            "rounded-xl border px-3 py-2 polaria-text-body-sm font-semibold transition",
            origenZona === zona
              ? "border-polaria-teal bg-polaria-t-08 text-polaria-teal"
              : "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50 hover:border-polaria-t-20",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
