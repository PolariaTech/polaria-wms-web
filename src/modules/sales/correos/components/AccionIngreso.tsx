"use client";

import { CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { cn } from "@/lib/utils/cn";
import type { CorreoFila } from "../types/correos.types";
import {
  estadoDelIngreso,
  puedeIngresarAMano,
  type AvisoIngreso,
} from "../utils/estado-ingreso";

export { puedeIngresarAMano };

export const BOTON_SECUNDARIO = cn(
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-polaria-t-20 px-3.5",
  "polaria-text-body-sm font-semibold text-polaria-teal transition",
  "hover:bg-polaria-t-08",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

function IngresadoComo({ codigos }: { codigos: string[] }) {
  const [primero, ...resto] = codigos;
  const todos = codigos.join(", ");
  return (
    <span role="status" className="inline-flex items-center gap-2 text-polaria-teal">
      <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="polaria-text-body-sm" title={resto.length > 0 ? todos : undefined}>
        Ingresado como <PolariaTableCode>{primero ?? "una OV"}</PolariaTableCode>
        {resto.length > 0 ? (
          <>
            <span aria-hidden> +{resto.length}</span>
            <span className="sr-only">, y también {resto.join(", ")}</span>
          </>
        ) : null}
      </span>
    </span>
  );
}

function Ingresando() {
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-polaria-w-50"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <span className="polaria-text-body-sm">Ingresando pedido…</span>
    </span>
  );
}

/** El flujo lo recibió hace unos minutos y todavía no termina. */
function Procesando() {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-polaria-w-50">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <span className="polaria-text-body-sm">Procesando…</span>
    </span>
  );
}

/** Pasó el filtro del flujo, que ya lo ingresó. Ingresarlo a mano duplicaría la OV. */
function IngresadoPorElFlujo() {
  return (
    <span className="inline-flex items-center gap-2 text-polaria-teal">
      <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="polaria-text-body-sm">Ingresado por Mateo</span>
    </span>
  );
}

/**
 * Solo el botón: el motivo de un fallo no cabe en la tabla sin romper la fila. Se lee en el modal
 * del detalle (alerta del cuerpo) y, mientras tanto, en el tooltip del botón.
 */
function BotonIngresar({
  fila,
  onIngresar,
}: {
  fila: CorreoFila;
  onIngresar: (messageId: string) => void;
}) {
  const fallo = fila.ingreso?.estado === "error";
  const accion = fallo ? "Reintentar el ingreso" : "Ingresar como OV";
  return (
    <button
      type="button"
      onClick={() => onIngresar(fila.messageId)}
      aria-label={`${accion} del correo ${fila.asunto ?? "sin asunto"}`}
      title={fallo ? (fila.ingreso?.error ?? undefined) : undefined}
      // Mismo ancho en «Ingresar como OV» y en «Reintentar»: la columna no cambia al fallar.
      // Ancho fijo y no `w-full`: en el pie del modal (flex-wrap) el 100 % lo mandaba a otra línea.
      className={cn(BOTON_SECUNDARIO, "w-[9.5rem] max-w-full justify-center whitespace-nowrap")}
    >
      {fallo ? <RotateCw className="h-4 w-4" strokeWidth={1.75} aria-hidden /> : null}
      {fallo ? "Reintentar" : "Ingresar como OV"}
    </button>
  );
}

const TEXTO_AVISO: Record<AvisoIngreso, string> = {
  duplicado: "Ya había una orden con ese número",
  flujoFallo: "El flujo no pudo ingresarlo",
  sinProcesar: "Sin procesar",
  revisar: "Revisar",
};

/** Estado = texto + color: el flujo falló en rojo, el resto pide atención en ámbar. */
const CLASES_AVISO: Record<AvisoIngreso, string> = {
  duplicado: "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning",
  flujoFallo: "border-polaria-danger-border bg-polaria-danger-bg text-polaria-danger",
  sinProcesar: "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning",
  revisar: "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning",
};

/** Lo que le pasó al correo y pide mirarlo; va en la columna «Motivo», junto al botón de ingreso. */
export function AvisoDelFlujo({ aviso, motivo }: { aviso: AvisoIngreso; motivo?: string | null }) {
  const texto = aviso === "revisar" && motivo ? `Revisar: ${motivo}` : TEXTO_AVISO[aviso];
  return (
    <span
      title={texto}
      className={cn(
        "polaria-text-badge inline-flex max-w-full rounded-lg border px-2.5 py-1",
        CLASES_AVISO[aviso],
      )}
    >
      <span className="line-clamp-2 break-words">{texto}</span>
    </span>
  );
}

/** Lo que va en la columna «Ingreso»: el botón, el avance o el código de la OV ya creada. */
export function AccionIngreso({
  fila,
  onIngresar,
}: {
  fila: CorreoFila;
  onIngresar: (messageId: string) => void;
}) {
  const estado = estadoDelIngreso(fila);
  switch (estado.tipo) {
    case "ingresado":
      return <IngresadoComo codigos={estado.codigos} />;
    case "ingresando":
      return <Ingresando />;
    case "procesando":
      return <Procesando />;
    case "porElFlujo":
      return <IngresadoPorElFlujo />;
    case "ingresar":
      return <BotonIngresar fila={fila} onIngresar={onIngresar} />;
  }
}
