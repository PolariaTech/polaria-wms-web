"use client";

import { ExternalLink } from "lucide-react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { ROUTES } from "@/config/routes";
import type { CorreoFila } from "../types/correos.types";
import { formatearFechaCompleta } from "../utils/correos-formato";
import { AccionIngreso, BOTON_SECUNDARIO, puedeIngresarAMano } from "./AccionIngreso";
import {
  DatosDeN8n,
  ParticipantesDelCorreo,
  VeredictoFlujo,
} from "./DetalleCorreoPartes";

interface DetalleCorreoModalProps {
  fila: CorreoFila;
  onClose: () => void;
  onIngresar: (messageId: string) => void;
}

function descripcionDeRecepcion(recibidoEn: string | null): string {
  return recibidoEn
    ? `Recibido el ${formatearFechaCompleta(recibidoEn)} · hora de Colombia`
    : "Sin fecha de recepción";
}

function AvisoDelBoton() {
  return (
    <p className="polaria-text-caption max-w-xs text-center text-polaria-w-50">
      Crea una orden de venta por confirmar leyendo el correo y su adjunto.
    </p>
  );
}

/** Abre el correo tal como llegó (cuerpo y adjuntos) en una pestaña nueva. */
function EnlaceCorreoCompleto({ messageId }: { messageId: string }) {
  return (
    <a
      href={ROUTES.dashboardVentasCorreo(messageId)}
      target="_blank"
      rel="noopener noreferrer"
      className={BOTON_SECUNDARIO}
    >
      <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      Ver correo completo
    </a>
  );
}

/**
 * Detalle del correo (REQ-104). Primero lo que decide si es un pedido: qué dijo el flujo y por
 * qué; luego quién lo mandó y a quién, como en un cliente de correo; al final, en pequeño, los
 * datos de referencia de n8n.
 */
export function DetalleCorreoModal({
  fila,
  onClose,
  onIngresar,
}: DetalleCorreoModalProps) {
  return (
    <PolariaFormModal
      open
      onClose={onClose}
      title={fila.asunto ?? "Correo sin asunto"}
      description={descripcionDeRecepcion(fila.recibidoEn)}
      onSubmit={(evento) => evento.preventDefault()}
      asForm={false}
      compact
      size="lg"
      hideHeaderClose
      cancelLabel="Cerrar"
      footerLeading={<EnlaceCorreoCompleto messageId={fila.messageId} />}
      footerCenter={puedeIngresarAMano(fila) ? <AvisoDelBoton /> : undefined}
      footerAction={<AccionIngreso fila={fila} onIngresar={onIngresar} />}
    >
      <div className="space-y-5">
        <VeredictoFlujo fila={fila} />
        <ParticipantesDelCorreo fila={fila} />
        <DatosDeN8n fila={fila} />
      </div>
    </PolariaFormModal>
  );
}
