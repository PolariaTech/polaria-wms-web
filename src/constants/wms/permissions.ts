import type { NivelRol } from "@/types/auth/auth";
import {
  hasMinNivelRol,
  isConfigurador,
  isRolEscrituraInventario,
  ROLES_ESCRITURA_INVENTARIO,
  WmsRol,
  type WmsRol as WmsRolType,
} from "./roles";

/** Permisos atómicos del WMS. POL-33 ampliará el catálogo. */
export const PERMISSION = {
  INVENTORY_WRITE: "inventory:write",
  INVENTORY_READ: "inventory:read",
  WAREHOUSE_STATE_WRITE: "warehouse_state:write",
  COUNTERS_WRITE: "counters:write",
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

/**
 * Matriz mínima rol → permisos para escrituras sensibles (backend, bypass RLS).
 * Lecturas vía PostgREST usan RLS; no aparecen aquí.
 */
export const ROLE_PERMISSIONS: Readonly<
  Record<WmsRolType, readonly Permission[]>
> = {
  [WmsRol.configurador]: [
    PERMISSION.INVENTORY_WRITE,
    PERMISSION.INVENTORY_READ,
    PERMISSION.WAREHOUSE_STATE_WRITE,
    PERMISSION.COUNTERS_WRITE,
  ],
  [WmsRol.administrador_cuenta]: [PERMISSION.INVENTORY_READ],
  [WmsRol.operador_cuenta]: [PERMISSION.INVENTORY_READ],
  [WmsRol.administrador_bodega]: [
    PERMISSION.INVENTORY_WRITE,
    PERMISSION.INVENTORY_READ,
    PERMISSION.WAREHOUSE_STATE_WRITE,
    PERMISSION.COUNTERS_WRITE,
  ],
  [WmsRol.jefe_bodega]: [
    PERMISSION.INVENTORY_WRITE,
    PERMISSION.INVENTORY_READ,
    PERMISSION.WAREHOUSE_STATE_WRITE,
    PERMISSION.COUNTERS_WRITE,
  ],
  [WmsRol.custodio]: [PERMISSION.INVENTORY_READ],
  [WmsRol.operario]: [PERMISSION.INVENTORY_READ],
  [WmsRol.procesador]: [],
  [WmsRol.transportista]: [],
};

export const SENSITIVE_WRITE_PERMISSIONS: readonly Permission[] = [
  PERMISSION.INVENTORY_WRITE,
  PERMISSION.WAREHOUSE_STATE_WRITE,
  PERMISSION.COUNTERS_WRITE,
];

/** Módulos de la aplicación web alineados con `src/modules/`. */
export const WMS_MODULE = {
  CONFIGURATOR: "configurator",
  DASHBOARD: "dashboard",
  INVENTORY: "inventory",
  PURCHASES: "purchases",
  SALES: "sales",
  PROCESSING: "processing",
  TRANSPORT: "transport",
  AUDIT: "audit",
  WAREHOUSES: "warehouses",
  ACCOUNTS: "accounts",
  COMPANIES: "companies",
} as const;

export type WmsModule = (typeof WMS_MODULE)[keyof typeof WMS_MODULE];

const MODULE_MIN_NIVEL_ROL: Readonly<Record<WmsModule, NivelRol>> = {
  [WMS_MODULE.CONFIGURATOR]: "platform",
  [WMS_MODULE.DASHBOARD]: "bodega",
  [WMS_MODULE.INVENTORY]: "bodega",
  [WMS_MODULE.PURCHASES]: "cuenta",
  [WMS_MODULE.SALES]: "cuenta",
  [WMS_MODULE.PROCESSING]: "bodega",
  [WMS_MODULE.TRANSPORT]: "bodega",
  [WMS_MODULE.AUDIT]: "empresa",
  [WMS_MODULE.WAREHOUSES]: "empresa",
  [WMS_MODULE.ACCOUNTS]: "empresa",
  [WMS_MODULE.COMPANIES]: "platform",
};

export function hasPermission(
  idRol: WmsRolType | string,
  permission: Permission,
): boolean {
  if (isConfigurador(idRol)) {
    return true;
  }

  return ROLE_PERMISSIONS[idRol as WmsRolType]?.includes(permission) ?? false;
}

export function canInventoryWrite(idRol: WmsRolType | string): boolean {
  return isConfigurador(idRol) || isRolEscrituraInventario(idRol);
}

export function canAccessModule(
  idRol: WmsRolType | string | null | undefined,
  nivelRol: NivelRol | null | undefined,
  module: WmsModule,
): boolean {
  if (!idRol || !nivelRol) {
    return false;
  }

  if (module === WMS_MODULE.CONFIGURATOR) {
    return isConfigurador(idRol) || nivelRol === "platform";
  }

  return hasMinNivelRol(nivelRol, MODULE_MIN_NIVEL_ROL[module]);
}

export { ROLES_ESCRITURA_INVENTARIO };
