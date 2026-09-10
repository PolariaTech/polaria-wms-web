import type { WmsRol } from "@/constants/wms/roles";
import {
  DEFAULT_LIST_LIMIT,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import {
  findCuentaAcrossSchemas,
  listBodegasAcrossSchemas,
  listCuentasAcrossSchemas,
  resolveNombresCuentaAcrossSchemas,
} from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import {
  WMS_ROL_LABELS,
  WMS_ROLES_ORDER,
} from "@/constants/wms/wms-roles";

export interface UsuarioListRow {
  idUsuario: string;
  codigo: string;
  /** Código de cuenta WMS (null si el rol no está atado a cuenta). */
  codigoCuenta: string | null;
  rol: string;
  nombre: string;
  cuenta: string;
  telefono: string;
  tieneCredenciales: boolean;
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

interface UsuarioDbRow {
  id_usuario: string;
  username: string;
  codigo_cuenta: string | null;
  nombre: string;
  telefono: string | null;
  id_auth: string;
  rol: UsuarioRolDbRow | UsuarioRolDbRow[] | null;
}

/**
 * Sin embed a cuenta: fk_usuario_cuenta se eliminó (schema-per-empresa).
 * El nombre comercial se resuelve en public + schemas emp_*.
 */
const USUARIO_LIST_COLUMNS =
  "id_usuario,username,codigo_cuenta,nombre,telefono,id_auth,rol(id_rol,nombre)";

function resolveRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapUsuarioRow(
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
    cuenta: codigoCuenta
      ? (nombreCuentaByCodigo.get(codigoCuenta) ?? codigoCuenta)
      : "—",
    telefono: row.telefono?.trim() || "—",
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

  const codigosCuenta = [
    ...new Set(
      rows
        .map((row) => row.codigo_cuenta?.trim())
        .filter((codigo): codigo is string => Boolean(codigo)),
    ),
  ];

  const nombreCuentaByCodigo =
    await resolveNombresCuentaAcrossSchemas(codigosCuenta);

  return rows.map((row) => mapUsuarioRow(row, nombreCuentaByCodigo));
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

/** Cuentas activas para el campo Asignado (public + emp_*). */
export async function listCuentasAssignOptions(): Promise<CuentaAssignOption[]> {
  const rows = await listCuentasAcrossSchemas();
  return rows.map((row) => ({
    codigoCuenta: row.codigo_cuenta,
    nombreComercial: row.nombre_comercial,
    idBodegaDefault: row.id_bodega_default?.trim() || null,
  }));
}

/** Bodegas activas para asignación de roles de nivel bodega (public + emp_*). */
export async function listBodegasAssignOptions(): Promise<BodegaAssignOption[]> {
  const rows = await listBodegasAcrossSchemas();
  return rows.map((row) => ({
    idBodega: row.id_bodega.trim(),
    nombre: row.nombre,
    codigo: row.codigo,
    codigoCuenta: row.codigo_cuenta,
  }));
}

export interface CreateUsuarioInput {
  codigo: string;
  nombre: string;
  idRol: WmsRol;
  codigoCuenta: string | null;
  idBodega: string | null;
  correo: string;
  telefono?: string | null;
  clave: string;
}

interface CreateUsuarioApiResponse {
  idUsuario: string;
  username: string;
  nombre: string;
  idRol: WmsRol;
  codigoCuenta: string | null;
  correo: string;
  telefono?: string | null;
}

interface BodegaAssignRef {
  idBodega: string;
  codigoCuenta: string;
}

async function resolveBodegaAssignTarget(
  idOrCodigo: string,
): Promise<BodegaAssignRef | null> {
  const value = idOrCodigo.trim();
  if (!value) return null;

  const lookup = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fromFn: (table: string) => any,
    column: "id_bodega" | "codigo",
  ): Promise<BodegaAssignRef | null> => {
    const { data, error } = await fromFn("bodega")
      .select("id_bodega,codigo_cuenta")
      .eq(column, value)
      .eq("esta_activa", true)
      .limit(1);

    if (error) {
      throw new DomainServiceError(
        error.message || "Error al consultar bodegas.",
        "QUERY_FAILED",
        error,
      );
    }

    const row = (
      data as { id_bodega: string; codigo_cuenta: string }[] | null
    )?.[0];
    if (!row?.id_bodega?.trim() || !row.codigo_cuenta?.trim()) {
      return null;
    }

    return {
      idBodega: row.id_bodega.trim(),
      codigoCuenta: row.codigo_cuenta.trim(),
    };
  };

  const { getDomainSupabaseClient } = await import(
    "@/lib/supabase/domain-query"
  );
  const { listEmpresaSchemas } = await import("@/lib/supabase/tenant-fanout");
  const client = getDomainSupabaseClient();

  for (const column of ["id_bodega", "codigo"] as const) {
    const found = await lookup((table) => client.from(table), column);
    if (found) return found;
  }

  const empresas = await listEmpresaSchemas();
  for (const empresa of empresas) {
    if (!empresa.schema_name) continue;
    for (const column of ["id_bodega", "codigo"] as const) {
      try {
        const found = await lookup(
          (table) => client.schema(empresa.schema_name!).from(table),
          column,
        );
        if (found) return found;
      } catch {
        // continuar
      }
    }
  }

  return null;
}

async function resolveCodigoEmpresa(
  codigoCuenta: string,
): Promise<string | null> {
  const cuenta = await findCuentaAcrossSchemas(codigoCuenta);
  return cuenta?.codigo_empresa ?? null;
}

/** Crea un usuario vía API Nest (auth + registro en `usuario`). */
export async function createUsuarioConfigurator(
  input: CreateUsuarioInput,
): Promise<UsuarioListRow> {
  const codigo = input.codigo.trim();
  const nombre = input.nombre.trim();
  const correo = input.correo.trim();
  const clave = input.clave.trim();
  const telefono = input.telefono?.trim() || null;
  let codigoCuenta = input.codigoCuenta?.trim() || null;
  let idBodega = input.idBodega?.trim() || null;

  if (idBodega) {
    const bodega = await resolveBodegaAssignTarget(idBodega);
    if (!bodega) {
      throw new DomainServiceError(
        "La bodega seleccionada no es válida.",
        "INVALID_ARGUMENT",
      );
    }
    idBodega = bodega.idBodega;
    if (!codigoCuenta) {
      codigoCuenta = bodega.codigoCuenta;
    }
  }

  if (!codigo) {
    throw new DomainServiceError("El código es obligatorio.", "INVALID_ARGUMENT");
  }
  if (!nombre) {
    throw new DomainServiceError("El nombre es obligatorio.", "INVALID_ARGUMENT");
  }
  if (!correo) {
    throw new DomainServiceError("El correo es obligatorio.", "INVALID_ARGUMENT");
  }
  if (clave.length < 8) {
    throw new DomainServiceError(
      "La clave debe tener al menos 8 caracteres.",
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
          idBodega,
          correo,
          telefono,
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
      codigo: created.codigoCuenta ?? "—",
      codigoCuenta: created.codigoCuenta,
      rol: rolNombre,
      nombre: created.nombre,
      cuenta: cuentaNombre,
      telefono: created.telefono?.trim() || telefono || "—",
      tieneCredenciales: true,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}
