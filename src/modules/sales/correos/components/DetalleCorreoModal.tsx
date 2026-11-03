"use client";

import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import type { CorreoFila } from "../types/correos.types";
import { formatearFechaCompleta } from "../utils/correos-formato";
import { AccionIngreso, puedeIngresarAMano } from "./AccionIngreso";
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
