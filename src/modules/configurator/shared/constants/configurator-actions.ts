import { ClipboardList, Layers, Store, UserCheck } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { POLARIA_BRAND } from "@/constants/brand/brand";
import type {
  ConfiguratorAction,
  ConfiguratorActionId,
} from "@/modules/configurator/shared/types/configurator.types";

export const CONFIGURATOR_BRAND = POLARIA_BRAND;

export const CONFIGURATOR_ACTIONS: ConfiguratorAction[] = [
  {
    id: "accounts",
    title: "Cuentas",
    icon: Store,
    href: ROUTES.configuratorAccounts,
  },
  {
    id: "creation",
    title: "Creación",
    icon: Layers,
    href: ROUTES.configuratorCreation,
  },
  {
    id: "creation-assignment",
    title: "Creación y asignación",
    icon: UserCheck,
    href: ROUTES.configuratorAssignment,
  },
  {
    id: "integration",
    title: "Integración",
    icon: ClipboardList,
    href: ROUTES.configuratorIntegration,
  },
] as const;

export const CONFIGURATOR_PANEL_TITLE = "Panel del Configurador" as const;

export const CONFIGURATOR_PANEL_SUBTITLE =
  "Selecciona una acción para comenzar" as const;

export const CONFIGURATOR_PLACEHOLDERS = {
  accounts: {
    title: "Cuentas",
    description:
      "Control de todas las cuentas de la plataforma: acceso, usuarios, maestros y operación.",
    futureActions: [
      "Ver todas las cuentas",
      "Entrar a una cuenta",
      "Activar o desactivar acceso",
      "Administrar usuarios y maestros de la cuenta",
    ],
  },
  creation: {
    title: "Creación",
    description:
      "Alta y configuración de entidades de plataforma: empresas, cuentas y catálogos base.",
    futureActions: [
      "Registrar empresa",
      "Crear cuenta comercial",
      "Definir catálogos maestros",
      "Gestionar parámetros globales",
    ],
  },
  "creation-assignment": {
    title: "Creación y asignación",
    description:
      "Vincula usuarios, roles y recursos operativos dentro del tenant.",
    futureActions: [
      "Invitar usuario",
      "Asignar rol y nivel",
      "Vincular bodegas al usuario",
      "Revocar accesos",
    ],
  },
  integration: {
    title: "Integración",
    description:
      "Conecta el WMS con sistemas externos y flujos de intercambio de datos.",
    futureActions: [
      "Configurar webhooks",
      "Conectar ERP externo",
      "Sincronizar catálogo de productos",
      "Monitorear integraciones activas",
    ],
  },
} as const satisfies Record<
  ConfiguratorActionId,
  {
    title: string;
    description: string;
    futureActions: readonly string[];
  }
>;

export function getConfiguratorActionHref(actionId: ConfiguratorActionId): string {
  const action = CONFIGURATOR_ACTIONS.find((item) => item.id === actionId);
  if (!action) {
    throw new Error(`Acción de configurador desconocida: ${actionId}`);
  }

  return action.href;
}
