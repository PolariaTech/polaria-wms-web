"use client";

import { Calendar, ClipboardList, Fingerprint, MapPin, User } from "lucide-react";
import { PolariaRequestFlowCard } from "@/components/shared/requests";
import { formatDateTime } from "@/components/shared/utils/formatters";
import {
  formatTipoIntegracion,
  isSolicitudIntegracionPendiente,
} from "@/modules/account-integration/integracion/constants/integration-types";
import { INTEGRACION_CARD_HINT } from "../constants/integration";
import type { ConfiguratorSolicitudIntegracionRow } from "../services/integracion.service";

interface IntegracionSolicitudCardProps {
  row: ConfiguratorSolicitudIntegracionRow;
  onExecute?: (row: ConfiguratorSolicitudIntegracionRow) => void;
}

export function IntegracionSolicitudCard({
  row,
  onExecute,
}: IntegracionSolicitudCardProps) {
  const isPending = isSolicitudIntegracionPendiente(row.estado);
  const solicitante =
    row.solicitanteCorreo?.trim() || row.solicitanteNombre?.trim() || "—";

  return (
    <PolariaRequestFlowCard
      hint={INTEGRACION_CARD_HINT}
      source={{
        label: "Cuenta",
        value: row.cuentaNombre,
        icon: MapPin,
        tone: "teal",
      }}
      destination={{
        label: "Bodega externa",
        value: row.bodegaNombre,
        icon: ClipboardList,
        tone: "warning",
      }}
      typeLabel={formatTipoIntegracion(row.tipoIntegracion)}
      metadata={[
        {
          icon: User,
          label: "Solicitado por",
          value: solicitante,
        },
        {
          icon: Calendar,
          label: "Fecha y hora",
          value: formatDateTime(row.createdAt),
        },
        {
          icon: Fingerprint,
          label: "ID de solicitud",
          value: row.idSolicitudIntegracion,
        },
      ]}
      isInteractive={isPending}
      onClick={
        isPending && onExecute ? () => onExecute(row) : undefined
      }
    />
  );
}
