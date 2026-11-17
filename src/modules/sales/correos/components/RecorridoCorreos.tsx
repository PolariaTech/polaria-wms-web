"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { leerRecorrido, type RecorridoCorreos as Recorrido } from "../utils/recorrido-correos";
import { BOTON_SECUNDARIO } from "./AccionIngreso";

const BOTON_RECORRIDO = cn(
  BOTON_SECUNDARIO,
  "h-auto min-h-11 sm:min-h-9 disabled:cursor-not-allowed disabled:opacity-50",
);

/**
 * Anterior/Siguiente sobre los ids del bloque de 50 que se guardó al salir de la lista.
 * Sin ids (URL directa) no se muestra. `replace` para que Volver no recorra cada correo.
 */
export function RecorridoCorreos({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [recorrido, setRecorrido] = useState<Recorrido | null>(null);

  useEffect(() => {
    setRecorrido(leerRecorrido());
  }, []);

  const ids = recorrido?.ids ?? [];
  const indice = ids.indexOf(messageId);
  if (indice < 0) return null;

  const total = ids.length;
  const anterior = ids[indice - 1];
  const siguiente = ids[indice + 1];

  const irA = (vecino: string | undefined) => {
    if (!vecino) return;
    router.replace(ROUTES.dashboardVentasCorreo(vecino));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={!anterior}
        onClick={() => irA(anterior)}
        aria-label="Correo anterior"
        className={BOTON_RECORRIDO}
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Anterior
      </button>
      <p className="polaria-text-body-sm tabular-nums text-polaria-w-50">
        {indice + 1} de {total}
      </p>
      <button
        type="button"
        disabled={!siguiente}
        onClick={() => irA(siguiente)}
        aria-label="Correo siguiente"
        className={BOTON_RECORRIDO}
      >
        Siguiente
        <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
