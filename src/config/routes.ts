export const ROUTES = {
  home: "/",
  login: "/login",
  sso: "/auth/sso",
  /** Dominio configurador (scope platform) */
  configurator: "/configurador",
  configuratorCreation: "/configurador/creacion",
  configuratorCreationCompanies: "/configurador/creacion/empresas",
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
  dashboardAdminAssignmentCreation:
    "/dashboard/administracion/asignacion-creacion",
  dashboardAdminCreationSuppliers:
    "/dashboard/administracion/asignacion-creacion/proveedores",
  dashboardAdminCreationClients:
    "/dashboard/administracion/asignacion-creacion/clientes",
  dashboardAdminCreationBuyers:
    "/dashboard/administracion/asignacion-creacion/compradores",
  dashboardAdminCreationTrucks:
    "/dashboard/administracion/asignacion-creacion/camiones",
  dashboardAdminCreationPlants:
    "/dashboard/administracion/asignacion-creacion/plantas",
  dashboardAdminAssignmentUsers:
    "/dashboard/administracion/asignacion-creacion/usuarios",
  dashboardAdminAssignmentInternalWarehouse:
    "/dashboard/administracion/asignacion-creacion/bodega-interna",
  dashboardAdminAssignmentExternalWarehouse:
    "/dashboard/administracion/asignacion-creacion/bodega-externa",
  dashboardCatalog: "/dashboard/administracion/catalogo",
  dashboardIngreso: "/dashboard/ingreso",
  /** Operario — ingresos, salidas, traslados y tareas */
  dashboardOperarioOperacion: "/dashboard/operario/operacion",
  /** Procesador — misma vista operativa que operario (por ahora) */
  dashboardProcesadorOperacion: "/dashboard/procesador/operacion",
  dashboardCompras: "/dashboard/compras",
  dashboardBodegaExternaCuenta: "/dashboard/bodega-externa",
  dashboardBodegaExternaCuentaIntegracion:
    "/dashboard/bodega-externa/integracion",
  dashboardBodegaInternaCuenta: "/dashboard/bodega-interna",
  dashboardBodegaInternaCuentaProcesamiento:
    "/dashboard/bodega-interna/procesamiento",
  dashboardMapa: "/dashboard/mapa",
  dashboardProcesamiento: "/dashboard/procesamiento",
  dashboardVentas: "/dashboard/ventas",
  dashboardVentasOrdenes: "/dashboard/ventas/ordenes",
  dashboardTransporte: "/dashboard/transporte",
  dashboardReporteria: "/dashboard/reporteria",
  /** Administrador de bodega — operación (independiente del jefe de bodega) */
  dashboardAdministradorBodegaEstado:
    "/dashboard/administrador-bodega/estado-bodega",
  dashboardAdministradorBodegaReportes:
    "/dashboard/administrador-bodega/reportes-bodega",
  /** Jefe de bodega — operación (extensible con opciones propias) */
  dashboardJefeBodegaEstado: "/dashboard/jefe-bodega/estado-bodega",
  dashboardJefeBodegaBodegaABodega: "/dashboard/jefe-bodega/bodega-a-bodega",
  /** Custodio — ingreso / salida operativa */
  dashboardCustodioIngreso: "/dashboard/custodio/ingreso",
  dashboardCustodioOrdenCompra: "/dashboard/custodio/orden-compra",
  dashboardCustodioOrdenVenta: "/dashboard/custodio/orden-venta",
  /** @deprecated El jefe de bodega usa solo estado de bodega como vista principal */
  dashboardJefeBodegaReportes: "/dashboard/jefe-bodega/reportes-bodega",
  /** @deprecated Usar rutas por rol (administrador-bodega / jefe-bodega) */
  dashboardEstadoBodega: "/dashboard/estado-bodega",
  /** @deprecated Usar rutas por rol (administrador-bodega / jefe-bodega) */
  dashboardReportesBodega: "/dashboard/reportes-bodega",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export function getPostLoginRoute(scope: "platform" | "tenant"): string {
  return scope === "platform" ? ROUTES.configurator : ROUTES.dashboard;
}
