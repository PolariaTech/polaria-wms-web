"use client";

import { useFilaCorreo } from "../hooks/useFilaCorreo";
import { AccionIngreso, puedeIngresarAMano } from "./AccionIngreso";
import { AvisoDelBoton } from "./DetalleCorreoModal";

export function IngresoDesdeCorreo({ messageId }: { messageId: string }) {
  const { fila, fallo, ingresar } = useFilaCorreo(messageId);
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
    <div className="flex flex-col gap-2">
      <AccionIngreso fila={fila} onIngresar={(id) => void ingresar(id)} />
      {puedeIngresarAMano(fila) ? <AvisoDelBoton /> : null}
      {fila.ingreso?.estado === "error" && fila.ingreso.error ? (
        <p role="alert" className="polaria-text-body-sm text-polaria-danger">
          {fila.ingreso.error}
        </p>
      ) : null}
    </div>
  );
}
