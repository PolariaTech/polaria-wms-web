import { runDomainMutation, runDomainQuery } from "@/lib/supabase/domain-query";
import { findCuentaAcrossSchemas } from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { normalizeCodigoCuentaInput } from "@/lib/utils/generate-codigo-cuenta";
import { withEmpresaSchema } from "./cuentas.service.shared";

export interface UpdateCuentaBodegaDefaultInput {
  codigoCuenta: string;
  idBodegaDefault: string;
}

/** Define la bodega por defecto de la cuenta (debe estar asignada).
 * Usa Supabase + schema emp_* (mismo path que el listado del configurador),
 * para no depender del tenant header de Nest al editar cuentas de otra empresa.
 */
export async function updateCuentaBodegaDefaultConfigurator(
  input: UpdateCuentaBodegaDefaultInput,
): Promise<{
  codigoCuenta: string;
  codigoEmpresa: string;
  nombreComercial: string;
  estaActiva: boolean;
  idBodegaDefault: string | null;
}> {
  const codigoCuenta = normalizeCodigoCuentaInput(input.codigoCuenta);
  const idBodegaDefault = input.idBodegaDefault.trim();

  if (!codigoCuenta) {
    throw new DomainServiceError(
      "El código de la cuenta es obligatorio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!idBodegaDefault) {
    throw new DomainServiceError(
      "Selecciona una bodega por defecto.",
      "INVALID_ARGUMENT",
    );
  }

  const cuenta = await findCuentaAcrossSchemas(codigoCuenta);
  if (!cuenta?.codigo_cuenta || !cuenta.codigo_empresa) {
    throw new DomainServiceError(
      "Cuenta no encontrada.",
      "INVALID_ARGUMENT",
    );
  }

  const updated = await withEmpresaSchema(cuenta.codigo_empresa, async () => {
    const bodegasDeCuenta = await runDomainQuery<{ id_bodega: string }[]>(
      (client) => {
        const query = client
          .from("bodega")
          .select("id_bodega")
          .eq("codigo_cuenta", codigoCuenta)
          .eq("id_bodega", idBodegaDefault)
          .eq("esta_activa", true)
          .limit(1);

        return query as unknown as Promise<{
          data: { id_bodega: string }[] | null;
          error: { message: string } | null;
        }>;
      },
    );

    if (bodegasDeCuenta.length === 0) {
      throw new DomainServiceError(
        "La bodega por defecto debe estar activa y asignada a esta cuenta.",
        "INVALID_ARGUMENT",
      );
    }

    return runDomainMutation<{
      codigo_cuenta: string;
      codigo_empresa: string;
      nombre_comercial: string;
      esta_activa: boolean;
      id_bodega_default: string | null;
    } | null>((client) => {
      const query = client
        .from("cuenta")
        .update({ id_bodega_default: idBodegaDefault })
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
    });
  });

  if (!updated) {
    throw new DomainServiceError(
      "No se pudo guardar la bodega por defecto.",
      "MUTATION_FAILED",
    );
  }

  return {
    codigoCuenta: updated.codigo_cuenta,
    codigoEmpresa: updated.codigo_empresa,
    nombreComercial: updated.nombre_comercial,
    estaActiva: updated.esta_activa,
    idBodegaDefault: updated.id_bodega_default?.trim() || null,
  };
}
