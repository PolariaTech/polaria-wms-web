import { WmsRol } from "@/constants/wms/roles";

/** Roles que pueden bloquear posiciones del mapa (POL-6, alineado con API). */
export const ROLES_INVENTARIO_LOCK = [
  WmsRol.configurador,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
  WmsRol.custodio,
  WmsRol.operario,
] as const;

export const ROLES_INVENTARIO_FORCE_UNLOCK = [
  WmsRol.configurador,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
] as const;

export function canLockWarehouseState(idRol: string | null | undefined): boolean {
  if (!idRol) {
    return false;
  }

  return (ROLES_INVENTARIO_LOCK as readonly string[]).includes(idRol);
}

export function canForceUnlockWarehouseState(
  idRol: string | null | undefined,
): boolean {
  if (!idRol) {
    return false;
  }

  return (ROLES_INVENTARIO_FORCE_UNLOCK as readonly string[]).includes(idRol);
}
