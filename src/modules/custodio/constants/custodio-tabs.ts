import type { BodegaOperacionTab } from "@/modules/warehouses";
import {
  CUSTODIO_TAB_ROUTES,
  type CustodioTabId,
} from "./custodio-routes";

export const CUSTODIO_TABS: readonly BodegaOperacionTab<CustodioTabId>[] = [
  { id: "ingreso", label: "Ingreso", href: CUSTODIO_TAB_ROUTES.ingreso },
  {
    id: "orden-compra",
    label: "Orden de compra",
    href: CUSTODIO_TAB_ROUTES["orden-compra"],
  },
  {
    id: "orden-venta",
    label: "Orden de venta",
    href: CUSTODIO_TAB_ROUTES["orden-venta"],
  },
] as const;
