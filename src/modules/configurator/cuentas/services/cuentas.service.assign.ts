import { runDomainMutation } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import { type CuentaListRow, withEmpresaSchema } from "./cuentas.service.shared";
import { type CreateCuentaInput } from "./cuentas.service.list";

/** Crea una cuenta comercial desde el configurador (scope platform). */
export async function createCuentaConfigurator(
  input: CreateCuentaInput,
): Promise<CuentaListRow> {
  const nombreComercial = input.nombreComercial.trim();
  const codigoCuenta = normalizeCodigoCuentaInput(input.codigoCuenta);
  const codigoEmpresa = input.codigoEmpresa.trim();

  if (!nombreComercial) {
    throw new DomainServiceError(
      "El nombre de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "El código de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!codigoEmpresa) {
    throw new DomainServiceError(
      "Selecciona la empresa a asociar.",
      "INVALID_ARGUMENT",
    );
  }

  await withEmpresaSchema(codigoEmpresa, async () => {
    await runDomainMutation<{ codigo_cuenta: string } | null>((client) => {
      const query = client.from("cuenta").insert({
        codigo_cuenta: codigoCuenta,
        codigo_empresa: codigoEmpresa,
        nombre_comercial: nombreComercial,
        id_creador: input.idCreador ?? null,
        esta_activa: true,
      });

      return query as unknown as Promise<{
        data: { codigo_cuenta: string } | null;
        error: { message: string } | null;
      }>;
    });
  });

  return {
    codigoCuenta,
    codigoEmpresa,
    nombreComercial,
    bodegasAsignadas: [],
    bodegaInternaPrincipal: null,
    idBodegaDefault: null,
    estaActiva: true,
    accesoWms: true,
    accesoMateo: true,
    tieneCredenciales: false,
  };
}

export interface UpdateCuentaInput {
  codigoCuenta: string;
  codigoEmpresa: string;
  nombreComercial: string;
  /** Acceso: false bloquea login de usuarios de la cuenta. */
  estaActiva: boolean;
}

/**
 * Actualiza nombre e inicio de sesión de la cuenta en el schema de la empresa.
 * Los productos WMS/Mateo se conceden por usuario.
 */
export async function updateCuentaConfigurator(
  input: UpdateCuentaInput,
): Promise<{
  codigoCuenta: string;
  codigoEmpresa: string;
  nombreComercial: string;
  estaActiva: boolean;
  idBodegaDefault: string | null;
}> {
  const codigoCuenta = normalizeCodigoCuentaInput(input.codigoCuenta);
  const codigoEmpresa = input.codigoEmpresa.trim().toUpperCase();
  const nombreComercial = input.nombreComercial.trim();

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

  if (!nombreComercial) {
    throw new DomainServiceError(
      "El nombre de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  const updated = await withEmpresaSchema(codigoEmpresa, () =>
    runDomainMutation<{
      codigo_cuenta: string;
      codigo_empresa: string;
      nombre_comercial: string;
      esta_activa: boolean;
      id_bodega_default: string | null;
    } | null>((client) => {
      const query = client
        .from("cuenta")
        .update({
          nombre_comercial: nombreComercial,
          esta_activa: input.estaActiva,
        })
        .eq("codigo_cuenta", codigoCuenta)
        .select(
          "codigo_cuenta,codigo_empresa,nombre_comercial,esta_activa,id_bodega_default",
        )
        .single();

      return query as unknown as Promise<{
        data: {
          codigo_cuenta: string;
          codigo_empresa: string;
          nombre_comercial: string;
          esta_activa: boolean;
          id_bodega_default: string | null;
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
    nombreComercial: updated.nombre_comercial,
    estaActiva: updated.esta_activa,
    idBodegaDefault: updated.id_bodega_default?.trim() || null,
  };
}
