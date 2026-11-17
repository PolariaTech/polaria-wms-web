"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import type { CorreoFila } from "../types/correos.types";
import { AccionIngreso, BOTON_SECUNDARIO } from "./AccionIngreso";
import { RecorridoCorreos } from "./RecorridoCorreos";

/**
 * Regresa a la lista de donde se vino. Si la pantalla se abrió directo (sin historial en esta
 * pestaña), lleva a los correos descartados para no sacar a la persona de la aplicación.
 */
function VolverALosCorreos() {
  const router = useRouter();
  const volver = () => {
    if (window.history.length > 1) router.back();
    else router.push(ROUTES.dashboardVentasCorreosDescartados);
  };

  return (
    <button type="button" onClick={volver} className={BOTON_SECUNDARIO}>
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      Volver a los correos
    </button>
  );
}

/** Volver e ingresar a la izquierda; anterior/siguiente a la derecha, a todo el ancho. */
export function BarraCorreoCompleto({
  messageId,
  fila,
  onIngresar,
}: {
  messageId: string;
  fila: CorreoFila | null;
  onIngresar: (id: string) => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Acciones del correo"
      className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <VolverALosCorreos />
        {fila ? <AccionIngreso fila={fila} onIngresar={onIngresar} /> : null}
      </div>
      <RecorridoCorreos messageId={messageId} />
    </div>
  );
}
