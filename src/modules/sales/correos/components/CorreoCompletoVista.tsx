"use client";

import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { useCorreoCompleto } from "../hooks/useCorreoCompleto";
import type { CorreoContenido } from "../types/correos.types";
import { formatearFechaCompleta } from "../utils/correos-formato";
import { BOTON_SECUNDARIO } from "./AccionIngreso";
import { AdjuntosDelCorreo } from "./AdjuntosDelCorreo";
import { CorreoCuerpo } from "./CorreoCuerpo";
import { Personas } from "./DetalleCorreoPartes";

function EncabezadoDelCorreo({ correo }: { correo: CorreoContenido }) {
  return (
    <header className="space-y-4">
      <h2 className="polaria-text-card-title">{correo.asunto || "Correo sin asunto"}</h2>
      <dl className="polaria-text-body-sm grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3">
        <dt className="pt-0.5 text-polaria-w-50">De</dt>
        <dd className="min-w-0">
          <Personas valor={correo.de || null} />
        </dd>
        <dt className="pt-0.5 text-polaria-w-50">Para</dt>
        <dd className="min-w-0">
          <Personas valor={correo.para || null} />
        </dd>
        <dt className="pt-0.5 text-polaria-w-50">Fecha</dt>
        <dd className="tabular-nums">
          {formatearFechaCompleta(correo.fecha)} · hora de Colombia
        </dd>
      </dl>
    </header>
  );
}

function ErrorDeLectura({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3">
      <p className="polaria-text-body-sm text-polaria-danger">{mensaje}</p>
      <button type="button" onClick={onReintentar} className={BOTON_SECUNDARIO}>
        Reintentar
      </button>
    </div>
  );
}

/**
 * El correo completo tal como llegó (REQ-104): quién lo mandó, sus adjuntos y el mensaje. Se
 * lee en Gmail al abrir la pantalla, por eso puede tardar un par de segundos.
 */
export function CorreoCompletoVista({ messageId }: { messageId: string }) {
  const { correo, error, cargando, reintentar } = useCorreoCompleto(messageId);

  if (error) return <ErrorDeLectura mensaje={error} onReintentar={reintentar} />;
  if (cargando || !correo) {
    return (
      <PolariaStatusLoading
        title="Abriendo el correo…"
        message="Lo estamos leyendo en Gmail."
      />
    );
  }
  return (
    <article className="space-y-8">
      <EncabezadoDelCorreo correo={correo} />
      <AdjuntosDelCorreo messageId={messageId} adjuntos={correo.adjuntos} />
      <CorreoCuerpo html={correo.html} texto={correo.texto} />
    </article>
  );
}
