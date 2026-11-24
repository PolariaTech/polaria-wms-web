import { runDomainMutation, runDomainQuery } from "@/lib/supabase/domain-query";
import { findCuentaAcrossSchemas } from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import {
  resolveCuentaZonaHorariaId,
} from "@/modules/configurator/cuentas/constants/cuenta-zona-horaria";
import { withEmpresaSchema } from "./cuentas.service.shared";

export interface CuentaOvSlaConfig {
  codigoCuenta: string;
  codigoEmpresa: string;
  ovSlaMinutos: number;
  ovAlertaMinutos: number;
}

export interface UpdateCuentaOvSlaInput {
  codigoCuenta: string;
  codigoEmpresa: string;
  ovSlaMinutos: number;
  ovAlertaMinutos: number;
}

const OV_SLA_DEFAULT = 60;
const OV_ALERTA_DEFAULT = 45;

function normalizeOvMinutos(
  value: number | null | undefined,
  fallback: number,
): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

export interface CuentaZonaHorariaConfig {
  codigoCuenta: string;
  codigoEmpresa: string;
  zonaHoraria: string;
}

export interface UpdateCuentaZonaHorariaInput {
  codigoCuenta: string;
  codigoEmpresa: string;
  zonaHoraria: string;
}

const zonaHorariaInflight = new Map<
  string,
  Promise<CuentaZonaHorariaConfig | null>
>();

/** Lee zona horaria IANA de la cuenta (default America/Cancun). */
export async function getCuentaZonaHorariaConfigurator(
  codigoCuenta: string,
): Promise<CuentaZonaHorariaConfig | null> {
  const codigo = normalizeCodigoCuentaInput(codigoCuenta);
  if (!codigo) return null;

  const pending = zonaHorariaInflight.get(codigo);
  if (pending) return pending;

  const request = (async (): Promise<CuentaZonaHorariaConfig | null> => {
    const cuenta = await findCuentaAcrossSchemas(codigo);
    if (!cuenta?.codigo_cuenta || !cuenta.codigo_empresa) return null;

    const row = await withEmpresaSchema(cuenta.codigo_empresa, () =>
      runDomainQuery<{
        codigo_cuenta: string;
        codigo_empresa: string;
        zona_horaria: string | null;
      } | null>((client) => {
        const query = client
          .from("cuenta")
          .select("codigo_cuenta,codigo_empresa,zona_horaria")
          .eq("codigo_cuenta", codigo)
          .maybeSingle();

        return query as unknown as Promise<{
          data: {
            codigo_cuenta: string;
            codigo_empresa: string;
            zona_horaria: string | null;
          } | null;
          error: { message: string } | null;
        }>;
      }),
    );

    if (!row) return null;

    return {
      codigoCuenta: row.codigo_cuenta,
      codigoEmpresa: row.codigo_empresa,
      zonaHoraria: resolveCuentaZonaHorariaId(row.zona_horaria),
    };
  })().finally(() => {
    zonaHorariaInflight.delete(codigo);
  });

  zonaHorariaInflight.set(codigo, request);
  return request;
}

/** Guarda zona horaria IANA por cuenta. */
export async function updateCuentaZonaHorariaConfigurator(
  input: UpdateCuentaZonaHorariaInput,
): Promise<CuentaZonaHorariaConfig> {
  const codigoCuenta = normalizeCodigoCuentaInput(input.codigoCuenta);
  const codigoEmpresa = input.codigoEmpresa.trim().toUpperCase();
  const zonaHoraria = resolveCuentaZonaHorariaId(input.zonaHoraria);

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "El código de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }
  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "La empresa de la cuenta es obligatoria.",
      "INVALID_ARGUMENT",
    );
  }

  const updated = await withEmpresaSchema(codigoEmpresa, () =>
    runDomainMutation<{
      codigo_cuenta: string;
      codigo_empresa: string;
      zona_horaria: string;
    } | null>((client) => {
      const query = client
        .from("cuenta")
        .update({ zona_horaria: zonaHoraria })
        .eq("codigo_cuenta", codigoCuenta)
        .select("codigo_cuenta,codigo_empresa,zona_horaria")
        .single();

      return query as unknown as Promise<{
        data: {
          codigo_cuenta: string;
          codigo_empresa: string;
          zona_horaria: string;
        } | null;
        error: { message: string } | null;
      }>;
    }),
  );

  if (!updated) {
    throw new DomainServiceError("Cuenta no encontrada.", "INVALID_ARGUMENT");
  }

  return {
    codigoCuenta: updated.codigo_cuenta,
    codigoEmpresa: updated.codigo_empresa,
    zonaHoraria: resolveCuentaZonaHorariaId(updated.zona_horaria),
  };
}

/** Lee umbrales SLA/alerta OV de la cuenta (schema empresa o public). */
export async function getCuentaOvSlaConfigurator(
  codigoCuenta: string,
): Promise<CuentaOvSlaConfig | null> {
  const codigo = normalizeCodigoCuentaInput(codigoCuenta);
  if (!codigo) return null;

  const cuenta = await findCuentaAcrossSchemas(codigo);
  if (!cuenta?.codigo_cuenta || !cuenta.codigo_empresa) return null;

  const row = await withEmpresaSchema(cuenta.codigo_empresa, () =>
    runDomainQuery<{
      codigo_cuenta: string;
      codigo_empresa: string;
      ov_sla_minutos: number | null;
      ov_alerta_minutos: number | null;
    } | null>((client) => {
      const query = client
        .from("cuenta")
        .select("codigo_cuenta,codigo_empresa,ov_sla_minutos,ov_alerta_minutos")
        .eq("codigo_cuenta", codigo)
        .maybeSingle();

      return query as unknown as Promise<{
        data: {
          codigo_cuenta: string;
          codigo_empresa: string;
          ov_sla_minutos: number | null;
          ov_alerta_minutos: number | null;
        } | null;
        error: { message: string } | null;
      }>;
    }),
  );

  if (!row) return null;

  return {
    codigoCuenta: row.codigo_cuenta,
    codigoEmpresa: row.codigo_empresa,
    ovSlaMinutos: normalizeOvMinutos(row.ov_sla_minutos, OV_SLA_DEFAULT),
    ovAlertaMinutos: normalizeOvMinutos(row.ov_alerta_minutos, OV_ALERTA_DEFAULT),
  };
}

/** Guarda umbrales SLA/alerta OV por cuenta. */
export async function updateCuentaOvSlaConfigurator(
  input: UpdateCuentaOvSlaInput,
): Promise<CuentaOvSlaConfig> {
  const codigoCuenta = normalizeCodigoCuentaInput(input.codigoCuenta);
  const codigoEmpresa = input.codigoEmpresa.trim().toUpperCase();
  const ovSlaMinutos = Math.trunc(input.ovSlaMinutos);
  const ovAlertaMinutos = Math.trunc(input.ovAlertaMinutos);

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "El código de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }
  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "La empresa de la cuenta es obligatoria.",
      "INVALID_ARGUMENT",
    );
  }
  if (!Number.isFinite(ovSlaMinutos) || ovSlaMinutos < 1) {
    throw new DomainServiceError(
      "El SLA debe ser al menos 1 minuto.",
      "INVALID_ARGUMENT",
    );
  }
  if (!Number.isFinite(ovAlertaMinutos) || ovAlertaMinutos < 1) {
    throw new DomainServiceError(
      "La alerta debe ser al menos 1 minuto.",
      "INVALID_ARGUMENT",
    );
  }
  if (ovAlertaMinutos > ovSlaMinutos) {
    throw new DomainServiceError(
      "La alerta no puede ser mayor que el SLA.",
      "INVALID_ARGUMENT",
    );
  }

  const updated = await withEmpresaSchema(codigoEmpresa, () =>
    runDomainMutation<{
      codigo_cuenta: string;
      codigo_empresa: string;
      ov_sla_minutos: number;
      ov_alerta_minutos: number;
    } | null>((client) => {
      const query = client
        .from("cuenta")
        .update({
          ov_sla_minutos: ovSlaMinutos,
          ov_alerta_minutos: ovAlertaMinutos,
        })
        .eq("codigo_cuenta", codigoCuenta)
        .select("codigo_cuenta,codigo_empresa,ov_sla_minutos,ov_alerta_minutos")
        .single();

      return query as unknown as Promise<{
        data: {
          codigo_cuenta: string;
          codigo_empresa: string;
          ov_sla_minutos: number;
          ov_alerta_minutos: number;
        } | null;
        error: { message: string } | null;
      }>;
    }),
  );

  if (!updated) {
    throw new DomainServiceError("Cuenta no encontrada.", "INVALID_ARGUMENT");
  }

  return {
    codigoCuenta: updated.codigo_cuenta,
    codigoEmpresa: updated.codigo_empresa,
    ovSlaMinutos: updated.ov_sla_minutos,
    ovAlertaMinutos: updated.ov_alerta_minutos,
  };
}
