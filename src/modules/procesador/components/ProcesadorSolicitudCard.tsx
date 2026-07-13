"use client";

import { Calendar, Fingerprint, LayoutGrid, MapPin } from "lucide-react";
import { PolariaRequestFlowCard } from "@/components/shared/requests";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { formatKilos } from "@/modules/processing/shared/constants/processing-status";
import type { SolicitudProcesamientoOperadorRow } from "@/modules/processing";
import { PROCESADOR_SOLICITUD_CARD_HINT } from "../constants/procesador-procesamiento";

interface ProcesadorSolicitudCardProps {
  solicitud: SolicitudProcesamientoOperadorRow;
  onSelect?: (solicitud: SolicitudProcesamientoOperadorRow) => void;
  disabled?: boolean;
}

export function ProcesadorSolicitudCard({
  solicitud,
  onSelect,
  disabled = false,
}: ProcesadorSolicitudCardProps) {
  const isInteractive = !disabled && Boolean(onSelect);

  return (
    <PolariaRequestFlowCard
      hint={PROCESADOR_SOLICITUD_CARD_HINT}
      source={{
        label: "Primario",
        value: solicitud.primario,
        icon: MapPin,
        tone: "teal",
      }}
      destination={{
        label: "Secundario",
        value: solicitud.secundario,
        icon: LayoutGrid,
        tone: "warning",
      }}
      typeLabel="Procesar"
      metadata={[
        {
          icon: Calendar,
          label: "Fecha y hora",
          value: formatDateTime(solicitud.fecha),
        },
        {
          icon: Fingerprint,
          label: "Orden",
          value: solicitud.orden,
        },
        {
          icon: MapPin,
          label: "Insumo",
          value: formatKilos(solicitud.insumoPrimario),
        },
      ]}
      isInteractive={isInteractive}
      onClick={
        isInteractive && onSelect ? () => onSelect(solicitud) : undefined
      }
    />
  );
}
