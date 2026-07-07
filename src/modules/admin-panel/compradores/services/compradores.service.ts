import {
  DEFAULT_LIST_LIMIT,
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/utils/generate-codigo-cuenta";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/constants/ui/phone-countries";

export interface CompradorListRow {
  idComprador: string;
  codigo: string;
  comprador: string;
  telefono: string | null;
}

interface CompradorDbRow {
  id_comprador: string;
  codigo: string;
  nombre: string;
  telefono: string | null;
}

const COMPRADOR_LIST_COLUMNS = "id_comprador,codigo,nombre,telefono";

function mapCompradorRow(row: CompradorDbRow): CompradorListRow {
  return {
    idComprador: row.id_comprador,
    codigo: row.codigo,
    comprador: row.nombre,
    telefono: row.telefono,
  };
}

export interface ListCompradoresParams {
  codigoCuenta: string;
  limit?: number;
}

/** Lista compradores activos de la cuenta (scope tenant). */
export async function listCompradoresAdmin(
  params: ListCompradoresParams,
): Promise<CompradorListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<CompradorDbRow[]>((client) => {
    const query = client
      .from("comprador")
      .select(COMPRADOR_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("esta_activo", true)
      .order("nombre", { ascending: true })
      .limit(limit);

    return query as unknown as Promise<{
      data: CompradorDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapCompradorRow);
}

export interface CreateCompradorInput {
  codigoCuenta: string;
  nombre: string;
  telefono?: string | null;
}

/** Crea un comprador para la cuenta activa (scope tenant). */
export async function createCompradorAdmin(
  input: CreateCompradorInput,
): Promise<CompradorListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const nombre = input.nombre.trim();
  const telefonoRaw = input.telefono?.trim() ?? "";
  const codigo = normalizeCodigoCuentaInput(
    generateCodigoCuentaFromNombre(nombre),
  );

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre del comprador es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigo) {
    throw new DomainServiceError(
      "No se pudo generar el código del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  if (telefonoRaw && !isValidInternationalPhone(telefonoRaw)) {
    throw new DomainServiceError(
      "El teléfono del comprador no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefono = telefonoRaw
    ? normalizeInternationalPhone(telefonoRaw)
    : null;

  const inserted = await runDomainMutation<CompradorDbRow | null>((client) => {
    const query = client
      .from("comprador")
      .insert({
        codigo_cuenta: codigoCuenta,
        codigo,
        nombre,
        telefono,
        esta_activo: true,
      })
      .select(COMPRADOR_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: CompradorDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear el comprador.",
      "MUTATION_FAILED",
    );
  }

  return mapCompradorRow(inserted);
}
