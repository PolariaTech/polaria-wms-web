import { ROUTES } from "@/config/routes";

export const CUSTODIO_HOME_ROUTE = ROUTES.dashboardCustodioIngreso;

export type CustodioTabId = "ingreso" | "orden-compra" | "orden-venta";

export const CUSTODIO_TAB_ROUTES: Record<CustodioTabId, string> = {
  ingreso: ROUTES.dashboardCustodioIngreso,
  "orden-compra": ROUTES.dashboardCustodioOrdenCompra,
  "orden-venta": ROUTES.dashboardCustodioOrdenVenta,
};
