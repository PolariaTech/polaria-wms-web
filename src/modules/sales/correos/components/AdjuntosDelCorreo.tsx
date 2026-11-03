"use client";

import { Download, ExternalLink, Loader2, Paperclip } from "lucide-react";
import { useDescargaDeAdjuntos } from "../hooks/useCorreoCompleto";
import type { AdjuntoCorreo } from "../types/correos.types";
import { esVistaPreviaSegura, formatearTamano } from "../utils/correos-formato";
import { BOTON_SECUNDARIO } from "./AccionIngreso";

interface ItemAdjuntoProps {
  adjunto: AdjuntoCorreo;
  ocupado: boolean;
  onDescargar: (adjunto: AdjuntoCorreo) => void;
  onVer: (adjunto: AdjuntoCorreo) => void;
}

function ItemAdjunto({ adjunto, ocupado, onDescargar, onVer }: ItemAdjuntoProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Paperclip className="h-4 w-4 shrink-0 text-polaria-w-50" strokeWidth={1.75} aria-hidden />
        <div className="min-w-0">
          <p className="polaria-text-body-sm break-all">{adjunto.nombre}</p>
          <p className="polaria-text-caption tabular-nums text-polaria-w-50">
            {formatearTamano(adjunto.tamano)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {esVistaPreviaSegura(adjunto.mimeType) ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onVer(adjunto)}
            aria-label={`Ver ${adjunto.nombre}`}
            className={BOTON_SECUNDARIO}
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Ver
          </button>
        ) : null}
        <button
          type="button"
          disabled={ocupado}
          onClick={() => onDescargar(adjunto)}
          aria-label={`Descargar ${adjunto.nombre}`}
          className={BOTON_SECUNDARIO}
        >
          {ocupado ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          )}
          Descargar
        </button>
      </div>
    </li>
  );
}

/** Los adjuntos del correo: nombre, tamaño, y botones para descargarlos o verlos (PDF e imágenes). */
export function AdjuntosDelCorreo({
  messageId,
  adjuntos,
}: {
  messageId: string;
  adjuntos: AdjuntoCorreo[];
}) {
  const descarga = useDescargaDeAdjuntos(messageId);
  if (adjuntos.length === 0) return null;
  return (
    <section>
      <h3 className="polaria-text-body font-semibold">
        {adjuntos.length === 1 ? "1 adjunto" : `${adjuntos.length} adjuntos`}
      </h3>
      <ul className="mt-3 divide-y divide-polaria-w-08 rounded-xl border border-polaria-w-08">
        {adjuntos.map((adjunto) => (
          <ItemAdjunto
            key={adjunto.indice}
            adjunto={adjunto}
            ocupado={descarga.ocupado === adjunto.indice}
            onDescargar={descarga.descargar}
            onVer={descarga.ver}
          />
        ))}
      </ul>
      {descarga.error ? (
        <p role="alert" className="polaria-text-body-sm mt-3 text-polaria-danger">
          {descarga.error}
        </p>
      ) : null}
    </section>
  );
}
