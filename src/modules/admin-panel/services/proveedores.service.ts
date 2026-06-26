import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/generate-codigo-cuenta";
import { isValidInternationalPhone, normalizeInternationalPhone } from "@/constants/phone-countries";

export interface ProveedorListRow {
  idProveedor: string;
  codigo: string;
  proveedor: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
}

interface ProveedorDbRow {
  id_proveedor: string;
  codigo: string;
  razon_social: string;
  telefono: string | null;
  email: string | null;
}

const PROVEEDOR_DISPLAY_SEPARATOR = " — ";

function encodeProveedorRazonSocial(proveedor: string, nombre: string): string {
  if (!nombre || nombre === proveedor) {
    return proveedor;
  }

  return `${proveedor}${PROVEEDOR_DISPLAY_SEPARATOR}${nombre}`;
}

export function decodeProveedorRazonSocial(razonSocial: string): {
  proveedor: string;
  nombre: string;
} {
  const separatorIndex = razonSocial.indexOf(PROVEEDOR_DISPLAY_SEPARATOR);
  if (separatorIndex === -1) {
    return {
      proveedor: razonSocial,
      nombre: razonSocial,
    };
  }

  return {
    proveedor: razonSocial.slice(0, separatorIndex),
    nombre: razonSocial.slice(separatorIndex + PROVEEDOR_DISPLAY_SEPARATOR.length),
  };
}

const PROVEEDOR_LIST_COLUMNS =
  "id_proveedor,codigo,razon_social,telefono,email";

function mapProveedorRow(row: ProveedorDbRow): ProveedorListRow {
  const { proveedor, nombre } = decodeProveedorRazonSocial(row.razon_social);

  return {
    idProveedor: row.id_proveedor,
    codigo: row.codigo,
    proveedor,
    nombre,
    telefono: row.telefono,
    email: row.email,
  };
}

export function formatProveedorId(idProveedor: string): string {
  return idProveedor.slice(0, 8).toUpperCase();
}

export interface ListProveedoresParams {
  codigoCuenta: string;
  limit?: number;
}

/** Lista proveedores activos de la cuenta (scope tenant). */
export async function listProveedoresAdmin(
  params: ListProveedoresParams,
): Promise<ProveedorListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<ProveedorDbRow[]>((client) => {
    const query = client
      .from("proveedor")
      .select(PROVEEDOR_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("esta_activo", true)
      .order("razon_social", { ascending: true })
      .limit(limit);

    return query as unknown as Promise<{
      data: ProveedorDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapProveedorRow);
}

export interface CreateProveedorInput {
  codigoCuenta: string;
  proveedor: string;
  nombre: string;
  telefono: string;
  email?: string | null;
}

/** Crea un proveedor para la cuenta activa (scope tenant). */
export async function createProveedorAdmin(
  input: CreateProveedorInput,
): Promise<ProveedorListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const proveedor = input.proveedor.trim();
  const nombre = input.nombre.trim();
  const telefono = input.telefono.trim();
  const email = input.email?.trim() ?? "";
  const codigo = normalizeCodigoCuentaInput(
    generateCodigoCuentaFromNombre(proveedor || nombre),
  );
  const razonSocial = encodeProveedorRazonSocial(proveedor, nombre);

  if (!proveedor) {
    throw new DomainServiceError(
      "El proveedor es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!isValidInternationalPhone(telefono)) {
    throw new DomainServiceError(
      "El teléfono del proveedor no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefonoNormalizado = normalizeInternationalPhone(telefono);

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainServiceError(
      "El correo electrónico no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const inserted = await runDomainMutation<ProveedorDbRow | null>((client) => {
    const query = client
      .from("proveedor")
      .insert({
        codigo_cuenta: codigoCuenta,
        codigo,
        razon_social: razonSocial,
        telefono: telefonoNormalizado,
        email: email || null,
        esta_activo: true,
      })
      .select(PROVEEDOR_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: ProveedorDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear el proveedor.",
      "MUTATION_FAILED",
    );
  }

  return mapProveedorRow(inserted);
}
