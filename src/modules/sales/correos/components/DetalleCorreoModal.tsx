"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { ROUTES } from "@/config/routes";
import type { CorreoFila } from "../types/correos.types";
import { formatearFechaCompleta } from "../utils/correos-formato";
import { AccionIngreso, BOTON_SECUNDARIO, puedeIngresarAMano } from "./AccionIngreso";
import {
  ParticipantesDelCorreo,
  RegistroDelCorreo,
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

/** Qué hace «Ingresar como OV»: va en el cuerpo, donde el texto tiene ancho para leerse completo. */
function AvisoDelBoton() {
  return (
    <p className="polaria-text-caption text-polaria-w-50">
      Crea una orden de venta por confirmar leyendo el correo y su adjunto.
    </p>
  );
}

/** Lleva al correo tal como llegó (cuerpo y adjuntos), en esta misma pestaña. */
function EnlaceCorreoCompleto({ messageId }: { messageId: string }) {
  return (
    <Link href={ROUTES.dashboardVentasCorreo(messageId)} className={BOTON_SECUNDARIO}>
      <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      Ver correo completo
    </Link>
  );
}

/**
 * Detalle del correo (REQ-104). Primero lo que decide si es un pedido: qué dijo el flujo y por
 * qué; luego quién lo mandó y a quién, como en un cliente de correo; al final, en pequeño, cuándo
 * quedó registrado. Si el ingreso falla, el motivo sale como alerta del cuerpo del modal.
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
      error={fila.ingreso?.estado === "error" ? fila.ingreso.error : null}
      footerAction={<AccionIngreso fila={fila} onIngresar={onIngresar} />}
    >
      <div className="space-y-5">
        <VeredictoFlujo fila={fila} />
        {puedeIngresarAMano(fila) ? <AvisoDelBoton /> : null}
        <ParticipantesDelCorreo fila={fila} />
        <RegistroDelCorreo fila={fila} />
      </div>
    </PolariaFormModal>
  );
}
