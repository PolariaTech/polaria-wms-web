import {
  AlertTriangle,
  ClipboardList,
  Map,
  Package,
  PackagePlus,
  Settings2,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import { WmsRol } from "@/constants/roles";
import type { DashboardWidgetId } from "../types/dashboard.types";

export interface DashboardQuickAction {
  label: string;
  href: string;
}

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  kind: "metric" | "actions";
  quickActions?: readonly DashboardQuickAction[];
}

export const DASHBOARD_WIDGETS: Record<
  DashboardWidgetId,
  DashboardWidgetDefinition
> = {
  "ov-pendientes": {
    id: "ov-pendientes",
    title: "OV pendientes",
    description: "Órdenes de venta en preparación o despacho parcial",
    icon: ShoppingCart,
    href: ROUTES.dashboardVentas,
    kind: "metric",
  },
  "sol-compra": {
    id: "sol-compra",
    title: "SOL compra",
    description: "Solicitudes de compra en borrador o pendientes de aprobación",
    icon: PackagePlus,
    href: ROUTES.dashboardCompras,
    kind: "metric",
  },
  "alertas-cuenta": {
    id: "alertas-cuenta",
    title: "Alertas cuenta",
    description: "Alertas operativas abiertas a nivel cuenta",
    icon: AlertTriangle,
    kind: "metric",
  },
  "stock-resumido": {
    id: "stock-resumido",
    title: "Stock resumido",
    description: "Posiciones activas en inventario de la bodega",
    icon: Package,
    href: ROUTES.dashboardMapa,
    kind: "metric",
  },
  "tareas-cola": {
    id: "tareas-cola",
    title: "Tareas en cola",
    description: "Tareas pendientes sin asignar en la bodega",
    icon: ClipboardList,
    kind: "metric",
  },
  "alertas-bodega": {
    id: "alertas-bodega",
    title: "Alertas bodega",
    description: "Alertas operativas abiertas en la bodega activa",
    icon: AlertTriangle,
    kind: "metric",
  },
  "tareas-asignadas": {
    id: "tareas-asignadas",
    title: "Tareas asignadas",
    description: "Trabajo pendiente asignado a tu usuario",
    icon: ClipboardList,
    kind: "metric",
  },
  "accesos-picking": {
    id: "accesos-picking",
    title: "Accesos rápidos picking",
    description: "Atajos a mapa y despacho",
    icon: Map,
    kind: "actions",
    quickActions: [
      { label: "Mapa de bodega", href: ROUTES.dashboardMapa },
      { label: "Ventas / despacho", href: ROUTES.dashboardVentas },
    ],
  },
  "cola-procesamiento": {
    id: "cola-procesamiento",
    title: "Cola procesamiento",
    description: "Solicitudes de procesamiento activas",
    icon: Settings2,
    href: ROUTES.dashboardProcesamiento,
    kind: "metric",
  },
  "guias-transporte": {
    id: "guias-transporte",
    title: "Guías transporte",
    description: "Guías de envío pendientes o en tránsito",
    icon: Truck,
    href: ROUTES.dashboardTransporte,
    kind: "metric",
  },
};

/** Matriz rol WMS → widgets visibles en el dashboard. */
export const ROLE_DASHBOARD_WIDGETS: Readonly<
  Record<WmsRol, readonly DashboardWidgetId[]>
> = {
  [WmsRol.configurador]: [],
  [WmsRol.administrador_cuenta]: [
    "ov-pendientes",
    "sol-compra",
    "alertas-cuenta",
  ],
  [WmsRol.operador_cuenta]: [],
  [WmsRol.administrador_bodega]: [
    "stock-resumido",
    "tareas-cola",
    "alertas-bodega",
  ],
  [WmsRol.jefe_bodega]: [
    "stock-resumido",
    "tareas-cola",
    "alertas-bodega",
  ],
  [WmsRol.operario]: ["tareas-asignadas", "accesos-picking"],
  [WmsRol.custodio]: ["tareas-asignadas", "accesos-picking"],
  [WmsRol.procesador]: ["cola-procesamiento"],
  [WmsRol.transportista]: ["guias-transporte"],
};

export function getWidgetsForRole(
  idRol: string | null | undefined,
): DashboardWidgetDefinition[] {
  if (!idRol) return [];

  const widgetIds =
    ROLE_DASHBOARD_WIDGETS[idRol as WmsRol] ??
    ROLE_DASHBOARD_WIDGETS[WmsRol.operario];

  return widgetIds.map((id) => DASHBOARD_WIDGETS[id]);
}
