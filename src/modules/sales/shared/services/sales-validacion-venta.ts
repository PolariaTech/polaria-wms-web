import { runDomainQuery } from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { resolveClienteCuentaDefault } from "./sales-resolve-cliente-cuenta-default";
import { resolveBodegaIdsForCuenta } from "./sales-stock-venta";

export async function resolveBodegaVenta(
  codigoCuenta: string,
  idBodega?: string | null,
): Promise<string> {
  const preferred = idBodega?.trim();
  if (preferred) {
    return preferred;
  }

  const ids = await resolveBodegaIdsForCuenta(codigoCuenta);
  const resolved = ids[0]?.trim();
  if (!resolved) {
    throw new DomainServiceError(
      "No hay bodega activa vinculada a la cuenta.",
      "INVALID_ARGUMENT",
    );
  }

  return resolved;
}

export async function resolveClienteVenta(
  codigoCuenta: string,
  idProducto: string,
): Promise<string> {
  const productoRows = await runDomainQuery<
    { id_producto: string; id_cliente: string | null }[]
  >((client) => {
    const query = client
      .from("producto")
      .select("id_producto,id_cliente")
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_producto", idProducto)
      .limit(1);

    return query as unknown as Promise<{
      data: { id_producto: string; id_cliente: string | null }[] | null;
      error: { message: string } | null;
    }>;
  });

  const producto = productoRows[0];
  if (!producto) {
    throw new DomainServiceError(
      "El producto seleccionado no es válido.",
      "INVALID_ARGUMENT",
    );
  }

  if (producto.id_cliente?.trim()) {
    return producto.id_cliente.trim();
  }

  return resolveClienteCuentaDefault(codigoCuenta);
}

export async function assertCompradorDeCuenta(
  codigoCuenta: string,
  idComprador: string,
): Promise<void> {
  const rows = await runDomainQuery<{ id_comprador: string }[]>((client) => {
    const query = client
      .from("comprador")
      .select("id_comprador")
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_comprador", idComprador)
      .eq("esta_activo", true)
      .limit(1);

    return query as unknown as Promise<{
      data: { id_comprador: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  if (!rows[0]) {
    throw new DomainServiceError(
      "El comprador seleccionado no es válido.",
      "INVALID_ARGUMENT",
    );
  }
}
