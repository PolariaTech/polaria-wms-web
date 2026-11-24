import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  normalizeIdOrdenTrabajo,
  parseOrigenCorreoJson,
} from "../utils/origen/origen-correo-ordenes-trabajo";
import { filterLineasByOrdenTrabajoHija } from "../utils/ot/filter-lineas-by-orden-trabajo";
import { buildOrdenVentaPatchFromSurtido } from "./sync-surtido-to-orden-venta";
import { adminFrom, emptyToNull, resolveOrdenAdminContext } from "./orden-surtido-admin";
import { resolveTituloProducto } from "./orden-surtido-captura-mappers";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

/**
 * Propaga el payload de la foto a columnas flat / observaciones / cantidades
 * despachadas de la OV. Solo escribe lo que la IA trajo con valor.
 * Los campos de pedido (fecha, centro, OC, dirección) solo se llenan si
 * estaban vacíos; chofer/unidad/turno/hora sí se actualizan siempre.
 */
export async function applySurtidoCapturaToOrdenVenta(input: {
  idOrdenVenta: string;
  idOrdenTrabajo?: string | null;
  payload: OrdenSurtidoCapturaPayload;
}): Promise<{
  updatedHeader: boolean;
  updatedLineas: number;
}> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin no configurado.");

  const ctx = await resolveOrdenAdminContext(admin, input.idOrdenVenta);
  if (!ctx) {
    throw new Error("Orden de venta no encontrada para sincronizar surtido.");
  }

  const { data: orden, error: ordenError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .select(
      "id_orden_venta,observaciones,turno,hora_salida,chofer,unidad,centro_consumo,fecha_entrega,orden_compra_hotel,direccion_entrega,notas_almacen,notas_lineas,origen_correo",
    )
    .eq("id_orden_venta", input.idOrdenVenta)
    .maybeSingle();

  if (ordenError) throw new Error(ordenError.message);
  if (!orden) {
    throw new Error("Orden de venta no encontrada para sincronizar surtido.");
  }

  let lineasDb: Array<{
    id_linea_orden_venta: string;
    cantidad_pedida: string | number;
    cantidad_despachada: string | number | null;
    producto: unknown;
  }> = [];
  const productosByIndex = new Map<number, string>();
  try {
    const { data: lineasRaw, error: lineasError } = await adminFrom(
      admin,
      ctx.schemaName,
      "orden_venta_linea",
    )
      .select(
        "id_linea_orden_venta,cantidad_pedida,cantidad_despachada,producto:producto(sku,descripcion,metadatos_catalogo)",
      )
      .eq("id_orden_venta", input.idOrdenVenta)
      .order("id_linea_orden_venta", { ascending: true })
      .limit(200);

    if (lineasError) throw new Error(lineasError.message);
    const allLineas = (lineasRaw ?? []) as typeof lineasDb;

    const ot = normalizeIdOrdenTrabajo(input.idOrdenTrabajo);
    const hijas = groupOrigenCorreoToOrdenesTrabajo(
      parseOrigenCorreoJson(
        (orden as { origen_correo?: unknown }).origen_correo,
      ),
    );
    const hija = ot ? (hijas.find((item) => item.id === ot) ?? null) : null;

    if (hija) {
      const matched = filterLineasByOrdenTrabajoHija(allLineas, hija);
      lineasDb = matched.length > 0 ? matched : allLineas;
    } else {
      lineasDb = allLineas;
    }

    lineasDb.forEach((linea, index) => {
      productosByIndex.set(index + 1, resolveTituloProducto(linea.producto));
    });
  } catch (lineasLookupError) {
    console.error(
      "[captura-orden] no se pudieron leer líneas para sync:",
      lineasLookupError instanceof Error
        ? lineasLookupError.message
        : lineasLookupError,
    );
  }

  const { flat, lineas: lineasPatch } = buildOrdenVentaPatchFromSurtido({
    payload: input.payload,
    observacionesActuales: orden.observaciones,
    notasAlmacenActuales: orden.notas_almacen,
    notasLineasActuales: orden.notas_lineas,
    productosByIndex,
  });

  const headerUpdate: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };
  if (flat.turno) headerUpdate.turno = flat.turno;
  if (flat.hora_salida) headerUpdate.hora_salida = flat.hora_salida;
  if (flat.chofer) headerUpdate.chofer = flat.chofer;
  if (flat.unidad) headerUpdate.unidad = flat.unidad;
  if (flat.notas_almacen) headerUpdate.notas_almacen = flat.notas_almacen;
  if (flat.notas_lineas) headerUpdate.notas_lineas = flat.notas_lineas;
  if (flat.observaciones) headerUpdate.observaciones = flat.observaciones;

  if (flat.centro_consumo && !emptyToNull(orden.centro_consumo)) {
    headerUpdate.centro_consumo = flat.centro_consumo;
  }
  if (flat.fecha_entrega && !emptyToNull(orden.fecha_entrega)) {
    headerUpdate.fecha_entrega = flat.fecha_entrega;
  }
  if (flat.orden_compra_hotel && !emptyToNull(orden.orden_compra_hotel)) {
    headerUpdate.orden_compra_hotel = flat.orden_compra_hotel;
  }
  if (flat.direccion_entrega && !emptyToNull(orden.direccion_entrega)) {
    headerUpdate.direccion_entrega = flat.direccion_entrega;
  }

  const { error: updateHeaderError } = await adminFrom(
    admin,
    ctx.schemaName,
    "orden_venta",
  )
    .update(headerUpdate)
    .eq("id_orden_venta", input.idOrdenVenta);

  if (updateHeaderError) throw new Error(updateHeaderError.message);

  let updatedLineas = 0;
  for (const patch of lineasPatch) {
    const linea = lineasDb[patch.indice - 1];
    if (!linea) continue;

    const pedida = Number(linea.cantidad_pedida) || 0;
    const despachada = Math.min(
      patch.cantidadDespachada,
      pedida > 0 ? pedida : patch.cantidadDespachada,
    );

    const { error: lineError } = await adminFrom(
      admin,
      ctx.schemaName,
      "orden_venta_linea",
    )
      .update({ cantidad_despachada: despachada })
      .eq("id_linea_orden_venta", linea.id_linea_orden_venta);

    if (lineError) throw new Error(lineError.message);
    updatedLineas += 1;
  }

  return {
    updatedHeader: Object.keys(headerUpdate).length > 1,
    updatedLineas,
  };
}