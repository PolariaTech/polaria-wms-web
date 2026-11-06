import {
  requireCodigoCuenta,
  runDomainMutation,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

/**
 * REQ-241: guarda solo el override de denominación comercial del comprador.
 * No toca `apodo` (valor del sync con el tercero).
 */
export async function patchCompradorDenominacionOverride(params: {
  codigoCuenta: string;
  idComprador: string;
  denominacionComercialOverride: string | null;
}): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idComprador = params.idComprador.trim();
  if (!idComprador) {
    throw new DomainServiceError(
      "Falta el identificador del comprador.",
      "INVALID_ARGUMENT",
    );
  }

  const override = params.denominacionComercialOverride?.trim() || null;

  const updated = await runDomainMutation<{ id_comprador: string } | null>(
    (client) => {
      const query = client
        .from("comprador")
        .update({ denominacion_comercial_override: override })
        .eq("id_comprador", idComprador)
        .eq("codigo_cuenta", codigoCuenta)
        .select("id_comprador")
        .maybeSingle();

      return query as unknown as Promise<{
        data: { id_comprador: string } | null;
        error: { message: string } | null;
      }>;
    },
  );

  if (!updated?.id_comprador) {
    throw new DomainServiceError(
      "No se pudo guardar la denominación comercial del cliente.",
      "MUTATION_FAILED",
    );
  }
}
