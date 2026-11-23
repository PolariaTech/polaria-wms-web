import type { WmsRol } from "@/constants/wms/roles";
import { findCuentaAcrossSchemas } from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import { type UsuarioListRow } from "./usuarios.service.shared";
import { listCuentasAssignOptions, listRolesConfigurator } from "./usuarios.service.queries";

export interface CreateUsuarioInput {
  codigo: string;
  nombre: string;
  idRol: WmsRol;
  codigoCuenta: string | null;
  idBodega: string | null;
  correo: string;
  telefono?: string | null;
  clave: string;
  accesoWms?: boolean;
  accesoMateo?: boolean;
}

interface CreateUsuarioApiResponse {
  idUsuario: string;
  username: string;
  nombre: string;
  idRol: WmsRol;
  codigoCuenta: string | null;
  correo: string;
  telefono?: string | null;
  estaActivo?: boolean;
  accesoWms?: boolean;
  accesoMateo?: boolean;
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
          accesoWms: input.accesoWms !== false,
          accesoMateo: input.accesoMateo !== false,
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
      correo: created.correo,
      cuenta: cuentaNombre,
      telefono: created.telefono?.trim() || telefono || "—",
      tieneCredenciales: true,
      estaActivo: created.estaActivo !== false,
      accesoWms: created.accesoWms !== false,
      accesoMateo: created.accesoMateo !== false,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

export interface UpdateUsuarioInput {
  idUsuario: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  estaActivo: boolean;
  accesoWms: boolean;
  accesoMateo: boolean;
}

export async function updateUsuarioConfigurator(
  input: UpdateUsuarioInput,
): Promise<void> {
  const idUsuario = input.idUsuario.trim();
  const nombre = input.nombre.trim();
  const correo = input.correo.trim().toLowerCase();

  if (!idUsuario) {
    throw new DomainServiceError(
      "El usuario es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }
  if (!nombre) {
    throw new DomainServiceError("El nombre es obligatorio.", "INVALID_ARGUMENT");
  }
  if (!correo) {
    throw new DomainServiceError("El correo es obligatorio.", "INVALID_ARGUMENT");
  }
  if (!input.accesoWms && !input.accesoMateo) {
    throw new DomainServiceError(
      "El usuario debe tener acceso a Polaria WMS, a Mateo IA, o a ambos.",
      "INVALID_ARGUMENT",
    );
  }

  try {
    await apiRequest(`/configurador/usuarios/${encodeURIComponent(idUsuario)}`, {
      method: "PATCH",
      auth: true,
      body: {
        nombre,
        correo,
        telefono: input.telefono,
        estaActivo: input.estaActivo,
        accesoWms: input.accesoWms,
        accesoMateo: input.accesoMateo,
      },
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}
