import { WmsRol } from "@/constants/wms/roles";

/** Tipo de asignación que muestra el campo Asignado según el rol. */
export type UsuarioAsignacionTipo =
  | "bodega"
  | "cuenta"
  | "administrativo"
  | "transporte";

export const USUARIO_ASIGNACION_POR_ROL: Record<WmsRol, UsuarioAsignacionTipo> =
  {
    [WmsRol.configurador]: "administrativo",
    [WmsRol.administrador_cuenta]: "cuenta",
    [WmsRol.operador_cuenta]: "cuenta",
    [WmsRol.administrador_bodega]: "bodega",
    [WmsRol.jefe_bodega]: "bodega",
    [WmsRol.custodio]: "bodega",
    [WmsRol.operario]: "bodega",
    [WmsRol.procesador]: "bodega",
    [WmsRol.transportista]: "transporte",
  };

export const USUARIO_ASIGNACION_LABEL: Record<UsuarioAsignacionTipo, string> = {
  bodega: "Bodega",
  cuenta: "Cuenta",
  administrativo: "Administrativo",
  transporte: "Transporte",
};

export const USUARIO_ASIGNACION_VALOR_FIJO: Partial<
  Record<UsuarioAsignacionTipo, string>
> = {
  administrativo: "Administrativo",
  transporte: "Transporte",
};

export function isUsuarioAsignacionFija(
  tipo: UsuarioAsignacionTipo | null,
): boolean {
  return tipo !== null && tipo in USUARIO_ASIGNACION_VALOR_FIJO;
}

export function getUsuarioAsignacionTipo(
  idRol: WmsRol | "",
): UsuarioAsignacionTipo | null {
  if (!idRol) return null;
  return USUARIO_ASIGNACION_POR_ROL[idRol] ?? null;
}

export function getUsuarioAsignacionLabel(idRol: WmsRol | ""): string {
  const tipo = getUsuarioAsignacionTipo(idRol);
  return tipo ? USUARIO_ASIGNACION_LABEL[tipo] : "Asignado";
}
