import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowDownToLine,
  LogOut,
  Monitor,
  TrendingDown,
  Truck,
} from "lucide-react";
import type { BodegaReporteCategoriaId } from "../types/bodega-reportes.types";

export interface BodegaReporteResumenCardConfig {
  id: BodegaReporteCategoriaId;
  label: string;
  description: string;
  icon: LucideIcon;
  panelClassName: string;
  iconWrapClassName: string;
  iconClassName: string;
  valueSuffix?: string;
  highlightBorder?: boolean;
}

export const BODEGA_REPORTES_RESUMEN_CARDS: readonly BodegaReporteResumenCardConfig[] =
  [
    {
      id: "ingresos",
      label: "Ingresos",
      description: "Archivados en historial",
      icon: Monitor,
      panelClassName: "border-polaria-t-20 bg-polaria-t-08",
      iconWrapClassName: "border-polaria-t-20 bg-polaria-t-08",
      iconClassName: "text-polaria-teal",
    },
    {
      id: "salidas",
      label: "Salidas",
      description: "OT a zona de salida ejecutadas",
      icon: LogOut,
      panelClassName: "border-polaria-t-20 bg-polaria-t-08",
      iconWrapClassName:
        "border-polaria-danger-border bg-polaria-danger-bg",
      iconClassName: "text-polaria-danger",
    },
    {
      id: "movimientos",
      label: "Movimientos",
      description: "A bodega / traslados",
      icon: ArrowDownToLine,
      panelClassName: "border-polaria-t-20 bg-polaria-t-08",
      iconWrapClassName: "border-polaria-t-20 bg-[var(--aurora-blue)]",
      iconClassName: "text-polaria-w",
    },
    {
      id: "despachados",
      label: "Despachados",
      description: "Salida definitiva",
      icon: Truck,
      panelClassName: "border-polaria-t-20 bg-polaria-t-08",
      iconWrapClassName: "border-polaria-w-08 bg-polaria-w-08",
      iconClassName: "text-polaria-w-50",
    },
    {
      id: "alertas",
      label: "Alertas",
      description: "Historial de eventos",
      icon: AlertCircle,
      panelClassName: "border-polaria-t-20 bg-polaria-t-08",
      iconWrapClassName:
        "border-polaria-danger-border bg-polaria-danger-bg",
      iconClassName: "text-polaria-danger",
    },
    {
      id: "merma",
      label: "Merma",
      description: "Declarada al cerrar órdenes de procesamiento",
      icon: TrendingDown,
      panelClassName:
        "border-polaria-warning-border bg-polaria-t-08",
      iconWrapClassName:
        "border-polaria-warning-border bg-polaria-warning-bg",
      iconClassName: "text-polaria-warning",
      valueSuffix: " kg",
      highlightBorder: true,
    },
  ] as const;

export const BODEGA_REPORTES_BAR_LABELS: Record<
  Exclude<BodegaReporteCategoriaId, "merma">,
  string
> = {
  ingresos: "Ingresos",
  salidas: "Salidas",
  movimientos: "Movimientos",
  despachados: "Despachados",
  alertas: "Alertas",
};
