"use client";

import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { POLARIA_TABLE_ROW_HEIGHT_CLASS } from "@/components/shared/table/polaria-table-layout";
import { cn } from "@/lib/utils/cn";
import type { CorreoFila } from "../types/correos.types";
import { formatearRecibido, separarAdjuntos } from "../utils/correos-formato";
import { AccionIngreso } from "./AccionIngreso";

const CELDA = "px-5 py-1 align-middle sm:px-6";
const SIN_DATO = <span className="polaria-text-body-sm text-polaria-w-50">—</span>;

/** En la tabla: el primer archivo y, si hay más, cuántos faltan. */
function AdjuntosResumen({ valor }: { valor: string | null }) {
  const nombres = separarAdjuntos(valor);
  const [primero, ...resto] = nombres;
  if (primero === undefined) return SIN_DATO;
  return (
    <span className="flex max-w-[13rem] items-center gap-1.5" title={nombres.join(", ")}>
      <span className="polaria-text-body-sm min-w-0 truncate text-polaria-w-50">
        {primero}
      </span>
      {resto.length > 0 ? (
        <span
          aria-label={`y ${resto.length} adjunto${resto.length === 1 ? "" : "s"} más`}
          className="polaria-text-caption shrink-0 rounded-md border border-polaria-w-08 bg-polaria-w-08 px-1.5 tabular-nums text-polaria-w"
        >
          +{resto.length}
        </span>
      ) : null}
    </span>
  );
}

function BotonAsunto({
  fila,
  onVerDetalle,
}: {
  fila: CorreoFila;
  onVerDetalle: (messageId: string) => void;
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      title={fila.asunto ?? "Ver el detalle del correo"}
      onClick={(evento) => {
        evento.stopPropagation();
        onVerDetalle(fila.messageId);
      }}
      className={cn(
        "polaria-text-body-sm line-clamp-2 max-w-[22rem] rounded text-left transition-colors hover:text-polaria-teal",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
      )}
    >
      {fila.asunto ?? "Sin asunto"}
    </button>
  );
}

function CeldaMotivo({ motivo }: { motivo: string | null }) {
  if (!motivo) return SIN_DATO;
  return (
    <span className="line-clamp-2 max-w-[16rem]" title={motivo}>
      <PolariaTableBadge variant="warning">{motivo}</PolariaTableBadge>
    </span>
  );
}

interface FilaCorreoProps {
  fila: CorreoFila;
  onVerDetalle: (messageId: string) => void;
  onIngresar: (messageId: string) => void;
}

/** Una fila de la lista: todo el renglón abre el detalle, salvo la columna de ingreso. */
export function FilaCorreo({ fila, onVerDetalle, onIngresar }: FilaCorreoProps) {
  return (
    <tr
      onClick={() => onVerDetalle(fila.messageId)}
      className={cn(
        POLARIA_TABLE_ROW_HEIGHT_CLASS,
        "cursor-pointer border-t border-polaria-w-08 text-polaria-w transition-colors hover:bg-polaria-t-08",
      )}
    >
      <td className={cn(CELDA, "polaria-text-body-sm whitespace-nowrap tabular-nums text-polaria-w-50")}>
        {formatearRecibido(fila.recibidoEn)}
      </td>
      <td className={CELDA}>
        <span className="polaria-text-body-sm block max-w-[14rem] truncate" title={fila.de ?? undefined}>
          {fila.de ?? "—"}
        </span>
      </td>
      <td className={CELDA}>
        <BotonAsunto fila={fila} onVerDetalle={onVerDetalle} />
      </td>
      <td className={CELDA}>
        <AdjuntosResumen valor={fila.adjunto} />
      </td>
      <td className={CELDA}>
        <CeldaMotivo motivo={fila.motivo} />
      </td>
      <td
        className={cn(CELDA, "whitespace-nowrap")}
        onClick={(evento) => evento.stopPropagation()}
      >
        <AccionIngreso fila={fila} onIngresar={onIngresar} />
      </td>
    </tr>
  );
}
