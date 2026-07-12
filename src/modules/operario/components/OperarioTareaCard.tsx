"use client";

import { Calendar, Fingerprint, LayoutGrid, MapPin } from "lucide-react";
import { PolariaRequestFlowCard } from "@/components/shared/requests";
import { formatDateTime } from "@/components/shared/utils/formatters";
import type { OperarioTareaView } from "../types/operario-tarea.types";
import { OPERARIO_TAREA_CARD_HINT } from "../constants/operario-a-bodega";
import { resolveOperarioTareaFlow } from "../utils/operario-tarea-card";

interface OperarioTareaCardProps {
  tarea: OperarioTareaView;
  onComplete?: (tarea: OperarioTareaView) => void;
  disabled?: boolean;
}

export function OperarioTareaCard({
  tarea,
  onComplete,
  disabled = false,
}: OperarioTareaCardProps) {
  const flow = resolveOperarioTareaFlow(tarea);
  const isPending = tarea.estado === "pendiente" || tarea.estado === "en_proceso";
  const isInteractive = isPending && !disabled && Boolean(onComplete);

  return (
    <PolariaRequestFlowCard
      hint={OPERARIO_TAREA_CARD_HINT}
      source={{
        label: flow.sourceLabel,
        value: flow.sourceValue,
        icon: MapPin,
        tone: "teal",
      }}
      destination={{
        label: flow.destinationLabel,
        value: flow.destinationValue,
        icon: LayoutGrid,
        tone: "warning",
      }}
      typeLabel={flow.typeLabel}
      metadata={[
        {
          icon: Calendar,
          label: "Fecha y hora",
          value: formatDateTime(tarea.created_at),
        },
        {
          icon: Fingerprint,
          label: "ID de tarea",
          value: tarea.id_tarea,
        },
      ]}
      isInteractive={isInteractive}
      onClick={isInteractive && onComplete ? () => onComplete(tarea) : undefined}
    />
  );
}
