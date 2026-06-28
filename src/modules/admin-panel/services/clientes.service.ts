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

export interface ClienteListRow {
  idCliente: string;
  codigo: string;
  nombre: string;
  nit: string;
}

interface ClienteDbRow {
  id_cliente: string;
  codigo: string;
  nombre: string;
  nit: string;
}

const CLIENTE_LIST_COLUMNS = "id_cliente,codigo,nombre,nit";

function mapClienteRow(row: ClienteDbRow): ClienteListRow {
  return {
    idCliente: row.id_cliente,
    codigo: row.codigo,
    nombre: row.nombre,
    nit: row.nit,
  };
}

export function formatClienteId(idCliente: string): string {
  return idCliente.slice(0, 8).toUpperCase();
}

function normalizeNitInput(nit: string): string {
  return nit.trim().replace(/\s+/g, "");
}

function isValidNit(nit: string): boolean {
  return /^[\d-]+$/.test(nit) && nit.replace(/\D/g, "").length >= 5;
}

export interface ListClientesParams {
  codigoCuenta: string;
  limit?: number;
}

/** Lista clientes activos de la cuenta (scope tenant). */
export async function listClientesAdmin(
  params: ListClientesParams,
): Promise<ClienteListRow[]> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;

  const rows = await runDomainQuery<ClienteDbRow[]>((client) => {
    const query = client
      .from("cliente")
      .select(CLIENTE_LIST_COLUMNS)
      .eq("codigo_cuenta", codigoCuenta)
      .eq("esta_activo", true)
      .order("nombre", { ascending: true })
      .limit(limit);

    return query as unknown as Promise<{
      data: ClienteDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapClienteRow);
}

export interface CreateClienteInput {
  codigoCuenta: string;
  nombre: string;
  nit: string;
}

/** Crea un cliente para la cuenta activa (scope tenant). */
export async function createClienteAdmin(
  input: CreateClienteInput,
): Promise<ClienteListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const nombre = input.nombre.trim();
  const nit = normalizeNitInput(input.nit);
  const codigo = normalizeCodigoCuentaInput(
    generateCodigoCuentaFromNombre(nombre),
  );

  if (!nombre) {
    throw new DomainServiceError(
      "El nombre del cliente es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!nit) {
    throw new DomainServiceError(
      "El NIT del cliente es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!isValidNit(nit)) {
    throw new DomainServiceError(
      "El NIT del cliente no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigo) {
    throw new DomainServiceError(
      "No se pudo generar el código del cliente.",
      "INVALID_ARGUMENT",
    );
  }

  const inserted = await runDomainMutation<ClienteDbRow | null>((client) => {
    const query = client
      .from("cliente")
      .insert({
        codigo_cuenta: codigoCuenta,
        codigo,
        nombre,
        nit,
        esta_activo: true,
      })
      .select(CLIENTE_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: ClienteDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear el cliente.",
      "MUTATION_FAILED",
    );
  }

  return mapClienteRow(inserted);
}
