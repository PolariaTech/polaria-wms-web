import {
  requireCodigoCuenta,
  runDomainMutation,
  runDomainQuery,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  mapLatestPrecioProductoById,
  type PrecioProductoRow,
} from "@/modules/sales/shared/utils/sales-precio";
import type {
  InsertPrecioProductoVigenteParams,
  ListPreciosProductoVigentesParams,
} from "./productos-catalogo.types";

const PRECIO_PRODUCTO_IN_CHUNK = 80;

/** Precio vigente por producto desde `precio_producto` (última fecha_aplicacion). */
export async function listPreciosProductoVigentesAdmin(
  params: ListPreciosProductoVigentesParams,
): Promise<Record<string, number>> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const uniqueIds = [
    ...new Set(params.idProductos.map((id) => id.trim()).filter(Boolean)),
  ];

  if (uniqueIds.length === 0) return {};

  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += PRECIO_PRODUCTO_IN_CHUNK) {
    chunks.push(uniqueIds.slice(i, i + PRECIO_PRODUCTO_IN_CHUNK));
  }

  const chunkRows = await Promise.all(
    chunks.map((chunk) =>
      runDomainQuery<PrecioProductoRow[]>((client) => {
        const query = client
          .from("precio_producto")
          .select("id_producto,precio,fecha_aplicacion")
          .eq("codigo_cuenta", codigoCuenta)
          .in("id_producto", chunk)
          .order("fecha_aplicacion", { ascending: false })
          .limit(Math.min(chunk.length * 20, 1000));

        return query as unknown as Promise<{
          data: PrecioProductoRow[] | null;
          error: { message: string } | null;
        }>;
      }),
    ),
  );

  return Object.fromEntries(mapLatestPrecioProductoById(chunkRows.flat()));
}

/** Inserta un precio vigente (historial: la fila más reciente manda). */
export async function insertPrecioProductoVigenteAdmin(
  params: InsertPrecioProductoVigenteParams,
): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idProducto = params.idProducto.trim();
  const precio = params.precio;
  const moneda = (params.moneda?.trim() || "MXN").toUpperCase();

  if (!idProducto) {
    throw new DomainServiceError(
      "Falta el producto para actualizar el precio.",
      "INVALID_ARGUMENT",
    );
  }

  if (!Number.isFinite(precio) || precio < 0) {
    throw new DomainServiceError(
      "Ingresa un precio válido (0 o mayor).",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation((client) => {
    const query = client.from("precio_producto").insert({
      codigo_cuenta: codigoCuenta,
      id_producto: idProducto,
      precio,
      moneda,
      fecha_aplicacion: new Date().toISOString(),
    });

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}