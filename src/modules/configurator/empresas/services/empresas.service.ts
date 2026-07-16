import {
  DEFAULT_LIST_LIMIT,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/constants/ui/phone-countries";
import { ApiError, apiRequest } from "@/services/api/api";

export interface EmpresaListRow {
  codigoEmpresa: string;
  razonSocial: string;
  telefono: string | null;
  estaActiva: boolean;
}

interface EmpresaDbRow {
  codigo_empresa: string;
  razon_social: string;
  telefono: string | null;
  esta_activa: boolean;
}

const EMPRESA_LIST_COLUMNS = "codigo_empresa,razon_social,telefono,esta_activa";

function mapEmpresaRow(row: EmpresaDbRow): EmpresaListRow {
  return {
    codigoEmpresa: row.codigo_empresa,
    razonSocial: row.razon_social,
    telefono: row.telefono,
    estaActiva: row.esta_activa,
  };
}

/** Lista empresas para el configurador (scope platform). */
export async function listEmpresasConfigurator(): Promise<EmpresaListRow[]> {
  const rows = await runDomainQuery<EmpresaDbRow[]>((client) => {
    const query = client
      .from("empresa")
      .select(EMPRESA_LIST_COLUMNS)
      .order("razon_social", { ascending: true })
      .limit(DEFAULT_LIST_LIMIT);

    return query as unknown as Promise<{
      data: EmpresaDbRow[] | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map(mapEmpresaRow);
}

export interface CreateEmpresaInput {
  codigoEmpresa: string;
  razonSocial: string;
  telefono?: string | null;
  idCreador?: string | null;
}

async function assertCodigoEmpresaDisponible(codigoEmpresa: string): Promise<void> {
  const rows = await runDomainQuery<{ codigo_empresa: string }[]>((client) => {
    const query = client
      .from("empresa")
      .select("codigo_empresa")
      .eq("codigo_empresa", codigoEmpresa)
      .limit(1);

    return query as unknown as Promise<{
      data: { codigo_empresa: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  if (rows.length > 0) {
    throw new DomainServiceError(
      "Ya existe una empresa con ese código.",
      "INVALID_ARGUMENT",
    );
  }
}

/** Crea una empresa desde el configurador (scope platform). */
export async function createEmpresaConfigurator(
  input: CreateEmpresaInput,
): Promise<EmpresaListRow> {
  const razonSocial = input.razonSocial.trim();
  const codigoEmpresa = normalizeCodigoCuentaInput(input.codigoEmpresa);
  const telefonoRaw = input.telefono?.trim() ?? "";

  if (!razonSocial) {
    throw new DomainServiceError(
      "La razón social es obligatoria.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "El código de empresa es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (telefonoRaw && !isValidInternationalPhone(telefonoRaw)) {
    throw new DomainServiceError(
      "El teléfono de la empresa no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefono = telefonoRaw
    ? normalizeInternationalPhone(telefonoRaw)
    : null;

  await assertCodigoEmpresaDisponible(codigoEmpresa);

  await runDomainMutation<{ codigo_empresa: string } | null>((client) => {
    const query = client.from("empresa").insert({
      codigo_empresa: codigoEmpresa,
      razon_social: razonSocial,
      telefono,
      id_creador: input.idCreador ?? null,
      esta_activa: true,
    });

    return query as unknown as Promise<{
      data: { codigo_empresa: string } | null;
      error: { message: string } | null;
    }>;
  });

  return {
    codigoEmpresa,
    razonSocial,
    telefono,
    estaActiva: true,
  };
}

export interface UpdateEmpresaInput {
  codigoEmpresa: string;
  razonSocial: string;
  telefono?: string | null;
  estaActiva: boolean;
}

/** Actualiza una empresa vía API Nest (scope platform / configurador). */
export async function updateEmpresaConfigurator(
  input: UpdateEmpresaInput,
): Promise<EmpresaListRow> {
  const razonSocial = input.razonSocial.trim();
  const codigoEmpresa = normalizeCodigoCuentaInput(input.codigoEmpresa);
  const telefonoRaw = input.telefono?.trim() ?? "";

  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "El código de empresa es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!razonSocial) {
    throw new DomainServiceError(
      "La razón social es obligatoria.",
      "INVALID_ARGUMENT",
    );
  }

  if (telefonoRaw && !isValidInternationalPhone(telefonoRaw)) {
    throw new DomainServiceError(
      "El teléfono de la empresa no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefono = telefonoRaw
    ? normalizeInternationalPhone(telefonoRaw)
    : null;

  try {
    return await apiRequest<EmpresaListRow>(
      `/configuracion/empresas/${encodeURIComponent(codigoEmpresa)}`,
      {
        method: "PATCH",
        auth: true,
        body: {
          razonSocial,
          telefono,
          estaActiva: input.estaActiva,
        },
      },
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}
