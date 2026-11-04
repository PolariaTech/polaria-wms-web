"use client";

import {
  getPaginationPlaceholderCount,
  getTableBodyMinHeightStyle,
  POLARIA_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/shared/table/polaria-table-layout";
import { cn } from "@/lib/utils/cn";
import type { CorreoFila } from "../types/correos.types";
import { FilaCorreo } from "./FilaCorreo";

const ENCABEZADOS = [
  "Recibido",
  "Remitente",
  "Asunto",
  "Adjunto",
  "Motivo",
  "Ingreso",
] as const;

/** Anchos fijos que suman 100 %: la tabla se reparte el ancho y nunca desborda hacia los lados. */
const ANCHOS_COLUMNAS = ["13%", "15%", "20%", "13%", "19%", "20%"] as const;

const ENCABEZADO = "polaria-text-label px-5 py-3 text-polaria-w-50 sm:px-6";

function FilaVacia({ texto }: { texto: string }) {
  return (
    <tr>
      <td
        colSpan={ENCABEZADOS.length}
        className="polaria-text-body-sm px-5 py-10 text-center text-polaria-w-50 sm:px-6"
      >
        {texto}
      </td>
    </tr>
  );
}

/** Filas en blanco hasta completar la página: la tabla no cambia de altura al paginar. */
function RellenoDeTabla({ faltan }: { faltan: number }) {
  return Array.from({ length: faltan }, (_valor, indice) => (
    <tr
      key={`relleno-${indice}`}
      aria-hidden
      className={cn(POLARIA_TABLE_ROW_HEIGHT_CLASS, "border-t border-polaria-w-08")}
    >
      <td colSpan={ENCABEZADOS.length} className="px-5 py-0 sm:px-6">
        &nbsp;
      </td>
    </tr>
  ));
}

interface CorreosCuerpoTablaProps {
  filas: CorreoFila[];
  tamano: number;
  cargando: boolean;
  textoVacio: string;
  onVerDetalle: (messageId: string) => void;
  onIngresar: (messageId: string) => void;
}

export function CorreosCuerpoTabla({
  filas,
  tamano,
  cargando,
  textoVacio,
  onVerDetalle,
  onIngresar,
}: CorreosCuerpoTablaProps) {
  return (
    <div
      className="overflow-x-hidden"
      style={getTableBodyMinHeightStyle(tamano)}
      aria-busy={cargando}
    >
      <table
        className={cn("w-full table-fixed text-left transition-opacity", cargando && "opacity-60")}
      >
        <colgroup>
          {ANCHOS_COLUMNAS.map((ancho, indice) => (
            <col key={ENCABEZADOS[indice]} style={{ width: ancho }} />
          ))}
        </colgroup>
        <thead className="border-b border-polaria-w-08">
          <tr>
            {ENCABEZADOS.map((titulo) => (
              <th key={titulo} scope="col" className={ENCABEZADO}>
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? <FilaVacia texto={textoVacio} /> : null}
          {filas.map((fila) => (
            <FilaCorreo
              key={fila.messageId}
              fila={fila}
              onVerDetalle={onVerDetalle}
              onIngresar={onIngresar}
            />
          ))}
          <RellenoDeTabla faltan={getPaginationPlaceholderCount(filas.length, tamano, true)} />
        </tbody>
      </table>
    </div>
  );
}
