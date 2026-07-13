import {
  ArrowLeftRight,
  Box,
  Cpu,
  PackagePlus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/config/routes";

export type JefeBodegaActionId =
  | "ingresos"
  | "bodega-a-bodega"
  | "revisar"
  | "procesamiento"
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
    id: "procesamiento",
    title: "Procesamiento",
    subtitle: "Nueva orden",
    icon: Cpu,
  },
  {
    id: "crear-salida",
    title: "Crear Salida",
    subtitle: "Registrar salida",
    icon: Box,
  },
];
