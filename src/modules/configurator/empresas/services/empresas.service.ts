import {
  DEFAULT_LIST_LIMIT,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
} from "@/constants/ui/phone-countries";
import { ApiError, apiRequest } from "@/services/api/api";
import {
  cuerpoConLogo,
  mensajeFicha,
  mensajeLogo,
  type EmpresaFichaCampos,
  type EmpresaFichaGuardada,
} from "../domain/empresa-ficha-fiscal";

export interface EmpresaListRow extends EmpresaFichaGuardada {
  codigoEmpresa: string;
  razonSocial: string;
  telefono: string | null;
  estaActiva: boolean;
  schemaName: string | null;
}

interface EmpresaDbRow {
  codigo_empresa: string;
  razon_social: string;
  telefono: string | null;
  esta_activa: boolean;
  schema_name: string | null;
  rfc: string | null;
  regimen_fiscal: string | null;
  codigo_postal_expedicion: string | null;
  nombre_cuenta_bancaria: string | null;
  banco: string | null;
  clabe: string | null;
  correo_cobranza: string | null;
  serie_factura: string | null;
  logo_path: string | null;
}

const EMPRESA_LIST_COLUMNS =
  "codigo_empresa,razon_social,telefono,esta_activa,schema_name,rfc,regimen_fiscal,codigo_postal_expedicion,nombre_cuenta_bancaria,banco,clabe,correo_cobranza,serie_factura,logo_path";

function mapEmpresaRow(row: EmpresaDbRow): EmpresaListRow {
  return {
    codigoEmpresa: row.codigo_empresa,
    razonSocial: row.razon_social,
    telefono: row.telefono,
    estaActiva: row.esta_activa,
    schemaName: row.schema_name ?? null,
    rfc: row.rfc ?? null,
    regimenFiscal: row.regimen_fiscal ?? null,
    codigoPostalExpedicion: row.codigo_postal_expedicion ?? null,
    nombreCuentaBancaria: row.nombre_cuenta_bancaria ?? null,
    banco: row.banco ?? null,
    clabe: row.clabe ?? null,
    correoCobranza: row.correo_cobranza ?? null,
    serieFactura: row.serie_factura ?? null,
    logoPath: row.logo_path ?? null,
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

export interface EmpresaFichaInput extends Partial<
  Omit<EmpresaFichaGuardada, "logoPath">
> {
  logo?: File | null;
  quitarLogo?: boolean;
}

export interface CreateEmpresaInput extends EmpresaFichaInput {
  codigoEmpresa: string;
  razonSocial: string;
  telefono?: string | null;
  idCreador?: string | null;
}

function fichaDelInput(input: EmpresaFichaInput) {
  return {
    rfc: input.rfc ?? null,
    regimenFiscal: input.regimenFiscal ?? null,
    codigoPostalExpedicion: input.codigoPostalExpedicion ?? null,
    nombreCuentaBancaria: input.nombreCuentaBancaria ?? null,
    banco: input.banco ?? null,
    clabe: input.clabe ?? null,
    correoCobranza: input.correoCobranza ?? null,
    serieFactura: input.serieFactura ?? null,
  };
}

function exigirFicha(input: EmpresaFichaInput): void {
  const mensaje = mensajeFicha({
    rfc: input.rfc ?? "",
    regimenFiscal: input.regimenFiscal ?? "",
    codigoPostalExpedicion: input.codigoPostalExpedicion ?? "",
    nombreCuentaBancaria: input.nombreCuentaBancaria ?? "",
    banco: input.banco ?? "",
    clabe: input.clabe ?? "",
    correoCobranza: input.correoCobranza ?? "",
    serieFactura: input.serieFactura ?? "",
  } satisfies EmpresaFichaCampos);
  if (mensaje) {
    throw new DomainServiceError(mensaje, "INVALID_ARGUMENT");
  }
  if (input.logo) {
    const logo = mensajeLogo(input.logo);
    if (logo) throw new DomainServiceError(logo, "INVALID_ARGUMENT");
  }
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

/** Crea una empresa vía API Nest (provisiona schema emp_* automáticamente). */
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
      "Ingresa un número de teléfono válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefono = telefonoRaw
    ? normalizeInternationalPhone(telefonoRaw)
    : null;

  await assertCodigoEmpresaDisponible(codigoEmpresa);
  exigirFicha(input);
  const ficha = fichaDelInput(input);
  const campos = {
    codigoEmpresa,
    razonSocial,
    telefono,
    idCreador: input.idCreador ?? null,
    ...ficha,
  };

  try {
    return await apiRequest<EmpresaListRow>("/configuracion/empresas", {
      method: "POST",
      auth: true,
      body: input.logo ? cuerpoConLogo(campos, input.logo) : campos,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

export interface UpdateEmpresaInput extends EmpresaFichaInput {
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
      "Ingresa un número de teléfono válido.",
      "INVALID_ARGUMENT",
    );
  }

  const telefono = telefonoRaw
    ? normalizeInternationalPhone(telefonoRaw)
    : null;

  exigirFicha(input);
  const ficha = fichaDelInput(input);
  const campos = {
    razonSocial,
    telefono,
    estaActiva: input.estaActiva,
    ...ficha,
    ...(input.quitarLogo ? { logoPath: null } : {}),
  };

  try {
    return await apiRequest<EmpresaListRow>(
      `/configuracion/empresas/${encodeURIComponent(codigoEmpresa)}`,
      {
        method: "PATCH",
        auth: true,
        body: input.logo ? cuerpoConLogo(campos, input.logo) : campos,
      },
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}
