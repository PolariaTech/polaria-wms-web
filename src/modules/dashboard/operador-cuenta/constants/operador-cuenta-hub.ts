import {
  ExternalLink,
  Package,
  ShoppingCart,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/config/routes";

export type OperadorCuentaHubOptionId =
  | "proveedor"
  | "bodega-externa"
  | "bodega-interna"
  | "ventas";

export interface OperadorCuentaHubOption {
  id: OperadorCuentaHubOptionId;
  title: string;
  icon: LucideIcon;
  href: string;
}

export const OPERADOR_CUENTA_HUB_OPTIONS: readonly OperadorCuentaHubOption[] = [
  {
    id: "proveedor",
    title: "Proveedor",
    icon: Package,
    href: ROUTES.dashboardCompras,
  },
  {
    id: "ventas",
    title: "Ventas",
    icon: ShoppingCart,
    href: ROUTES.dashboardVentas,
  },
  {
    id: "bodega-interna",
    title: "Bodega interna",
    icon: Warehouse,
    href: ROUTES.dashboardBodegaInternaCuenta,
  },
  {
    id: "bodega-externa",
    title: "Bodega externa",
    icon: ExternalLink,
    href: ROUTES.dashboardBodegaExternaCuenta,
  },
] as const;

export function getOperadorCuentaHubHref(
  optionId: OperadorCuentaHubOptionId,
): string {
  const option = OPERADOR_CUENTA_HUB_OPTIONS.find((item) => item.id === optionId);
  if (!option) {
    throw new Error(`Opción de hub operador cuenta desconocida: ${optionId}`);
  }

  return option.href;
}
