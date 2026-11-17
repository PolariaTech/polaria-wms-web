"use client";

import { POLARIA_TABLE_ROW_HEIGHT_CLASS } from "@/components/shared/table/polaria-table-layout";
import { cn } from "@/lib/utils/cn";
import type { CorreoFila } from "../types/correos.types";
import { formatearRecibido, separarAdjuntos } from "../utils/correos-formato";
import { estadoDelIngreso } from "../utils/estado-ingreso";
import { AccionIngreso, AvisoDelFlujo } from "./AccionIngreso";

const CELDA = "px-5 py-1 align-middle sm:px-6";
const SIN_DATO = <span className="polaria-text-body-sm text-polaria-w-50">—</span>;

/** En la tabla: el primer archivo y, si hay más, cuántos faltan. */
function AdjuntosResumen({ valor }: { valor: string | null }) {
  const nombres = separarAdjuntos(valor);
  const [primero, ...resto] = nombres;
  if (primero === undefined) return SIN_DATO;
  return (
    <span className="flex max-w-full items-center gap-1.5" title={nombres.join(", ")}>
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
      title={fila.asunto ?? "Ver el correo completo"}
      onClick={(evento) => {
        evento.stopPropagation();
        onVerDetalle(fila.messageId);
      }}
      className={cn(
        "polaria-text-body-sm line-clamp-2 max-w-full rounded text-left transition-colors hover:text-polaria-teal",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
      )}
    >
      {fila.asunto ?? "Sin asunto"}
    </button>
  );
}

function CeldaMotivo({ fila }: { fila: CorreoFila }) {
  const { motivo } = fila;
  const estado = estadoDelIngreso(fila);
  const aviso = estado.tipo === "ingresar" ? estado.aviso : null;
  if (aviso) return <AvisoDelFlujo aviso={aviso} motivo={motivo} />;
  if (!motivo) return SIN_DATO;
  // El recorte va sobre el texto de adentro: un badge `inline-flex` no recorta a su hijo, y un
  // motivo largo estiraba la fila. Con dos líneas máximo la fila conserva su alto; el motivo
  // completo se lee en el correo completo (clic en la fila).
  return (
    <span
      title={motivo}
      className="polaria-text-badge inline-flex max-w-full rounded-lg border border-polaria-warning-border bg-polaria-warning-bg px-2.5 py-1 text-polaria-warning"
    >
      <span className="line-clamp-2 break-words">{motivo}</span>
    </span>
  );
}

interface FilaCorreoProps {
  fila: CorreoFila;
  abierta: boolean;
  onVerDetalle: (messageId: string) => void;
  onIngresar: (messageId: string) => void;
}

/** Una fila de la lista: todo el renglón abre el correo completo, salvo la columna de ingreso. */
export function FilaCorreo({ fila, abierta, onVerDetalle, onIngresar }: FilaCorreoProps) {
  return (
    <tr
      aria-current={abierta ? "true" : undefined}
      onClick={() => onVerDetalle(fila.messageId)}
      className={cn(
        POLARIA_TABLE_ROW_HEIGHT_CLASS,
        "cursor-pointer border-t border-polaria-w-08 text-polaria-w transition-colors hover:bg-polaria-t-08",
        abierta && "border-l-2 border-l-polaria-teal bg-polaria-t-08",
      )}
    >
      <td className={cn(CELDA, "polaria-text-body-sm tabular-nums text-polaria-w-50")}>
        {formatearRecibido(fila.recibidoEn)}
      </td>
      <td className={CELDA}>
        <span className="polaria-text-body-sm block truncate" title={fila.de ?? undefined}>
          {fila.de ?? "—"}
        </span>
        {abierta ? (
          <span className="polaria-text-caption block text-polaria-teal">Último abierto</span>
        ) : null}
      </td>
      <td className={CELDA}>
        <BotonAsunto fila={fila} onVerDetalle={onVerDetalle} />
      </td>
      <td className={CELDA}>
        <AdjuntosResumen valor={fila.adjunto} />
      </td>
      <td className={CELDA}>
        <CeldaMotivo fila={fila} />
      </td>
      <td className={CELDA} onClick={(evento) => evento.stopPropagation()}>
        <AccionIngreso fila={fila} onIngresar={onIngresar} />
      </td>
    </tr>
  );
}
