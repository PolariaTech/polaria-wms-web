"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { CargaConPolo } from "@/modules/sales/ordenes/components/modals/OrdenVentaCorreccionCorreoPanel";
import type { RangoEspera } from "@/modules/sales/ordenes/utils/ot/aplicar-correccion-correo";
import { useCorreoCompleto } from "../hooks/useCorreoCompleto";
import type { CorreoContenido } from "../types/correos.types";
import { formatearFechaCompleta } from "../utils/correos-formato";
import { BOTON_SECUNDARIO } from "./AccionIngreso";
import { AdjuntosDelCorreo } from "./AdjuntosDelCorreo";
import { CorreoCuerpo } from "./CorreoCuerpo";
import { Personas } from "./DetalleCorreoPartes";

/** Lo que suele tardar la primera lectura en Gmail; la siguiente, desde la memoria del api, es casi inmediata. */
const ESPERA_LECTURA_DEL_CORREO: RangoEspera = { minSeg: 3, maxSeg: 15 };

/**
 * Regresa a la lista de donde se vino. Si la pantalla se abrió directo (sin historial en esta
 * pestaña), lleva a los correos descartados para no sacar a la persona de la aplicación.
 */
function VolverALosCorreos() {
  const router = useRouter();
  const volver = () => {
    if (window.history.length > 1) router.back();
    else router.push(ROUTES.dashboardVentasCorreosDescartados);
  };

  return (
    <button type="button" onClick={volver} className={BOTON_SECUNDARIO}>
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      Volver a los correos
    </button>
  );
}

/** Tope para esperar a que el marco del mensaje termine de dibujar antes de mostrar todo. */
const PLAZO_DEL_CUERPO_MS = 5000;

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
  const [cuerpoListo, setCuerpoListo] = useState(false);
  const hayCorreo = !cargando && correo !== null;

  // Si el marco nunca avisara que cargó, no se deja a la persona esperando para siempre.
  useEffect(() => {
    if (!hayCorreo || cuerpoListo) return;
    const plazo = setTimeout(() => setCuerpoListo(true), PLAZO_DEL_CUERPO_MS);
    return () => clearTimeout(plazo);
  }, [hayCorreo, cuerpoListo]);

  return (
    <div className="space-y-6">
      <VolverALosCorreos />
      {error ? <ErrorDeLectura mensaje={error} onReintentar={reintentar} /> : null}
      {correo && hayCorreo ? (
        // Se arma mientras Polo sigue a la vista, para que la persona vea el correo ya completo.
        <article
          aria-busy={!cuerpoListo}
          className={cn("space-y-8", !cuerpoListo && "invisible")}
        >
          <EncabezadoDelCorreo correo={correo} />
          <AdjuntosDelCorreo messageId={messageId} adjuntos={correo.adjuntos} />
          <CorreoCuerpo
            html={correo.html}
            texto={correo.texto}
            onCargado={() => setCuerpoListo(true)}
          />
        </article>
      ) : null}
      {cuerpoListo || error ? null : (
        <CargaConPolo
          titulo="Abriendo el correo…"
          detalle={hayCorreo ? "Preparando el mensaje." : "Lo estamos leyendo en Gmail."}
          espera={ESPERA_LECTURA_DEL_CORREO}
        />
      )}
    </div>
  );
}
