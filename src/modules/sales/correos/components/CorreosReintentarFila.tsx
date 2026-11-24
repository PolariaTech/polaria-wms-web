"use client";

import { Loader2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CorreoFila } from "../types/correos.types";
import { BOTON_SECUNDARIO } from "./AccionIngreso";

interface CorreosReintentarFilaProps {
  fila: CorreoFila;
  activo: boolean;
  ocupado: boolean;
  onReintentar: (messageId: string) => void;
}

export function CorreosReintentarFila({
  fila,
  activo,
  ocupado,
  onReintentar,
}: CorreosReintentarFilaProps) {
  const esperando = activo || fila.ingreso?.estado === "procesando";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="polaria-text-body-sm truncate text-polaria-w">
          {fila.asunto?.trim() || "(sin asunto)"}
        </p>
        <p className="polaria-text-caption mt-0.5 truncate text-polaria-w-50">
          {fila.de?.trim() || "Remitente desconocido"}
        </p>
        {esperando ? (
          <p className="polaria-text-caption mt-1 text-polaria-w-50">
            Esperando resultado del ingreso…
          </p>
        ) : fila.ingreso?.error ? (
          <p className="polaria-text-caption mt-1 text-polaria-danger">
            {fila.ingreso.error}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => onReintentar(fila.messageId)}
        className={cn(
          BOTON_SECUNDARIO,
          "w-[9.5rem] justify-center disabled:cursor-not-allowed disabled:opacity-50",
        )}
        aria-label={`Reintentar el ingreso del correo ${fila.asunto ?? "sin asunto"}`}
      >
        {activo ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <RotateCw className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        )}
        Reintentar
      </button>
    </li>
  );
}
