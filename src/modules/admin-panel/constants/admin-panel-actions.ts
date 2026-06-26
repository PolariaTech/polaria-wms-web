import { BarChart3, Layers, UserCheck } from "lucide-react";
import { ROUTES } from "@/config/routes";
import type {
  AdminPanelAction,
  AdminPanelActionId,
} from "../types/admin-panel.types";

export const ADMIN_PANEL_TITLE = "Panel administrativo" as const;

export const ADMIN_PANEL_SUBTITLE =
  "Selecciona una acción para comenzar" as const;

export const ADMIN_PANEL_ACTIONS: AdminPanelAction[] = [
  {
    id: "assignment-creation",
    title: "Asignación y creación",
    icon: UserCheck,
    href: ROUTES.dashboardAdminAssignmentCreation,
  },
  {
    id: "catalog",
    title: "Catálogo",
    icon: Layers,
    href: ROUTES.dashboardCatalog,
  },
  {
    id: "reports",
    title: "Reportes",
    icon: BarChart3,
    href: ROUTES.dashboardReporteria,
  },
] as const;

export const ADMIN_PANEL_PLACEHOLDERS = {
  "assignment-creation": {
    title: "Asignación y creación",
    description:
      "Gestiona usuarios, roles y recursos operativos de tu cuenta comercial.",
    futureActions: [
      "Invitar usuario de cuenta",
      "Asignar rol y permisos",
      "Vincular bodegas al usuario",
      "Crear recursos de la cuenta",
    ],
  },
  catalog: {
    title: "Catálogo",
    description:
      "Administra productos, ubicaciones y catálogos maestros de la cuenta.",
    futureActions: [
      "Productos y presentaciones",
      "Ubicaciones de bodega",
      "Clientes y proveedores",
      "Parámetros de la cuenta",
    ],
  },
} as const satisfies Record<
  Exclude<AdminPanelActionId, "reports">,
  {
    title: string;
    description: string;
    futureActions: readonly string[];
  }
>;

export function getAdminPanelActionHref(actionId: AdminPanelActionId): string {
  const action = ADMIN_PANEL_ACTIONS.find((item) => item.id === actionId);
  if (!action) {
    throw new Error(`Acción de panel administrativo desconocida: ${actionId}`);
  }

  return action.href;
}
