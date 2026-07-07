import { ROUTES } from "@/config/routes";
import type { BodegaOperacionTab } from "@/modules/warehouses";

export type AdministradorBodegaTabId = "estado" | "reportes";

export const ADMINISTRADOR_BODEGA_HOME_ROUTE =
  ROUTES.dashboardAdministradorBodegaEstado;

export const ADMINISTRADOR_BODEGA_OPERACION_TABS: readonly BodegaOperacionTab<AdministradorBodegaTabId>[] =
  [
    {
      id: "estado",
      label: "Estado de bodega",
      href: ROUTES.dashboardAdministradorBodegaEstado,
    },
    {
      id: "reportes",
      label: "Reportes",
      href: ROUTES.dashboardAdministradorBodegaReportes,
    },
  ];
