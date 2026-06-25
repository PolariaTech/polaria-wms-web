export const ROUTES = {
  home: "/",
  login: "/login",
  sso: "/auth/sso",
  /** Dominio configurador (scope platform) */
  configurator: "/configurador",
  configuratorCreation: "/configurador/creacion",
  configuratorCreationAccounts: "/configurador/creacion/cuentas",
  configuratorCreationInternalWarehouse: "/configurador/creacion/bodega-interna",
  configuratorCreationExternalWarehouse: "/configurador/creacion/bodega-externa",
  configuratorAssignment: "/configurador/asignacion",
  configuratorAssignmentUsers: "/configurador/asignacion/usuarios",
  configuratorIntegration: "/configurador/integracion",
  /** Alias legacy — redirige a configurador */
  platform: "/platform",
  /** Dominio tenant (scope tenant) */
  dashboard: "/dashboard",
  dashboardIngreso: "/dashboard/ingreso",
  dashboardMapa: "/dashboard/mapa",
  dashboardProcesamiento: "/dashboard/procesamiento",
  dashboardVentas: "/dashboard/ventas",
  dashboardTransporte: "/dashboard/transporte",
  dashboardReporteria: "/dashboard/reporteria",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export function getPostLoginRoute(scope: "platform" | "tenant"): string {
  return scope === "platform" ? ROUTES.configurator : ROUTES.dashboard;
}
