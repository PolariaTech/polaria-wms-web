import type { NivelRol } from "@/types/auth";

/** Roles WMS (enum Prisma `wms_rol`). */
export const WmsRol = {
  configurador: "configurador",
  administrador_cuenta: "administrador_cuenta",
  operador_cuenta: "operador_cuenta",
  administrador_bodega: "administrador_bodega",
  jefe_bodega: "jefe_bodega",
  custodio: "custodio",
  operario: "operario",
  procesador: "procesador",
  transportista: "transportista",
} as const;

export type WmsRol = (typeof WmsRol)[keyof typeof WmsRol];

/** Rol de plataforma (TI). Bypass de filtros tenant en operaciones backend. */
export const ROL_PLATAFORMA = WmsRol.configurador;

/** Roles con alcance comercial (nivel cuenta). */
export const ROLES_NIVEL_CUENTA = [
  WmsRol.administrador_cuenta,
  WmsRol.operador_cuenta,
] as const;

/** Roles con alcance físico (nivel bodega). */
export const ROLES_NIVEL_BODEGA = [
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
  WmsRol.custodio,
  WmsRol.operario,
] as const;

/** Roles que pueden ejecutar escrituras sensibles de inventario vía backend (POL-33). */
export const ROLES_ESCRITURA_INVENTARIO = [
  WmsRol.configurador,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
] as const;

export type RolEscrituraInventario =
  (typeof ROLES_ESCRITURA_INVENTARIO)[number];

const NIVEL_ROL_RANK: Record<NivelRol, number> = {
  platform: 4,
  empresa: 3,
  cuenta: 2,
  bodega: 1,
};

export function isConfigurador(idRol: WmsRol | string): boolean {
  return idRol === WmsRol.configurador;
}

export function isRolEscrituraInventario(idRol: WmsRol | string): boolean {
  return (ROLES_ESCRITURA_INVENTARIO as readonly string[]).includes(idRol);
}

/** true si `actual` es igual o superior a `min` en la jerarquía tenant. */
export function hasMinNivelRol(actual: NivelRol, min: NivelRol): boolean {
  return NIVEL_ROL_RANK[actual] >= NIVEL_ROL_RANK[min];
}

/**
 * Matriz rol × dominio (resumen). Detalle de permisos en permissions.ts.
 *
 * | Dominio              | configurador | admin cuenta | operador cuenta | admin/jefe bodega | operario |
 * |----------------------|:------------:|:------------:|:---------------:|:-----------------:|:--------:|
 * | Catálogo plataforma  | RW           | R            | R               | R                 | R        |
 * | Escritura inventario | RW           | —            | —               | RW                | —        |
 * | Lecturas operativas  | R            | R (tenant)   | R (cuenta)      | R (bodega)        | R        |
 */
export const MATRIZ_ROL_DOMINIO = {
  PLATAFORMA: [WmsRol.configurador],
  TENANT_CUENTA: ROLES_NIVEL_CUENTA,
  TENANT_BODEGA: ROLES_NIVEL_BODEGA,
  INVENTARIO_WRITE: ROLES_ESCRITURA_INVENTARIO,
} as const;
