import {
  ArrowLeftRight,
  Box,
  ClipboardList,
  PackagePlus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/config/routes";

export type JefeBodegaActionId =
  | "ingresos"
  | "bodega-a-bodega"
  | "revisar"
  | "ordenes-venta"
  | "crear-salida";

export interface JefeBodegaAction {
  id: JefeBodegaActionId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Si true, el botón no abre modal (p. ej. próximamente). */
  disabled?: boolean;
}

export const JEFE_BODEGA_HOME_ROUTE = ROUTES.dashboardJefeBodegaEstado;

/** Accesos rápidos del jefe de bodega — cada uno abre un modal sobre estado de bodega. */
export const JEFE_BODEGA_ACTIONS: readonly JefeBodegaAction[] = [
  {
    id: "ingresos",
    title: "Ingresos",
    subtitle: "Registrar entrada",
    icon: PackagePlus,
  },
  {
    id: "bodega-a-bodega",
    title: "Bodega a Bodega",
    subtitle: "Transferir cajas",
    icon: ArrowLeftRight,
  },
  {
    id: "revisar",
    title: "Revisar",
    subtitle: "Consultar inventario",
    icon: Search,
  },
  {
    id: "ordenes-venta",
    title: "Órdenes de venta",
    subtitle: "Descargar copia",
    icon: ClipboardList,
  },
  {
    id: "crear-salida",
    title: "Crear Salida",
    subtitle: "Registrar salida",
    icon: Box,
  },
];
