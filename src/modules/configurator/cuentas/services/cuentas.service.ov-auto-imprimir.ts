import { runDomainMutation, runDomainQuery } from "@/lib/supabase/domain-query";
import { findCuentaAcrossSchemas } from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import { withEmpresaSchema } from "./cuentas.service.shared";

export interface CuentaOvAutoImprimirConfig {
  codigoCuenta: string;
  codigoEmpresa: string;
  autoImprimir: boolean;
}

export interface UpdateCuentaOvAutoImprimirInput {
  codigoCuenta: string;
  codigoEmpresa: string;
  autoImprimir: boolean;
}

/** Lee si la cuenta autoimprime OV al Validar y enviar. */
export async function getCuentaOvAutoImprimirConfigurator(
  codigoCuenta: string,
): Promise<CuentaOvAutoImprimirConfig | null> {
  const codigo = normalizeCodigoCuentaInput(codigoCuenta);
  if (!codigo) return null;

  const cuenta = await findCuentaAcrossSchemas(codigo);
  if (!cuenta?.codigo_cuenta || !cuenta.codigo_empresa) return null;

  const row = await withEmpresaSchema(cuenta.codigo_empresa, () =>
    runDomainQuery<{
      codigo_cuenta: string;
      codigo_empresa: string;
      ov_auto_imprimir: boolean | null;
    } | null>((client) => {
      const query = client
        .from("cuenta")
        .select("codigo_cuenta,codigo_empresa,ov_auto_imprimir")
        .eq("codigo_cuenta", codigo)
        .maybeSingle();

      return query as unknown as Promise<{
        data: {
          codigo_cuenta: string;
          codigo_empresa: string;
          ov_auto_imprimir: boolean | null;
        } | null;
        error: { message: string } | null;
      }>;
    }),
  );

  if (!row) return null;

  return {
    codigoCuenta: row.codigo_cuenta,
    codigoEmpresa: row.codigo_empresa,
    autoImprimir: Boolean(row.ov_auto_imprimir),
  };
}

/** Activa o desactiva autoimpresión OV al Validar y enviar (por cuenta). */
export async function updateCuentaOvAutoImprimirConfigurator(
  input: UpdateCuentaOvAutoImprimirInput,
): Promise<CuentaOvAutoImprimirConfig> {
  const codigoCuenta = normalizeCodigoCuentaInput(input.codigoCuenta);
  const codigoEmpresa = input.codigoEmpresa.trim().toUpperCase();

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
      ov_auto_imprimir: boolean;
    } | null>((client) => {
      const query = client
        .from("cuenta")
        .update({ ov_auto_imprimir: Boolean(input.autoImprimir) })
        .eq("codigo_cuenta", codigoCuenta)
        .select("codigo_cuenta,codigo_empresa,ov_auto_imprimir")
        .single();

      return query as unknown as Promise<{
        data: {
          codigo_cuenta: string;
          codigo_empresa: string;
          ov_auto_imprimir: boolean;
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
    autoImprimir: Boolean(updated.ov_auto_imprimir),
  };
}
