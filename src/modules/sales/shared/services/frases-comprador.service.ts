import {
  requireCodigoCuenta,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import type { ProductoVentaOption } from "../types/sales.types";

export async function productosConFrasesDelComprador(params: {
  codigoCuenta: string;
  idComprador: string | null | undefined;
  productos: readonly ProductoVentaOption[];
}): Promise<ProductoVentaOption[]> {
  const idComprador = params.idComprador?.trim();
  if (!idComprador) return [...params.productos];

  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const filas = await runDomainQuery<
    { id_producto: string; alias: string | null }[]
  >((client) => {
    const query = client
      .from("comprador_producto_alias")
      .select("id_producto, alias")
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_comprador", idComprador);

    return query as unknown as Promise<{
      data: { id_producto: string; alias: string | null }[] | null;
      error: { message: string } | null;
    }>;
  });

  const frasesPorProducto = new Map<string, string[]>();
  for (const fila of filas ?? []) {
    const frase = fila.alias?.trim();
    if (!frase) continue;
    const lista = frasesPorProducto.get(fila.id_producto) ?? [];
    lista.push(frase);
    frasesPorProducto.set(fila.id_producto, lista);
  }

  return params.productos.map((producto) => ({
    ...producto,
    frasesCliente: frasesPorProducto.get(producto.idProducto) ?? [],
  }));
}
