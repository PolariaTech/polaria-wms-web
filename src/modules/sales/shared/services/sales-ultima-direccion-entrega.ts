import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";

/**
 * REQ-252: última dirección de entrega de una OV ya confirmada (no por_confirmar)
 * del comprador / razón social. Sirve de default al armar un pedido nuevo.
 */
export async function fetchUltimaDireccionEntregaPorComprador(input: {
  codigoCuenta: string;
  idComprador: string;
}): Promise<string | null> {
  const cuenta = requireCodigoCuenta(input.codigoCuenta);
  const idComprador = input.idComprador.trim();
  if (!idComprador) return null;

  const rows = await runDomainQuery<
    { direccion_entrega: string | null }[]
  >((client) => {
    const query = client
      .from("orden_venta")
      .select("direccion_entrega")
      .eq("codigo_cuenta", cuenta)
      .eq("id_comprador", idComprador)
      .neq("estado", "por_confirmar")
      .neq("estado", "cancelada")
      .not("direccion_entrega", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20);

    return query as unknown as Promise<{
      data: { direccion_entrega: string | null }[] | null;
      error: { message: string } | null;
    }>;
  });

  for (const row of rows) {
    const direccion = row.direccion_entrega?.trim() || "";
    if (direccion) return direccion;
  }
  return null;
}
