import {
  ExternalLink,
  LayoutGrid,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { ROUTES } from "@/config/routes";
import type {
  AdminAssignmentOptionId,
  AdminCreationOptionId,
  AdminMenuOption,
} from "../types/admin-assignment-creation.types";

export const ADMIN_ASSIGNMENT_CREATION_TITLE =
  "Asignación y creación" as const;

export const ADMIN_ASSIGNMENT_CREATION_SUBTITLE =
  "Selecciona una acción para comenzar" as const;

export const ADMIN_CREATION_SECTION_TITLE = "Creación" as const;

export const ADMIN_ASSIGNMENT_SECTION_TITLE = "Asignaciones" as const;

export const ADMIN_CREATION_OPTIONS: readonly AdminMenuOption[] = [
  {
    id: "proveedores",
    title: "Proveedores",
    icon: LayoutGrid,
    href: ROUTES.dashboardAdminCreationSuppliers,
  },
  {
    id: "compradores",
    title: "Compradores",
    icon: ShoppingCart,
    href: ROUTES.dashboardAdminCreationBuyers,
  },
  {
    id: "camiones",
    title: "Camiones",
    icon: Truck,
    href: ROUTES.dashboardAdminCreationTrucks,
  },
] as const;

export const ADMIN_ASSIGNMENT_OPTIONS: readonly AdminMenuOption[] = [
  {
    id: "usuarios",
    title: "Usuarios",
    icon: Users,
    href: ROUTES.dashboardAdminAssignmentUsers,
  },
  {
    id: "bodega-interna",
    title: "Bodega interna",
    icon: Warehouse,
    href: ROUTES.dashboardAdminAssignmentInternalWarehouse,
  },
  {
    id: "bodega-externa",
    title: "Bodega externa",
    icon: ExternalLink,
    href: ROUTES.dashboardAdminAssignmentExternalWarehouse,
  },
] as const;

export const ADMIN_ASSIGNMENT_CREATION_PLACEHOLDERS = {
  proveedores: {
    title: "Proveedores",
    description: "Administra proveedores vinculados a tu cuenta comercial.",
    futureActions: [
      "Alta de proveedor",
      "Editar datos de contacto",
      "Activar o desactivar proveedor",
    ],
  },
  compradores: {
    title: "Compradores",
    description: "Gestiona compradores y sus permisos operativos.",
    futureActions: [
      "Registrar comprador",
      "Asignar áreas de compra",
      "Consultar historial",
    ],
  },
  camiones: {
    title: "Camiones",
    description: "Configura la flota de transporte asociada a la cuenta.",
    futureActions: [
      "Registrar camión",
      "Asignar transportista",
      "Control de capacidad",
    ],
  },
  usuarios: {
    title: "Usuarios",
    description: "Invita y administra usuarios de tu cuenta.",
    futureActions: [
      "Asignar usuario",
      "Asignar rol",
      "Vincular bodega",
    ],
  },
  "bodega-interna": {
    title: "Bodega interna",
    description: "Asigna usuarios a bodegas internas de la cuenta.",
    futureActions: [
      "Seleccionar bodega interna",
      "Asignar operadores",
      "Revisar accesos",
    ],
  },
  "bodega-externa": {
    title: "Bodega externa",
    description: "Asigna usuarios a bodegas externas vinculadas.",
    futureActions: [
      "Seleccionar bodega externa",
      "Asignar responsables",
      "Revisar accesos",
    ],
  },
} as const satisfies Record<
  AdminCreationOptionId | AdminAssignmentOptionId,
  {
    title: string;
    description: string;
    futureActions: readonly string[];
  }
>;

export function getAdminCreationOptionHref(
  optionId: AdminCreationOptionId,
): string {
  const option = ADMIN_CREATION_OPTIONS.find((item) => item.id === optionId);
  if (!option) {
    throw new Error(`Opción de creación administrativa desconocida: ${optionId}`);
  }

  return option.href;
}

export function getAdminAssignmentOptionHref(
  optionId: AdminAssignmentOptionId,
): string {
  const option = ADMIN_ASSIGNMENT_OPTIONS.find((item) => item.id === optionId);
  if (!option) {
    throw new Error(
      `Opción de asignación administrativa desconocida: ${optionId}`,
    );
  }

  return option.href;
}
