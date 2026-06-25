import type { WmsRol } from "@/constants/roles";
import {
  DEFAULT_LIST_LIMIT,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import { ApiError, apiRequest } from "@/services/api";
import {
  WMS_ROL_LABELS,
  WMS_ROLES_ORDER,
} from "../constants/wms-roles";

export interface UsuarioListRow {
  idUsuario: string;
  codigo: string;
  rol: string;
  nombre: string;
  cuenta: string;
  tieneCredenciales: boolean;
}

export interface RolOption {
  idRol: WmsRol;
  nombre: string;
}

export interface CuentaAssignOption {
  codigoCuenta: string;
  nombreComercial: string;
}

interface UsuarioRolDbRow {
  id_rol: WmsRol;
  nombre: string;
}

interface UsuarioCuentaDbRow {
  nombre_comercial: string | null;
}

interface UsuarioDbRow {
  id_usuario: string;
  username: string;
  nombre: string;
  id_auth: string;
  rol: UsuarioRolDbRow | UsuarioRolDbRow[] | null;
  cuenta: UsuarioCuentaDbRow | UsuarioCuentaDbRow[] | null;
}

const USUARIO_LIST_COLUMNS =
  "id_usuario,username,nombre,id_auth,rol(id_rol,nombre),cuenta(nombre_comercial)";

function resolveRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapUsuarioRow(row: UsuarioDbRow): UsuarioListRow {
  const rol = resolveRelation(row.rol);
  const cuenta = resolveRelation(row.cuenta);

  return {
    idUsuario: row.id_usuario,
    codigo: row.username,
    rol: rol?.nombre ?? rol?.id_rol ?? "—",
    nombre: row.nombre,
    cuenta: cuenta?.nombre_comercial ?? "—",
    tieneCredenciales: Boolean(row.id_auth),
  };
}

/** Lista usuarios activos para el configurador (scope platform). */
export async function listUsuariosConfigurator(): Promise<UsuarioListRow[]> {
  const rows = await runDomainQuery<UsuarioDbRow[]>((client) => {
    const query = client
      .from("usuario")
      .select(USUARIO_LIST_COLUMNS)
      .eq("esta_activo", true)
      .order("nombre", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: UsuarioDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapUsuarioRow);
}

/** Opciones de rol para formularios (9 roles WMS). */
export async function listRolesConfigurator(): Promise<RolOption[]> {
  const rows = await runDomainQuery<{ id_rol: WmsRol; nombre: string }[]>(
    (client) => {
      const query = client
        .from("rol")
        .select("id_rol,nombre")
        .order("nombre", { ascending: true });

      return query as unknown as Promise<{
        data: { id_rol: WmsRol; nombre: string }[] | null;
        error: { message: string } | null;
      }>;
    },
  );

  if (rows.length > 0) {
    const byId = new Map(rows.map((row) => [row.id_rol, row.nombre]));
    return WMS_ROLES_ORDER.filter((idRol) => byId.has(idRol)).map((idRol) => ({
      idRol,
      nombre: byId.get(idRol) ?? WMS_ROL_LABELS[idRol],
    }));
  }

  return WMS_ROLES_ORDER.map((idRol) => ({
    idRol,
    nombre: WMS_ROL_LABELS[idRol],
  }));
}

/** Cuentas activas para el campo Asignado. */
export async function listCuentasAssignOptions(): Promise<CuentaAssignOption[]> {
  const rows = await runDomainQuery<
    { codigo_cuenta: string; nombre_comercial: string }[]
  >((client) => {
    const query = client
      .from("cuenta")
      .select("codigo_cuenta,nombre_comercial")
      .eq("esta_activa", true)
      .order("nombre_comercial", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: { codigo_cuenta: string; nombre_comercial: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map((row) => ({
    codigoCuenta: row.codigo_cuenta,
    nombreComercial: row.nombre_comercial,
  }));
}

export interface CreateUsuarioInput {
  codigo: string;
  nombre: string;
  idRol: WmsRol;
  codigoCuenta: string | null;
  correo: string;
  clave: string;
}

interface CreateUsuarioApiResponse {
  idUsuario: string;
  username: string;
  nombre: string;
  idRol: WmsRol;
  codigoCuenta: string | null;
  correo: string;
}

async function resolveCodigoEmpresa(
  codigoCuenta: string,
): Promise<string | null> {
  const rows = await runDomainQuery<{ codigo_empresa: string }[]>((client) => {
    const query = client
      .from("cuenta")
      .select("codigo_empresa")
      .eq("codigo_cuenta", codigoCuenta)
      .limit(1);

    return query as unknown as Promise<{
      data: { codigo_empresa: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows[0]?.codigo_empresa ?? null;
}

/** Crea un usuario vía API Nest (auth + registro en `usuario`). */
export async function createUsuarioConfigurator(
  input: CreateUsuarioInput,
): Promise<UsuarioListRow> {
  const codigo = input.codigo.trim();
  const nombre = input.nombre.trim();
  const correo = input.correo.trim();
  const clave = input.clave.trim();
  const codigoCuenta = input.codigoCuenta?.trim() || null;

  if (!codigo) {
    throw new DomainServiceError("El código es obligatorio.", "INVALID_ARGUMENT");
  }
  if (!nombre) {
    throw new DomainServiceError("El nombre es obligatorio.", "INVALID_ARGUMENT");
  }
  if (!correo) {
    throw new DomainServiceError("El correo es obligatorio.", "INVALID_ARGUMENT");
  }
  if (clave.length < 6) {
    throw new DomainServiceError(
      "La clave debe tener al menos 6 caracteres.",
      "INVALID_ARGUMENT",
    );
  }

  let codigoEmpresa: string | null = null;
  if (codigoCuenta) {
    codigoEmpresa = await resolveCodigoEmpresa(codigoCuenta);
    if (!codigoEmpresa) {
      throw new DomainServiceError(
        "La cuenta seleccionada no es válida.",
        "INVALID_ARGUMENT",
      );
    }
  }

  try {
    const created = await apiRequest<CreateUsuarioApiResponse>(
      "/configurador/usuarios",
      {
        method: "POST",
        auth: true,
        body: {
          username: codigo,
          nombre,
          idRol: input.idRol,
          codigoCuenta,
          codigoEmpresa,
          correo,
          password: clave,
        },
      },
    );

    const roles = await listRolesConfigurator();
    const rolNombre =
      roles.find((rol) => rol.idRol === created.idRol)?.nombre ?? created.idRol;

    let cuentaNombre = "—";
    if (created.codigoCuenta) {
      const cuentas = await listCuentasAssignOptions();
      cuentaNombre =
        cuentas.find((c) => c.codigoCuenta === created.codigoCuenta)
          ?.nombreComercial ?? created.codigoCuenta;
    }

    return {
      idUsuario: created.idUsuario,
      codigo: created.username,
      rol: rolNombre,
      nombre: created.nombre,
      cuenta: cuentaNombre,
      tieneCredenciales: true,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}
