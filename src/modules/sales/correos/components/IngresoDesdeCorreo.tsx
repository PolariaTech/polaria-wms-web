"use client";

import type { CorreoFila } from "../types/correos.types";
import { AvisoDelBoton, puedeIngresarAMano } from "./AccionIngreso";
import { VeredictoFlujo } from "./DetalleCorreoPartes";

export function IngresoDesdeCorreo({
  fila,
  fallo,
}: {
  fila: CorreoFila | null;
  fallo: boolean;
}) {
  if (fallo) {
    return (
      <p className="polaria-text-caption text-polaria-w-50">
        No pudimos saber si este correo ya está ingresado. Para ingresarlo, vuelve a la
        lista.
      </p>
    );
  }
  if (!fila) return null;
  return (
    <div className="flex flex-col gap-4">
      <VeredictoFlujo fila={fila} />
      <div className="flex flex-col gap-2">
        {puedeIngresarAMano(fila) ? <AvisoDelBoton /> : null}
        {fila.ingreso?.estado === "error" && fila.ingreso.error ? (
          <p role="alert" className="polaria-text-body-sm text-polaria-danger">
            {fila.ingreso.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
