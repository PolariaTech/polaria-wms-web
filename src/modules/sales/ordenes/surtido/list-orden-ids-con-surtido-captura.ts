import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";

/** IDs de OV que ya tienen captura de surtido (PDF actualizado disponible). */
export async function listOrdenIdsConSurtidoCaptura(input: {
  codigoCuenta: string;
  idOrdenes: string[];
}): Promise<Set<string>> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const ids = [
    ...new Set(input.idOrdenes.map((id) => id.trim()).filter(Boolean)),
  ];
  if (ids.length === 0) return new Set();

  const rows = await runDomainQuery<Array<{ id_orden_venta: string }>>(
    (client) => {
      const query = client
        .from("orden_venta_surtido_captura")
        .select("id_orden_venta")
        .eq("codigo_cuenta", codigoCuenta)
        .in("id_orden_venta", ids)
        .limit(Math.min(ids.length, 500));

      return query as unknown as Promise<{
        data: Array<{ id_orden_venta: string }> | null;
        error: { message: string } | null;
      }>;
    },
  );

  return new Set(rows.map((row) => row.id_orden_venta));
}
