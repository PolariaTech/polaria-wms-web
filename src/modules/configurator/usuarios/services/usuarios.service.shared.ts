import type { WmsRol } from "@/constants/wms/roles";

export interface UsuarioListRow {
  idUsuario: string;
  codigo: string;
  /** Código de cuenta WMS (null si el rol no está atado a cuenta). */
  codigoCuenta: string | null;
  rol: string;
  nombre: string;
  correo: string;
  cuenta: string;
  telefono: string;
  tieneCredenciales: boolean;
  estaActivo: boolean;
  accesoWms: boolean;
  accesoMateo: boolean;
}

export interface RolOption {
  idRol: WmsRol;
  nombre: string;
}

export interface CuentaAssignOption {
  codigoCuenta: string;
  nombreComercial: string;
  /** Bodega por defecto de la cuenta, si está configurada. */
  idBodegaDefault: string | null;
}

export interface BodegaAssignOption {
  idBodega: string;
  nombre: string;
  codigo: string;
  codigoCuenta: string;
}

interface UsuarioRolDbRow {
  id_rol: WmsRol;
  nombre: string;
}

export interface UsuarioDbRow {
  id_usuario: string;
  username: string;
  codigo_cuenta: string | null;
  nombre: string;
  correo: string;
  telefono: string | null;
  id_auth: string;
  esta_activo: boolean;
  acceso_wms?: boolean;
  acceso_mateo?: boolean;
  rol: UsuarioRolDbRow | UsuarioRolDbRow[] | null;
}

/**
 * Sin embed a cuenta: fk_usuario_cuenta se eliminó (schema-per-empresa).
 * El nombre comercial se resuelve en public + schemas emp_*.
 */
export const USUARIO_LIST_COLUMNS =
  "id_usuario,username,codigo_cuenta,nombre,correo,telefono,id_auth,esta_activo,acceso_wms,acceso_mateo,rol(id_rol,nombre)";

function resolveRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapUsuarioRow(
  row: UsuarioDbRow,
  nombreCuentaByCodigo: Map<string, string>,
): UsuarioListRow {
  const rol = resolveRelation(row.rol);
  const codigoCuenta = row.codigo_cuenta?.trim() || null;

  return {
    idUsuario: row.id_usuario,
    codigo: codigoCuenta ?? "—",
    codigoCuenta,
    rol: rol?.nombre ?? rol?.id_rol ?? "—",
    nombre: row.nombre,
    correo: row.correo?.trim() || "—",
    cuenta: codigoCuenta
      ? (nombreCuentaByCodigo.get(codigoCuenta) ?? codigoCuenta)
      : "—",
    telefono: row.telefono?.trim() || "—",
    tieneCredenciales: Boolean(row.id_auth),
    estaActivo: row.esta_activo !== false,
    accesoWms: row.acceso_wms !== false,
    accesoMateo: row.acceso_mateo !== false,
  };
}
