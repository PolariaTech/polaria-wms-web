import { WmsRol } from "@/constants/roles";

/** Roles que pueden cerrar recepción física contra OC (POL-5, alineado con API). */
export const ROLES_RECEPCION_ESCRITURA = [
  WmsRol.configurador,
  WmsRol.administrador_cuenta,
  WmsRol.administrador_bodega,
  WmsRol.jefe_bodega,
  WmsRol.custodio,
] as const;

export type RolRecepcionEscritura =
  (typeof ROLES_RECEPCION_ESCRITURA)[number];

export function canCerrarRecepcionCompra(idRol: string | null | undefined): boolean {
  if (!idRol) {
    return false;
  }

  return (ROLES_RECEPCION_ESCRITURA as readonly string[]).includes(idRol);
}
