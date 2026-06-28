import {
  DEFAULT_LIST_LIMIT,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/domain-service-error";
import { normalizeCodigoCuentaInput } from "@/lib/generate-codigo-cuenta";

export interface EmpresaListRow {
  codigoEmpresa: string;
  razonSocial: string;
  estaActiva: boolean;
}

interface EmpresaDbRow {
  codigo_empresa: string;
  razon_social: string;
  esta_activa: boolean;
}

const EMPRESA_LIST_COLUMNS = "codigo_empresa,razon_social,esta_activa";

function mapEmpresaRow(row: EmpresaDbRow): EmpresaListRow {
  return {
    codigoEmpresa: row.codigo_empresa,
    razonSocial: row.razon_social,
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

  await assertCodigoEmpresaDisponible(codigoEmpresa);

  await runDomainMutation<{ codigo_empresa: string } | null>((client) => {
    const query = client.from("empresa").insert({
      codigo_empresa: codigoEmpresa,
      razon_social: razonSocial,
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
    estaActiva: true,
  };
}
