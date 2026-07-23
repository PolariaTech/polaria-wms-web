import { WmsRol } from "@/constants/wms/roles";
import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";

export interface UsuarioAdminListRow {
  idUsuario: string;
  nombre: string;
  correo: string;
  telefono: string;
  codigo: string;
  createdAt: string;
}

interface UsuarioAdminDbRow {
  id_usuario: string;
  username: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  created_at: string;
}

const USUARIO_ADMIN_LIST_COLUMNS =
  "id_usuario,username,nombre,correo,telefono,created_at";

function mapUsuarioAdminRow(row: UsuarioAdminDbRow): UsuarioAdminListRow {
  return {
    idUsuario: row.id_usuario,
    nombre: row.nombre,
    correo: row.correo,
    telefono: row.telefono?.trim() || "—",
    codigo: row.username,
    createdAt: row.created_at,
  };
}

export function formatUsuarioAdminCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export interface ListUsuariosAdminParams {
  codigoCuenta: string;
  limit?: number;
}

/** Lista operadores de cuenta activos de la cuenta tenant. */
export async function listUsuariosAdmin(
  params: ListUsuariosAdminParams,
): Promise<UsuarioAdminListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<UsuarioAdminDbRow[]>((client) => {
    const query = client
      .from("usuario")
      .select(USUARIO_ADMIN_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_rol", WmsRol.operador_cuenta)
      .eq("esta_activo", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    return query as unknown as Promise<{
      data: UsuarioAdminDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapUsuarioAdminRow);
}

export interface CreateUsuarioAdminInput {
  codigoCuenta: string;
  codigoEmpresa: string;
  nombre: string;
  correo: string;
  telefono?: string | null;
  clave: string;
}

interface CreateUsuarioAdminApiResponse {
  idUsuario: string;
  username: string;
  nombre: string;
  idRol: WmsRol;
  codigoCuenta: string | null;
  correo: string;
  telefono: string | null;
}

/** Crea un operador de cuenta vía API Nest (auth + registro en `usuario`). */
export async function createUsuarioAdmin(
  input: CreateUsuarioAdminInput,
): Promise<UsuarioAdminListRow> {
  requireCodigoCuenta(input.codigoCuenta);
  const codigoEmpresa = input.codigoEmpresa.trim();
  const nombre = input.nombre.trim();
  const correo = input.correo.trim();
  const telefono = input.telefono?.trim() || null;
  const clave = input.clave.trim();
  const username = generateCodigoCuentaFromNombre(nombre);

  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "No se encontró la empresa activa.",
      "INVALID_ARGUMENT",
    );
  }
  if (!username) {
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

  try {
    const created = await apiRequest<CreateUsuarioAdminApiResponse>(
      "/administracion/usuarios",
      {
        method: "POST",
        auth: true,
        body: {
          username,
          nombre,
          correo,
          telefono,
          password: clave,
          idRol: WmsRol.operador_cuenta,
        },
      },
    );

    return {
      idUsuario: created.idUsuario,
      nombre: created.nombre,
      correo: created.correo,
      telefono: created.telefono?.trim() || telefono || "—",
      codigo: created.username,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}
