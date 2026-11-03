"use client";

import { CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { cn } from "@/lib/utils/cn";
import type { CorreoFila } from "../types/correos.types";

export const BOTON_SECUNDARIO = cn(
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-polaria-t-20 px-3.5",
  "polaria-text-body-sm font-semibold text-polaria-teal transition",
  "hover:bg-polaria-t-08",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

/** Un correo se puede ingresar a mano si el flujo lo descartó o si un intento anterior falló. */
export const puedeIngresarAMano = (fila: CorreoFila): boolean =>
  fila.ingreso?.estado === "error" ||
  (fila.nuevoPedido === false && !fila.ingreso);

function IngresadoComo({ codigo }: { codigo: string | null }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-polaria-teal">
      <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="polaria-text-body-sm">
        Ingresado como <PolariaTableCode>{codigo ?? "una OV"}</PolariaTableCode>
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

/** Pasó el filtro del flujo, que ya lo ingresó. Ingresarlo a mano duplicaría la OV. */
function IngresadoPorElFlujo() {
  return (
    <span className="inline-flex items-center gap-2 text-polaria-teal">
      <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="polaria-text-body-sm">Ingresado por el flujo</span>
    </span>
  );
}

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
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => onIngresar(fila.messageId)}
        aria-label={`${accion} del correo ${fila.asunto ?? "sin asunto"}`}
        className={BOTON_SECUNDARIO}
      >
        {fallo ? <RotateCw className="h-4 w-4" strokeWidth={1.75} aria-hidden /> : null}
        {fallo ? "Reintentar" : "Ingresar como OV"}
      </button>
      {fallo && fila.ingreso?.error ? (
        <p
          role="alert"
          title={fila.ingreso.error}
          className="polaria-text-caption line-clamp-2 max-w-[16rem] text-polaria-danger"
        >
          {fila.ingreso.error}
        </p>
      ) : null}
    </div>
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
  const estado = fila.ingreso?.estado;
  if (estado === "ingresado") {
    return <IngresadoComo codigo={fila.ingreso?.codigoOrdenVenta ?? null} />;
  }
  if (estado === "procesando") return <Ingresando />;
  if (estado === "error" || fila.nuevoPedido === false) {
    return <BotonIngresar fila={fila} onIngresar={onIngresar} />;
  }
  return <IngresadoPorElFlujo />;
}
